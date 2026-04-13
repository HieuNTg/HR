import { create } from "zustand"
import type { GeneratedQuestion, AnswerEvaluation, InterviewReportData } from "@/lib/services/interview-ai-service"
import { LIVE_INTERVIEW_QUESTIONS } from "@/lib/services/interview-ai-service"

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
  cvSummary: string | null
  jdDescription: string | null

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

  // Internal (retry support)
  _lastDynamicPayload: { candidate: unknown; jdTitle: string; jdDescription: string } | null
  _abortController: AbortController | null

  // Actions
  startInterview: (candidateId: string, dynamicPayload?: { candidate: unknown; jdTitle: string; jdDescription: string }, _retryCount?: number) => Promise<void>
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
  saveLiveResults: (audio?: Blob | null) => Promise<void>
}

let messageCounter = 0
function nextMessageId() {
  return `msg-${++messageCounter}`
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  candidateId: null,
  candidateName: null,
  jobTitle: null,
  cvSummary: null,
  jdDescription: null,
  step: "idle",
  loading: false,
  error: null,
  questions: [],
  currentQuestionIndex: 0,
  results: [],
  messages: [],
  report: null,
  interviewMode: "VOICE",
  liveSessionStatus: "idle",
  isAiSpeaking: false,
  mediaPermission: "unknown",
  _lastDynamicPayload: null,
  _abortController: null,

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

    // Abort any in-flight request before starting a new one
    get()._abortController?.abort()
    const controller = new AbortController()
    set({ step: "loading", loading: true, candidateId, error: null, _lastDynamicPayload: dynamicPayload ?? null, _abortController: controller })

    const MAX_RETRIES = 2

    try {
      const res = await fetch(`/api/interviews/${candidateId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dynamicPayload ?? {}),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error("Failed to start interview")
      const data = await res.json()

      // Response fully consumed — clear controller so re-entry abort is a no-op
      set({ _abortController: null })

      // Only add text greeting for TEXT mode — live sessions generate their own greeting
      const initialMessages: ChatMessage[] = []
      const isTextMode = get().interviewMode === "TEXT"

      if (isTextMode) {
        const firstQuestion = data.questions[0]
        const combinedContent = firstQuestion
          ? `${data.greeting}\n\n${firstQuestion.questionText}`
          : data.greeting

        initialMessages.push({
          id: nextMessageId(),
          role: "ai",
          content: combinedContent,
          timestamp: new Date(),
        })
      }

      const firstQuestion = data.questions[0]

      set({
        candidateName: data.candidateName,
        jobTitle: data.jobTitle,
        cvSummary: data.cvSummary ?? null,
        jdDescription: data.jdDescription ?? null,
        questions: data.questions,
        currentQuestionIndex: 0,
        results: [],
        messages: initialMessages,
        step: firstQuestion ? "questioning" : "greeting",
        loading: false,
      })
    } catch (error) {
      // Client aborted (e.g. React StrictMode unmount) — reset to idle so remount can retry
      if (error instanceof Error && error.name === "AbortError") {
        set({ step: "idle", loading: false, _abortController: null })
        return
      }

      console.error(`Start interview error (attempt ${_retryCount + 1}/${MAX_RETRIES + 1}):`, error)
      if (_retryCount < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1500))
        return get().startInterview(candidateId, dynamicPayload, _retryCount + 1)
      }
      set({ step: "error", loading: false, error: "Không thể kết nối AI. Vui lòng thử lại." })
    }
  },

  async retryStart() {
    const { candidateId, _lastDynamicPayload } = get()
    if (!candidateId) return
    set({ step: "idle", error: null })
    await get().startInterview(candidateId, _lastDynamicPayload ?? undefined)
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
    if (!candidateName || !jobTitle) {
      console.error("endInterview: missing candidateName or jobTitle", { candidateName, jobTitle })
      set({ loading: false, step: "error", error: "Thiếu thông tin ứng viên. Vui lòng thử lại." })
      return
    }

    if (!results.length) {
      console.error("endInterview: no results to generate report from")
      set({ loading: false, step: "error", error: "Không có dữ liệu phỏng vấn để tạo báo cáo. Vui lòng thử lại." })
      return
    }

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
      if (!res.ok) {
        const errorBody = await res.text().catch(() => "")
        throw new Error(`Report generation failed (${res.status}): ${errorBody.slice(0, 200)}`)
      }
      const data = await res.json()

      set({ report: data.report, step: "report", loading: false })
    } catch (error) {
      console.error("Report error:", error)
      const msg = error instanceof Error ? error.message : "Không thể tạo báo cáo phỏng vấn"
      set({ loading: false, step: "error", error: msg })
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

  async saveLiveResults(audio) {
    const { candidateId, candidateName, jobTitle, messages } = get()
    if (!candidateId) return

    set({ step: "generating-report", loading: true })

    const metadata = {
      transcripts: messages.map((m) => ({ role: m.role, text: m.content })),
      questions: LIVE_INTERVIEW_QUESTIONS,
      candidateName,
      jobTitle,
    }

    let audioBasedReport: InterviewReportData | null = null

    try {
      let res: Response
      if (audio && audio.size > 0) {
        const form = new FormData()
        form.append("audio", audio, "interview.webm")
        form.append("metadata", JSON.stringify(metadata))
        res = await fetch(`/api/interviews/${candidateId}/save-live-results`, { method: "POST", body: form })
      } else {
        res = await fetch(`/api/interviews/${candidateId}/save-live-results`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metadata),
        })
      }

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "")
        throw new Error(`Save live results failed (${res.status}): ${errorBody.slice(0, 200)}`)
      }
      const data = await res.json()

      if (data.questionsAndAnswers?.length) {
        set({ results: data.questionsAndAnswers.map((qa: { question: string; answer: string; evaluation: AnswerEvaluation }) => ({
          question: qa.question,
          answer: qa.answer,
          evaluation: qa.evaluation,
        })) })
      }

      // Audio path returns the full report in the same response — skip the /report call below.
      if (data.report) audioBasedReport = data.report as InterviewReportData
    } catch (e) {
      console.error("saveLiveResults error:", e)
      const msg = e instanceof Error ? e.message : "Không thể xử lý kết quả phỏng vấn"
      set({ loading: false, step: "error", error: msg })
      return
    }

    if (audioBasedReport) {
      set({ report: audioBasedReport, step: "report", loading: false })
      return
    }

    await get().endInterview()
  },

  reset() {
    get()._abortController?.abort()
    messageCounter = 0
    set({
      candidateId: null,
      candidateName: null,
      jobTitle: null,
      cvSummary: null,
      jdDescription: null,
      step: "idle",
      loading: false,
      error: null,
      questions: [],
      currentQuestionIndex: 0,
      results: [],
      messages: [],
      report: null,
      interviewMode: "VOICE",
      liveSessionStatus: "idle",
      isAiSpeaking: false,
      mediaPermission: "unknown",
      _lastDynamicPayload: null,
      _abortController: null,
    })
  },
}))
