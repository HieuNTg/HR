import { create } from "zustand"
import type { GeneratedQuestion, AnswerEvaluation, InterviewReportData } from "@/lib/services/interview-ai-service"

// ─── Types ──────────────────────────────────────────────────────────────────

export type InterviewStep =
  | "idle"
  | "loading"
  | "error"
  | "greeting"
  | "questioning"
  | "evaluating"
  | "closing"
  | "generating-report"
  | "report"

export type InterviewMode = "TEXT" | "VOICE" | "HYBRID"
export type LiveSessionStatus = "idle" | "connecting" | "active" | "error" | "closed"
export type MediaPermission = "unknown" | "granted" | "denied"

export interface ChatMessage {
  id: string
  role: "ai" | "candidate"
  content: string
  timestamp: Date
}

interface QuestionResult {
  question: string
  answer: string
  evaluation: AnswerEvaluation
}

// ─── Store ──────────────────────────────────────────────────────────────────

interface InterviewState {
  // Interview metadata
  candidateId: string | null
  candidateName: string | null
  jobTitle: string | null

  // Flow state
  step: InterviewStep
  loading: boolean
  error: string | null

  // Questions & answers
  questions: GeneratedQuestion[]
  currentQuestionIndex: number
  results: QuestionResult[]

  // Chat messages (displayed in UI)
  messages: ChatMessage[]

  // Report
  report: InterviewReportData | null

  // Live session state
  interviewMode: InterviewMode
  liveSessionStatus: LiveSessionStatus
  isAiSpeaking: boolean
  mediaPermission: MediaPermission

  // Actions
  startInterview: (candidateId: string, dynamicPayload?: { candidate: unknown; jdTitle: string; jdDescription: string }) => Promise<void>
  retryStart: () => Promise<void>
  advanceFromGreeting: () => void
  sendAnswer: (answer: string) => Promise<void>
  endInterview: () => Promise<void>
  reset: () => void
  addMessage: (role: "ai" | "candidate", content: string) => void
  setInterviewMode: (mode: InterviewMode) => void
  setLiveSessionStatus: (status: LiveSessionStatus) => void
  setAiSpeaking: (speaking: boolean) => void
  addLiveTranscript: (role: "ai" | "candidate", text: string) => void
  saveLiveResults: () => Promise<void>
}

