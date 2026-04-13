"use client"

import { useCallback, useRef, useEffect, useState } from "react"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  RefreshCw,
  MonitorSpeaker,
  WifiOff,
} from "lucide-react"
import { useMediaCapture } from "@/hooks/use-media-capture"
import { useGeminiLiveSession } from "@/hooks/use-gemini-live-session"
import { VideoAvatarPanel } from "./video-avatar-panel"
import type { GeneratedQuestion } from "@/lib/services/interview-ai-service"

export interface VideoInterviewInterfaceProps {
  interviewId: string
  systemInstruction: string
  questions: GeneratedQuestion[]
  candidateName: string
  jobTitle: string
  onTranscript: (text: string, role: "ai" | "candidate") => void
  onSessionEnd: (audio: Blob | null) => void
  onFallbackToText: () => void
  disabled: boolean
}

export function VideoInterviewInterface({
  interviewId,
  systemInstruction,
  candidateName,
  jobTitle,
  onTranscript,
  onSessionEnd,
  onFallbackToText,
  disabled,
}: VideoInterviewInterfaceProps) {
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [started, setStarted] = useState(false)
  const hasTranscriptsRef = useRef(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleTranscript = useCallback(
    (text: string, role: "ai" | "candidate") => {
      hasTranscriptsRef.current = true
      onTranscript(text, role)
    },
    [onTranscript],
  )

  // Ref to the live-session stream accessor — set after session is created.
  // Media capture uses this to mix AI audio into the saved recording.
  const getAiStreamRef = useRef<(() => MediaStream | null) | null>(null)

  const handleSessionEnd = useCallback(
    async (audio?: Blob | null) => {
      if (!hasTranscriptsRef.current) return
      onSessionEnd(audio ?? null)
    },
    [onSessionEnd],
  )

  const session = useGeminiLiveSession({
    interviewId,
    systemInstruction,
    onTranscript: handleTranscript,
    onAiSpeakStart: () => setIsAiSpeaking(true),
    onAiSpeakEnd: () => setIsAiSpeaking(false),
    onError: setSessionError,
    // WS-close path — no audio to flush (user didn't press End Call).
    // handleEndCall handles the happy path with a flushed recording.
    onSessionEnd: () => { handleSessionEnd(null) },
  })

  // Keep the stream accessor current (stable callback identity from the hook).
  getAiStreamRef.current = session.getAiAudioStream

  const media = useMediaCapture({
    onAudioChunk: session.sendAudio,
    onVideoFrame: session.sendVideo,
    getExtraAudioStream: () => getAiStreamRef.current?.() ?? null,
  })

  const handleStart = useCallback(async () => {
    setStarted(true)
    setSessionError(null)
    try {
      await session.warmUpAudio()
      await session.connect()
      await media.start()
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không thể khởi động phỏng vấn"
      setSessionError(msg)
      setStarted(false)
    }
  }, [session, media])

  const handleRetry = useCallback(async () => {
    setSessionError(null)
    setStarted(true)
    try {
      await session.warmUpAudio()
      await session.connect()
      if (media.status !== "active") await media.start()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Kết nối lại thất bại"
      setSessionError(msg)
      setStarted(false)
    }
  }, [session, media])

  useEffect(() => {
    return () => {
      session.disconnect()
      media.stop()
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleCamera = useCallback(() => {
    const srcObject = media.videoRef.current?.srcObject
    if (!(srcObject instanceof MediaStream)) return
    const track = srcObject.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setIsCameraOff(!track.enabled)
  }, [media.videoRef])

  const handleEndCall = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    // Flush recorder BEFORE disconnecting so AI's last audio makes it into the blob.
    const audio = await media.stopRecordingAndGetAudio()
    session.disconnect()
    handleSessionEnd(audio)
  }, [session, media, handleSessionEnd])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  const statusColor =
    session.status === "active"
      ? "bg-emerald-500"
      : session.status === "connecting"
        ? "bg-amber-400"
        : "bg-red-400"

  const statusLabel =
    session.status === "active"
      ? "Đang phỏng vấn"
      : session.status === "connecting"
        ? "Đang kết nối..."
        : session.status === "error"
          ? "Lỗi kết nối"
          : session.status === "closed"
            ? "Đã kết thúc"
            : ""

  // ── Pre-start lobby ──────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden relative">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-8 p-8 max-w-md">
          {/* Logo + branding */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/novagroup-logo.webp" alt="NovaGroup" width={44} height={44} className="rounded-xl" />
            <div>
              <p className="text-white text-lg font-semibold tracking-tight">NovaGroup AI Interview</p>
              <p className="text-slate-400 text-xs">Trợ lý tuyển dụng thông minh</p>
            </div>
          </div>

          {/* Candidate info card */}
          <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                {candidateName?.charAt(0) || "?"}
              </div>
              <div>
                <p className="text-white font-medium">{candidateName}</p>
                <p className="text-slate-400 text-sm">{jobTitle}</p>
              </div>
            </div>

            <div className="h-px bg-white/10" />

            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <MonitorSpeaker className="w-4 h-4 text-slate-400" />
              <span>Phỏng vấn video với AI — mic & camera sẽ được bật</span>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={disabled}
            className="group relative w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm
              hover:from-emerald-400 hover:to-teal-400 transition-all duration-300
              disabled:opacity-40 disabled:cursor-not-allowed
              shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
          >
            <span className="flex items-center justify-center gap-2">
              <Video className="w-4.5 h-4.5" />
              Bắt đầu phỏng vấn
            </span>
          </button>

          {/* Fallback link */}
          <button
            onClick={onFallbackToText}
            className="text-slate-500 text-xs hover:text-slate-300 transition-colors underline underline-offset-2"
          >
            Dùng chế độ văn bản thay thế
          </button>
        </div>
      </div>
    )
  }

  // ── Permission denied ────────────────────────────────────────────────
  if (media.status === "denied") {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 rounded-2xl">
        <div className="flex flex-col items-center gap-5 p-8 max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
            <VideoOff className="w-6 h-6 text-red-400" />
          </div>
          <div className="space-y-2">
            <p className="text-white font-medium">Quyền truy cập bị từ chối</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              Vui lòng cấp quyền camera/mic trong cài đặt trình duyệt hoặc chuyển sang chế độ văn bản.
            </p>
          </div>
          <button
            onClick={onFallbackToText}
            className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors"
          >
            Chuyển sang chế độ văn bản
          </button>
        </div>
      </div>
    )
  }

  // ── Connection error with retry ──────────────────────────────────────
  if ((session.status === "error" || session.status === "closed") && sessionError && !hasTranscriptsRef.current) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 rounded-2xl">
        <div className="flex flex-col items-center gap-5 p-8 max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
            <WifiOff className="w-6 h-6 text-red-400" />
          </div>
          <div className="space-y-2">
            <p className="text-white font-medium">Kết nối thất bại</p>
            <p className="text-slate-400 text-sm">{sessionError}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium
                hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Thử lại
            </button>
            <button
              onClick={onFallbackToText}
              className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors"
            >
              Văn bản
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Active interview ─────────────────────────────────────────────────
  return (
    <div className="flex h-full gap-0 bg-slate-900 rounded-2xl overflow-hidden relative">
      {/* ── Main video area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar: status + timer */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
            <span className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />
            <span className="text-white/80 text-xs font-medium">{statusLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white/80 text-xs font-mono tabular-nums">{formatTime(elapsed)}</span>
            </div>
          </div>
        </div>

        {/* Video grid: candidate + AI avatar */}
        <div className="flex-1 flex flex-col sm:flex-row gap-2 p-2 min-h-0">
          {/* Candidate camera */}
          <div className="relative flex-[3] bg-slate-800 rounded-xl overflow-hidden min-h-[200px]">
            <video
              ref={media.videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isCameraOff ? "opacity-0" : "opacity-100"}`}
              style={{ transform: "scaleX(-1)" }}
            />
            {isCameraOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-800">
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-white text-2xl font-semibold">
                  {candidateName?.charAt(0) || "?"}
                </div>
                <p className="text-slate-400 text-sm">Camera đã tắt</p>
              </div>
            )}

            {/* Name tag */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="bg-black/50 backdrop-blur-md rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                {media.isMuted ? (
                  <MicOff className="w-3 h-3 text-red-400" />
                ) : (
                  <Mic className="w-3 h-3 text-white/70" />
                )}
                <span className="text-white text-xs font-medium">{candidateName || "Bạn"}</span>
              </div>
            </div>
          </div>

          {/* AI Avatar */}
          <div className="flex-1 min-h-[200px] sm:max-w-[280px]">
            <VideoAvatarPanel
              step="questioning"
              speakText={null}
              isAiSpeakingLive={isAiSpeaking}
              variant="dark"
            />
          </div>
        </div>

        {/* ── Floating controls bar ─────────────────────────────────── */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5 shadow-2xl shadow-black/40">
            {/* Mic toggle */}
            <button
              onClick={media.toggleMute}
              title={media.isMuted ? "Bật mic" : "Tắt mic"}
              className={`p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                media.isMuted
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              {media.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Camera toggle */}
            <button
              onClick={toggleCamera}
              title={isCameraOff ? "Bật camera" : "Tắt camera"}
              className={`p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                isCameraOff
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* Divider */}
            <div className="w-px h-8 bg-white/10 mx-1" />

            {/* End call */}
            <button
              onClick={handleEndCall}
              title="Kết thúc phỏng vấn"
              className="px-5 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Kết thúc</span>
            </button>
          </div>
        </div>
      </div>

      {/* Non-fatal error banner */}
      {sessionError && hasTranscriptsRef.current && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-red-500/15 backdrop-blur-md border border-red-500/20 rounded-xl px-4 py-2">
          <p className="text-xs text-red-400">{sessionError}</p>
          <button
            onClick={handleRetry}
            title="Thử kết nối lại"
            className="shrink-0 text-red-400 hover:text-red-300 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
