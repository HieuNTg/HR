"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Phone, Brain, RefreshCw, Video, MessageSquare, Clock } from "lucide-react"

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

  const [speakText, setSpeakText] = useState<string | null>(null)
  const [lastSpokenMsgId, setLastSpokenMsgId] = useState<string | null>(null)
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null)
  const [spokenCharIndex, setSpokenCharIndex] = useState(0)

  useEffect(() => {
    if (!id) return

    const s = useInterviewStore.getState()

    const needsReset =
      (s.candidateId && s.candidateId !== id && s.step !== "idle") ||
      (s.candidateId === id && !["idle", "loading"].includes(s.step))
    if (needsReset) s.reset()

    const current = useInterviewStore.getState()
    if (current.step === "idle") {
      if (id.startsWith("gen-")) {
        const sourcingState = useSourcingStore.getState()
        const jd = sourcingState.jds.find((j) => j.candidates.some((c) => c.id === id))
        const candidate = jd?.candidates.find((c) => c.id === id)
        if (candidate && jd) {
          current.startInterview(id, { candidate, jdTitle: jd.title, jdDescription: jd.description })
        }
      } else {
        current.startInterview(id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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
  }, [])

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

  const handleVideoSessionEnd = useCallback((audio: Blob | null) => {
    store.saveLiveResults(audio)
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

  useEffect(() => {
    if (store.step === "report") {
      router.push(`/interviews/${id}/report`)
    }
  }, [store.step, id, router])

  const isInterviewActive = !["idle", "loading", "error", "report", "generating-report"].includes(store.step)
  const canEnd = store.step === "closing" || (store.step === "questioning" && store.results.length > 0)
  const isVideoMode = store.interviewMode !== "TEXT"

  const systemInstruction = store.candidateName && store.jobTitle
    ? buildLiveSystemInstruction({
        candidateName: store.candidateName,
        jobTitle: store.jobTitle,
        cvSummary: store.cvSummary ?? undefined,
        jdDescription: store.jdDescription ?? undefined,
      })
    : ""

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-background/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/novagroup-logo.webp" alt="NovaGroup" width={28} height={28} className="rounded-lg" />
          <div>
            <h1 className="text-sm font-semibold leading-tight">
              NovaGroup AI Interview
            </h1>
            {store.candidateName && (
              <p className="text-[11px] text-muted-foreground leading-tight">
                {store.candidateName} — {store.jobTitle}
              </p>
            )}
          </div>

          {/* Status pill */}
          {isInterviewActive && (
            <div className="flex items-center gap-1.5 ml-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full px-2.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium">Live</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isInterviewActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMode}
              className="h-8 text-xs gap-1.5 cursor-pointer"
              title={isVideoMode ? "Chuyển sang chế độ văn bản" : "Chuyển sang chế độ video"}
            >
              {isVideoMode
                ? <><MessageSquare className="w-3.5 h-3.5" />Văn bản</>
                : <><Video className="w-3.5 h-3.5" />Video</>}
            </Button>
          )}
          {!isVideoMode && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEndInterview}
              disabled={!canEnd}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              Kết thúc phỏng vấn
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      {store.step === "error" ? (
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-destructive" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Đã xảy ra lỗi</p>
              <p className="text-sm text-muted-foreground">{store.error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => store.retryStart()} className="cursor-pointer">
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Thử lại
            </Button>
          </div>
        </div>
      ) : store.step === "loading" ? (
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="w-7 h-7 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Đang chuẩn bị phỏng vấn</p>
              <p className="text-xs text-muted-foreground">Hệ thống đang tạo câu hỏi phù hợp...</p>
            </div>
          </div>
        </div>
      ) : store.step === "generating-report" ? (
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="w-7 h-7 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Đang tạo báo cáo</p>
              <p className="text-xs text-muted-foreground">AI đang phân tích và đánh giá kết quả phỏng vấn...</p>
            </div>
          </div>
        </div>
      ) : isVideoMode && isInterviewActive && systemInstruction ? (
        // ── Video mode ──────────────────────────────────────────────────────
        <div className="flex-1 p-2 min-h-0">
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
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0 min-h-0">
          {/* AI Avatar sidebar */}
          <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center border-r border-border/50 p-4 bg-muted/20">
            <VideoAvatarPanel
              step={store.step}
              speakText={speakText}
              onSpeakEnd={handleSpeakEnd}
              onSpokenProgress={handleSpokenProgress}
            />
          </div>
          {/* Chat area */}
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
