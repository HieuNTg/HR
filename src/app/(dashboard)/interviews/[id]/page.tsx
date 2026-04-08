"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Phone, Brain, RefreshCw, Video, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { VideoAvatarPanel } from "@/components/interview/video-avatar-panel"
import { ChatInterface } from "@/components/interview/chat-interface"
import { VideoInterviewInterface } from "@/components/interview/video-interview-interface"
import { useInterviewStore } from "@/stores/interview-store"
import { useSourcingStore } from "@/stores/sourcing-store"
import { buildLiveSystemInstruction } from "@/lib/services/interview-ai-service"

export default function InterviewSessionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const store = useInterviewStore()

  // Track latest AI message for TTS + text stream sync
  const [speakText, setSpeakText] = useState<string | null>(null)
  const [lastSpokenMsgId, setLastSpokenMsgId] = useState<string | null>(null)
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null)
  const [spokenCharIndex, setSpokenCharIndex] = useState(0)

  // Reset store if navigating to a different candidate
  useEffect(() => {
    if (id && store.candidateId && store.candidateId !== id && store.step !== "idle") {
      store.reset()
    }
  }, [id, store])

  // Start interview on mount — for dynamic candidates, pass data from sourcing store
  useEffect(() => {
    if (id && store.step === "idle") {
      if (id.startsWith("gen-")) {
        const sourcingState = useSourcingStore.getState()
        const jd = sourcingState.jds.find((j) => j.candidates.some((c) => c.id === id))
        const candidate = jd?.candidates.find((c) => c.id === id)
        if (candidate && jd) {
          store.startInterview(id, { candidate, jdTitle: jd.title, jdDescription: jd.description })
        }
      } else {
        store.startInterview(id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Speak new AI messages via TTS (text mode only)
  useEffect(() => {
    if (store.interviewMode !== "TEXT") return
    const lastMsg = store.messages[store.messages.length - 1]
    if (lastMsg && lastMsg.role === "ai" && lastMsg.id !== lastSpokenMsgId) {
      setLastSpokenMsgId(lastMsg.id)
      setSpeakText(lastMsg.content)
      setStreamingMsgId(lastMsg.id)
      setSpokenCharIndex(0)
    }
  }, [store.messages, store.interviewMode, lastSpokenMsgId])

  const handleSpeakEnd = useCallback(() => {
    setSpeakText(null)
    setStreamingMsgId(null)
    setSpokenCharIndex(0)
    if (store.step === "greeting") {
      store.advanceFromGreeting()
    }
  }, [store])

  const handleSpokenProgress = useCallback((charIndex: number) => {
    setSpokenCharIndex(charIndex)
  }, [])

  const handleSend = useCallback((message: string) => {
    store.sendAnswer(message)
  }, [store])

  const handleEndInterview = useCallback(() => {
    if (store.step === "closing" || store.step === "questioning") {
      store.endInterview()
    }
  }, [store])

  const handleVideoSessionEnd = useCallback(() => {
    store.saveLiveResults()
  }, [store])

  const handleVideoTranscript = useCallback((text: string, role: "ai" | "candidate") => {
    store.addLiveTranscript(role, text)
  }, [store])

  const handleFallbackToText = useCallback(() => {
    store.setInterviewMode("TEXT")
  }, [store])

  const toggleMode = useCallback(() => {
    store.setInterviewMode(store.interviewMode === "TEXT" ? "VOICE" : "TEXT")
  }, [store])

  // Navigate to report when ready
  useEffect(() => {
    if (store.step === "report") {
      router.push(`/interviews/${id}/report`)
    }
  }, [store.step, id, router])

  const isInterviewActive = !["idle", "loading", "error", "report", "generating-report"].includes(store.step)
  const canEnd = store.step === "closing" || (store.step === "questioning" && store.results.length > 0)
  const isVideoMode = store.interviewMode !== "TEXT"

  // Build system instruction once questions are available
  const systemInstruction = store.questions.length > 0 && store.candidateName && store.jobTitle
    ? buildLiveSystemInstruction({
        candidateName: store.candidateName,
        jobTitle: store.jobTitle,
        questions: store.questions,
      })
    : ""

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-background shrink-0">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/novagroup-logo.webp" alt="NovaGroup" width={28} height={28} />
          <div>
            <h1 className="text-sm font-semibold">
              NovaGroup AI Interview
            </h1>
            {store.candidateName && (
              <p className="text-[11px] text-muted-foreground">
                {store.candidateName} — {store.jobTitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isInterviewActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMode}
              title={isVideoMode ? "Chuyển sang chế độ văn bản" : "Chuyển sang chế độ video"}
            >
              {isVideoMode
                ? <><MessageSquare className="w-3.5 h-3.5 mr-1.5" />Văn bản</>
                : <><Video className="w-3.5 h-3.5 mr-1.5" />Video</>}
            </Button>
          )}
          {!isVideoMode && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEndInterview}
              disabled={!canEnd}
            >
              <Phone className="w-3.5 h-3.5 mr-1.5" />
              Kết thúc phỏng vấn
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      {store.step === "error" ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-sm text-destructive">{store.error}</p>
            <Button variant="outline" size="sm" onClick={() => store.retryStart()}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Thử lại
            </Button>
          </div>
        </div>
      ) : store.step === "loading" ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Đang chuẩn bị câu hỏi phỏng vấn...</p>
          </div>
        </div>
      ) : store.step === "generating-report" ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Đang tạo báo cáo phỏng vấn...</p>
          </div>
        </div>
      ) : isVideoMode && isInterviewActive && systemInstruction ? (
        // ── Video mode ──────────────────────────────────────────────────────
        <div className="flex-1 p-4 min-h-0">
          <VideoInterviewInterface
            interviewId={store.candidateId ?? ""}
            systemInstruction={systemInstruction}
            questions={store.questions}
            candidateName={store.candidateName ?? ""}
            jobTitle={store.jobTitle ?? ""}
            onTranscript={handleVideoTranscript}
            onSessionEnd={handleVideoSessionEnd}
            onFallbackToText={handleFallbackToText}
            disabled={false}
          />
        </div>
      ) : (
        // ── Text mode (Google Meet style) ───────────────────────────────────
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-0 min-h-0">
          <div className="hidden lg:flex lg:items-center lg:justify-center border-r p-4 bg-muted/30">
            <VideoAvatarPanel
              step={store.step}
              speakText={speakText}
              onSpeakEnd={handleSpeakEnd}
              onSpokenProgress={handleSpokenProgress}
            />
          </div>
          <div className="min-h-0 flex flex-col">
            <ChatInterface
              messages={store.messages}
              loading={store.loading}
              disabled={!isInterviewActive || store.step === "closing"}
              onSend={handleSend}
              streamingMsgId={streamingMsgId}
              spokenCharIndex={spokenCharIndex}
            />
          </div>
        </div>
      )}
    </div>
  )
}
