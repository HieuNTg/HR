"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react"
import { useMediaCapture } from "@/hooks/use-media-capture"
import { useGeminiLiveSession } from "@/hooks/use-gemini-live-session"
import { VideoAvatarPanel } from "./video-avatar-panel"
import { ChatMessageBubble } from "./chat-message-bubble"
import type { GeneratedQuestion } from "@/lib/services/interview-ai-service"

interface TranscriptEntry {
  role: "ai" | "candidate"
  text: string
  timestamp: Date
}

export interface VideoInterviewInterfaceProps {
  interviewId: string
  systemInstruction: string
  questions: GeneratedQuestion[]
  candidateName: string
  jobTitle: string
  onTranscript: (text: string, role: "ai" | "candidate") => void
  onSessionEnd: () => void
  /** Called when camera/mic permission denied — parent should switch to text mode */
  onFallbackToText: () => void
  disabled: boolean
}

export function VideoInterviewInterface({
  interviewId,
  systemInstruction,
  onTranscript,
  onSessionEnd,
  onFallbackToText,
  disabled,
}: VideoInterviewInterfaceProps) {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([])
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const transcriptEndRef = useRef<HTMLDivElement | null>(null)

  const handleTranscript = useCallback((text: string, role: "ai" | "candidate") => {
    setTranscripts((prev) => [...prev, { role, text, timestamp: new Date() }])
    onTranscript(text, role)
  }, [onTranscript])

  const session = useGeminiLiveSession({
    interviewId,
    systemInstruction,
    onTranscript: handleTranscript,
    onAiSpeakStart: () => setIsAiSpeaking(true),
    onAiSpeakEnd: () => setIsAiSpeaking(false),
    onError: setSessionError,
    onSessionEnd,
  })

  const media = useMediaCapture({
    onAudioChunk: session.sendAudio,
    onVideoFrame: session.sendVideo,
  })

  // One-shot connect on mount — re-running would cause reconnect loops
  useEffect(() => {
    if (disabled) return
    let cancelled = false
    session.connect()
      .then(() => { if (!cancelled) media.start() })
      .catch(() => {}) // errors surface via session.onError → sessionError state
    return () => {
      cancelled = true
      session.disconnect()
      media.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps — intentional one-shot
  }, [])

  // Auto-scroll transcript to latest message
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [transcripts])

  const toggleCamera = useCallback(() => {
    const srcObject = media.videoRef.current?.srcObject
    if (!(srcObject instanceof MediaStream)) return
    const track = srcObject.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setIsCameraOff(!track.enabled)
  }, [media.videoRef])

  const handleEndCall = useCallback(() => {
    session.disconnect()
    onSessionEnd()
  }, [session, onSessionEnd])

  // ── Permission denied fallback ────────────────────────────────────────
  if (media.status === "denied") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center min-h-[300px]">
        <p className="text-sm text-muted-foreground max-w-xs">
          Quyền truy cập camera/mic bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt hoặc chuyển sang chế độ văn bản.
        </p>
        <button onClick={onFallbackToText} className="text-sm text-primary underline hover:no-underline">
          Chuyển sang chế độ văn bản
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-full">
      {/* ── Left column: camera preview + AI avatar ──────────────────── */}
      <div className="flex-1 flex flex-col sm:flex-row lg:flex-col gap-3">

        {/* Candidate camera preview */}
        <div className="relative flex-1 bg-gray-900 rounded-xl overflow-hidden min-h-[180px]">
          <video
            ref={media.videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity ${isCameraOff ? "opacity-0" : "opacity-100"}`}
            style={{ transform: "scaleX(-1)" }} // mirror for self-view
          />
          {isCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <VideoOff className="w-8 h-8 text-gray-500" />
            </div>
          )}

          {/* Controls bar */}
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
            <button
              onClick={media.toggleMute}
              title={media.isMuted ? "Bật mic" : "Tắt mic"}
              className={`p-2 rounded-full backdrop-blur-sm transition-colors ${media.isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"}`}
            >
              {media.isMuted
                ? <MicOff className="w-4 h-4 text-white" />
                : <Mic className="w-4 h-4 text-white" />}
            </button>
            <button
              onClick={toggleCamera}
              title={isCameraOff ? "Bật camera" : "Tắt camera"}
              className={`p-2 rounded-full backdrop-blur-sm transition-colors ${isCameraOff ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"}`}
            >
              {isCameraOff
                ? <VideoOff className="w-4 h-4 text-white" />
                : <Video className="w-4 h-4 text-white" />}
            </button>
            <button
              onClick={handleEndCall}
              title="Kết thúc phỏng vấn"
              className="p-2 rounded-full bg-red-500 hover:bg-red-600 backdrop-blur-sm"
            >
              <PhoneOff className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Connection status indicator */}
          <div className="absolute top-3 right-3">
            <span className={`w-2.5 h-2.5 rounded-full block ${
              session.status === "active" ? "bg-green-400 animate-pulse" :
              session.status === "connecting" ? "bg-yellow-400 animate-pulse" :
              "bg-red-400"
            }`} />
          </div>
        </div>

        {/* AI Avatar Panel — driven by real Gemini audio */}
        <VideoAvatarPanel
          step="questioning"
          speakText={null}
          isAiSpeakingLive={isAiSpeaking}
        />
      </div>

      {/* ── Right column: live transcript sidebar ────────────────────── */}
      <div className="w-full lg:w-72 flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transcript</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-1 min-h-0">
          {transcripts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6 px-4">
              {session.status === "connecting" ? "Đang kết nối..." :
               session.status === "active" ? "Đang chờ AI phản hồi..." :
               "Cuộc trò chuyện chưa bắt đầu"}
            </p>
          ) : (
            transcripts.map((t, i) => (
              <ChatMessageBubble key={`${t.role}-${t.timestamp.getTime()}-${i}`} role={t.role} content={t.text} timestamp={t.timestamp} />
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>

        {sessionError && (
          <div className="px-3 py-2 bg-red-50 border-t border-red-100 shrink-0">
            <p className="text-xs text-red-600">{sessionError}</p>
          </div>
        )}
      </div>
    </div>
  )
}