let messageCounter = 0
function nextMessageId() {
  return `msg-${++messageCounter}`
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  candidateId: null,
  candidateName: null,
  jobTitle: null,
  step: "idle",
  loading: false,
  error: null,
  questions: [],
  currentQuestionIndex: 0,
  results: [],
  messages: [],
  report: null,
  interviewMode: "TEXT",
  liveSessionStatus: "idle",
  isAiSpeaking: false,
  mediaPermission: "unknown",

  advanceFromGreeting() {
    if (get().step !== "greeting") return
    const q = get().questions[0]
    if (q) {
      get().addMessage("ai", q.questionText)
      set({ step: "questioning" })
    }
  },

  addMessage(role, content) {
    set((s) => ({
      messages: [...s.messages, { id: nextMessageId(), role, content, timestamp: new Date() }],
    }))
  },

  async startInterview(candidateId: string, dynamicPayload?: { candidate: unknown; jdTitle: string; jdDescription: string }, _retryCount = 0) {
    // Guard against double-invocation (React StrictMode / fast re-renders)
    if (_retryCount === 0 && get().step !== "idle" && get().step !== "error") return
    set({ step: "loading", loading: true, candidateId, error: null, _lastDynamicPayload: dynamicPayload ?? null })

    const MAX_RETRIES = 2

    try {
      const res = await fetch(`/api/interviews/${candidateId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dynamicPayload ?? {}),
      })
      if (!res.ok) throw new Error("Failed to start interview")
      const data = await res.json()

      const greetingMsg: ChatMessage = {
        id: nextMessageId(),
        role: "ai",
        content: data.greeting,
        timestamp: new Date(),
      }

      set({
        candidateName: data.candidateName,
        jobTitle: data.jobTitle,
        questions: data.questions,
        currentQuestionIndex: 0,
        results: [],
        messages: [greetingMsg],
        step: "greeting",
        loading: false,
      })
    } catch (error) {
      console.error(`Start interview error (attempt ${_retryCount + 1}/${MAX_RETRIES + 1}):`, error)
      if (_retryCount < MAX_RETRIES) {
        // Auto-retry after a short delay
        await new Promise((r) => setTimeout(r, 1500))
        return get().startInterview(candidateId, dynamicPayload, _retryCount + 1)
      }
      set({ step: "error", loading: false, error: "Không thể kết nối AI. Vui lòng thử lại." })
    }
  },

  async retryStart() {
    const { candidateId, _lastDynamicPayload } = get() as InterviewState & { _lastDynamicPayload?: unknown }
    if (!candidateId) return
    set({ step: "idle", error: null })
    await get().startInterview(candidateId, _lastDynamicPayload as never)
  },

  async sendAnswer(answer: string) {
    const { questions, currentQuestionIndex, jobTitle } = get()
    const currentQ = questions[currentQuestionIndex]
    if (!currentQ) return

    // Add candidate message
    get().addMessage("candidate", answer)
    set({ step: "evaluating", loading: true })

    try {
      const nextQ = questions[currentQuestionIndex + 1] ?? null

      const res = await fetch(`/api/interviews/${get().candidateId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: answer,
          currentQuestion: currentQ.questionText,
          nextQuestion: nextQ?.questionText ?? null,
          jobTitle,
        }),
      })
      if (!res.ok) throw new Error("Chat failed")
      const data = await res.json()

      // Store result
      set((s) => ({
        results: [...s.results, {
          question: currentQ.questionText,
          answer,
          evaluation: data.evaluation,
        }],
      }))

      // Add AI response
      get().addMessage("ai", data.aiResponse)

      // Move to next question or closing
      if (nextQ) {
        set({
          currentQuestionIndex: currentQuestionIndex + 1,
          step: "questioning",
          loading: false,
        })
      } else {
        set({ step: "closing", loading: false })
      }
    } catch (error) {
      console.error("Send answer error:", error)
      set({ loading: false, step: "questioning" })
      get().addMessage("ai", "Xin lỗi, có lỗi xảy ra. Bạn có thể trả lời lại không?")
    }
  },

  async endInterview() {
    const { candidateName, jobTitle, results } = get()
    if (!candidateName || !jobTitle) return

    set({ step: "generating-report", loading: true })

    try {
      const res = await fetch(`/api/interviews/${get().candidateId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName,
          jobTitle,
          questionsAndAnswers: results.map((r) => ({
            question: r.question,
            answer: r.answer,
            score: r.evaluation.score,
          })),
        }),
      })
      if (!res.ok) throw new Error("Report generation failed")
      const data = await res.json()

      set({ report: data.report, step: "report", loading: false })
    } catch (error) {
      console.error("Report error:", error)
      set({ loading: false, step: "closing" })
    }
  },

  setInterviewMode(mode) {
    set({ interviewMode: mode })
  },

  setLiveSessionStatus(status) {
    set({ liveSessionStatus: status })
  },

  setAiSpeaking(speaking) {
    set({ isAiSpeaking: speaking })
  },

  addLiveTranscript(role, text) {
    set((s) => ({
      messages: [...s.messages, { id: nextMessageId(), role, content: text, timestamp: new Date() }],
    }))
  },

  async saveLiveResults() {
    const { candidateId, candidateName, jobTitle, questions, messages } = get()
    if (!candidateId || !questions.length) return

    set({ step: "generating-report", loading: true })

    try {
      const res = await fetch(`/api/interviews/${candidateId}/save-live-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcripts: messages.map((m) => ({ role: m.role, text: m.content })), questions, candidateName, jobTitle }),
      })
      if (!res.ok) throw new Error("Save live results failed")
      const data = await res.json()

      // Populate results for report generation
      if (data.questionsAndAnswers?.length) {
        set({ results: data.questionsAndAnswers.map((qa: { question: string; answer: string; evaluation: AnswerEvaluation }) => ({
          question: qa.question,
          answer: qa.answer,
          evaluation: qa.evaluation,
        })) })
      }
    } catch (e) {
      console.error("saveLiveResults error:", e)
    }

    await get().endInterview()
  },

  reset() {
    messageCounter = 0
    set({
      candidateId: null,
      candidateName: null,
      jobTitle: null,
      step: "idle",
      loading: false,
      error: null,
      questions: [],
      currentQuestionIndex: 0,
      results: [],
      messages: [],
      report: null,
      interviewMode: "TEXT",
      liveSessionStatus: "idle",
      isAiSpeaking: false,
      mediaPermission: "unknown",
    })
  },
}))
