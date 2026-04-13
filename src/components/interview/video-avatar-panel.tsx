"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import type { InterviewStep } from "@/stores/interview-store"

interface VideoAvatarPanelProps {
  step: InterviewStep
  speakText: string | null
  onSpeakEnd?: () => void
  onSpokenProgress?: (charIndex: number) => void
  isAiSpeakingLive?: boolean
  variant?: "light" | "dark"
}

const STATUS_TEXT: Partial<Record<InterviewStep, string>> = {
  loading: "Đang chuẩn bị...",
  greeting: "Đang nói...",
  questioning: "Đang lắng nghe...",
  evaluating: "Đang suy nghĩ...",
  closing: "Đang nói...",
  "generating-report": "Đang tạo báo cáo...",
  report: "Phỏng vấn kết thúc",
}

function useAvatarCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>, isSpeaking: boolean) {
  const mouthOpenRef = useRef(0)
  const frameRef = useRef(0)
  const isSpeakingRef = useRef(isSpeaking)
  const logoRef = useRef<HTMLImageElement | null>(null)
  isSpeakingRef.current = isSpeaking

  useEffect(() => {
    const img = new Image()
    img.src = "/novagroup-logo.webp"
    img.onload = () => { logoRef.current = img }
  }, [])

  useEffect(() => {
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { frameRef.current = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext("2d")
      if (!ctx) { frameRef.current = requestAnimationFrame(draw); return }

      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h * 0.42

      ctx.clearRect(0, 0, w, h)

      if (isSpeakingRef.current) {
        const glow = ctx.createRadialGradient(cx, cy, 40, cx, cy, 130)
        glow.addColorStop(0, "rgba(140,197,65,0.15)")
        glow.addColorStop(1, "rgba(140,197,65,0)")
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, w, h)
      }

      ctx.fillStyle = "#f0d0b8"
      ctx.fillRect(cx - 14, cy + 52, 28, 30)

      ctx.beginPath()
      ctx.moveTo(cx - 65, h)
      ctx.quadraticCurveTo(cx - 60, cy + 70, cx - 30, cy + 65)
      ctx.lineTo(cx - 12, cy + 80)
      ctx.lineTo(cx, cy + 90)
      ctx.lineTo(cx + 12, cy + 80)
      ctx.lineTo(cx + 30, cy + 65)
      ctx.quadraticCurveTo(cx + 60, cy + 70, cx + 65, h)
      ctx.lineTo(cx - 65, h)
      ctx.fillStyle = "#66963f"
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(cx - 16, cy + 68)
      ctx.lineTo(cx, cy + 95)
      ctx.lineTo(cx + 16, cy + 68)
      ctx.fillStyle = "#f0d0b8"
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(cx - 14, cy + 70)
      ctx.lineTo(cx, cy + 88)
      ctx.lineTo(cx + 14, cy + 70)
      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 1.5
      ctx.stroke()

      if (logoRef.current) {
        const logoSize = 18
        ctx.drawImage(logoRef.current, cx - 30 - logoSize / 2, cy + 74, logoSize, logoSize)
      }

      ctx.beginPath()
      ctx.ellipse(cx, cy - 8, 62, 70, 0, 0, Math.PI * 2)
      ctx.fillStyle = "#2c1a10"
      ctx.fill()

      ctx.beginPath()
      ctx.ellipse(cx, cy + 5, 48, 55, 0, 0, Math.PI * 2)
      const skinGrad = ctx.createRadialGradient(cx - 8, cy - 10, 10, cx, cy + 5, 55)
      skinGrad.addColorStop(0, "#fce4d0")
      skinGrad.addColorStop(1, "#f0c8a8")
      ctx.fillStyle = skinGrad
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(cx - 48, cy - 20)
      ctx.quadraticCurveTo(cx - 62, cy + 10, cx - 50, cy + 50)
      ctx.quadraticCurveTo(cx - 55, cy + 20, cx - 52, cy - 5)
      ctx.quadraticCurveTo(cx - 50, cy - 30, cx - 20, cy - 55)
      ctx.fillStyle = "#2c1a10"
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(cx + 48, cy - 20)
      ctx.quadraticCurveTo(cx + 62, cy + 10, cx + 50, cy + 50)
      ctx.quadraticCurveTo(cx + 55, cy + 20, cx + 52, cy - 5)
      ctx.quadraticCurveTo(cx + 50, cy - 30, cx + 20, cy - 55)
      ctx.fillStyle = "#2c1a10"
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(cx - 40, cy - 38)
      ctx.quadraticCurveTo(cx - 10, cy - 30, cx + 5, cy - 42)
      ctx.quadraticCurveTo(cx + 25, cy - 50, cx + 42, cy - 35)
      ctx.quadraticCurveTo(cx + 55, cy - 55, cx + 48, cy - 60)
      ctx.quadraticCurveTo(cx, cy - 78, cx - 48, cy - 60)
      ctx.quadraticCurveTo(cx - 55, cy - 55, cx - 40, cy - 38)
      ctx.fillStyle = "#2c1a10"
      ctx.fill()

      const eyeY = cy - 10
      ctx.strokeStyle = "#3d2215"
      ctx.lineWidth = 2.5
      ctx.lineCap = "round"
      ctx.beginPath()
      ctx.moveTo(cx - 32, eyeY - 14)
      ctx.quadraticCurveTo(cx - 22, eyeY - 19, cx - 12, eyeY - 14)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + 12, eyeY - 14)
      ctx.quadraticCurveTo(cx + 22, eyeY - 19, cx + 32, eyeY - 14)
      ctx.stroke()

      const blinkPhase = Math.sin(Date.now() / 2500) > 0.93
      if (blinkPhase) {
        ctx.strokeStyle = "#3d2215"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(cx - 22, eyeY, 8, 0.2, Math.PI - 0.2)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(cx + 22, eyeY, 8, 0.2, Math.PI - 0.2)
        ctx.stroke()
      } else {
        for (const ex of [cx - 22, cx + 22]) {
          ctx.beginPath()
          ctx.ellipse(ex, eyeY, 10, 8, 0, 0, Math.PI * 2)
          ctx.fillStyle = "#fff"
          ctx.fill()
          ctx.beginPath()
          ctx.arc(ex, eyeY + 1, 5.5, 0, Math.PI * 2)
          ctx.fillStyle = "#3d2215"
          ctx.fill()
          ctx.beginPath()
          ctx.arc(ex, eyeY + 1, 2.5, 0, Math.PI * 2)
          ctx.fillStyle = "#1a0e08"
          ctx.fill()
          ctx.beginPath()
          ctx.arc(ex + 2, eyeY - 1.5, 1.5, 0, Math.PI * 2)
          ctx.fillStyle = "#fff"
          ctx.fill()
        }
        ctx.strokeStyle = "#2c1a10"
        ctx.lineWidth = 1.5
        for (const ex of [cx - 22, cx + 22]) {
          ctx.beginPath()
          ctx.ellipse(ex, eyeY, 10, 8, 0, Math.PI + 0.3, -0.3)
          ctx.stroke()
        }
      }

      ctx.beginPath()
      ctx.moveTo(cx - 2, cy + 8)
      ctx.quadraticCurveTo(cx - 5, cy + 20, cx - 4, cy + 22)
      ctx.quadraticCurveTo(cx, cy + 25, cx + 4, cy + 22)
      ctx.strokeStyle = "#d4a88a"
      ctx.lineWidth = 1.5
      ctx.stroke()

      const speaking = isSpeakingRef.current
      const targetOpen = speaking ? 5 + Math.sin(Date.now() / 80) * 4 : 0
      mouthOpenRef.current += (targetOpen - mouthOpenRef.current) * 0.25
      const mouthY = cy + 32
      const mouthOpen = Math.max(0, mouthOpenRef.current)

      if (mouthOpen > 1) {
        ctx.beginPath()
        ctx.ellipse(cx, mouthY, 12, mouthOpen, 0, 0, Math.PI * 2)
        ctx.fillStyle = "#c44040"
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(cx, mouthY - mouthOpen * 0.3, 8, Math.min(mouthOpen * 0.4, 3), 0, 0, Math.PI * 2)
        ctx.fillStyle = "#fff"
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(cx, mouthY, 12, mouthOpen, 0, 0, Math.PI * 2)
        ctx.strokeStyle = "#b55555"
        ctx.lineWidth = 1.5
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.moveTo(cx - 12, mouthY - 1)
        ctx.quadraticCurveTo(cx, mouthY + 8, cx + 12, mouthY - 1)
        ctx.strokeStyle = "#c06060"
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx - 10, mouthY)
        ctx.quadraticCurveTo(cx - 4, mouthY - 3, cx, mouthY - 1)
        ctx.quadraticCurveTo(cx + 4, mouthY - 3, cx + 10, mouthY)
        ctx.strokeStyle = "#c06060"
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.ellipse(cx - 34, cy + 18, 10, 6, -0.2, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(240,140,130,0.15)"
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(cx + 34, cy + 18, 10, 6, 0.2, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(240,140,130,0.15)"
      ctx.fill()

      ctx.beginPath()
      ctx.ellipse(cx, cy - 25, 55, 45, 0, Math.PI + 0.3, -0.3)
      ctx.strokeStyle = "#66963f"
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.beginPath()
      ctx.roundRect(cx - 58, cy - 8, 14, 22, 4)
      ctx.fillStyle = "#8cc541"
      ctx.fill()
      ctx.strokeStyle = "#66963f"
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.beginPath()
      ctx.roundRect(cx + 44, cy - 8, 14, 22, 4)
      ctx.fillStyle = "#8cc541"
      ctx.fill()
      ctx.strokeStyle = "#66963f"
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx - 52, cy + 10)
      ctx.quadraticCurveTo(cx - 48, cy + 35, cx - 25, cy + 38)
      ctx.strokeStyle = "#66963f"
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx - 24, cy + 38, 4, 0, Math.PI * 2)
      ctx.fillStyle = speaking ? "#8cc541" : "#aaa"
      ctx.fill()
      if (speaking) {
        ctx.beginPath()
        ctx.arc(cx - 24, cy + 38, 7, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(140,197,65,0.6)"
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [canvasRef])
}

function useTTS(
  text: string | null,
  onEnd?: () => void,
): { isSpeaking: boolean; spokenCharIndex: number } {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [spokenCharIndex, setSpokenCharIndex] = useState(0)
  const onEndRef = useRef(onEnd)
  const textLenRef = useRef(0)
  const startTimeRef = useRef(0)
  const tickRef = useRef(0)
  onEndRef.current = onEnd

  useEffect(() => {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) {
      setIsSpeaking(false)
      setSpokenCharIndex(0)
      return
    }

    window.speechSynthesis.cancel()
    textLenRef.current = text.length
    startTimeRef.current = 0
    setSpokenCharIndex(0)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "vi-VN"
    utterance.rate = 1.05
    utterance.pitch = 1.0

    const voices = window.speechSynthesis.getVoices()
    const viVoices = voices.filter((v) => v.lang.startsWith("vi"))
    const femaleVoice = viVoices.find(
      (v) =>
        /female|woman|nữ/i.test(v.name) ||
        v.name.includes("Google") ||
        v.name.includes("Microsoft HoaiMy") ||
        v.name.includes("Microsoft An"),
    )
    utterance.voice = femaleVoice ?? viVoices[0] ?? null

    let done = false
    const CHARS_PER_SEC = 18
    const estDurationMs = (text.length / CHARS_PER_SEC) * 1200

    const finalize = () => {
      if (done) return
      done = true
      clearInterval(tickRef.current)
      setSpokenCharIndex(textLenRef.current)
      setIsSpeaking(false)
      onEndRef.current?.()
    }

    utterance.onstart = () => {
      startTimeRef.current = Date.now()
      setIsSpeaking(true)

      tickRef.current = window.setInterval(() => {
        if (done) return
        const elapsed = Date.now() - startTimeRef.current
        const estimated = Math.min(Math.floor((elapsed / 1000) * CHARS_PER_SEC), textLenRef.current)
        setSpokenCharIndex(estimated)

        if (estimated >= textLenRef.current && elapsed > estDurationMs) {
          finalize()
        }
      }, 80)
    }

    utterance.onend = () => {}
    utterance.onerror = () => {}

    window.speechSynthesis.speak(utterance)

    const timeout = setTimeout(() => {
      if (!done && startTimeRef.current === 0) {
        finalize()
      }
    }, 5000)

    return () => {
      done = true
      clearTimeout(timeout)
      clearInterval(tickRef.current)
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [text])

  return { isSpeaking, spokenCharIndex }
}

export function VideoAvatarPanel({ step, speakText, onSpeakEnd, onSpokenProgress, isAiSpeakingLive, variant = "light" }: VideoAvatarPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isSpeaking: ttsSpeaking, spokenCharIndex } = useTTS(
    isAiSpeakingLive !== undefined ? null : speakText,
    isAiSpeakingLive !== undefined ? undefined : onSpeakEnd,
  )
  const isSpeaking = isAiSpeakingLive ?? ttsSpeaking
  const onSpokenProgressRef = useRef(onSpokenProgress)
  onSpokenProgressRef.current = onSpokenProgress

  useEffect(() => {
    onSpokenProgressRef.current?.(spokenCharIndex)
  }, [spokenCharIndex])

  useAvatarCanvas(canvasRef, isSpeaking)

  const statusText = isAiSpeakingLive !== undefined
    ? (isAiSpeakingLive ? "Đang nói..." : "Đang lắng nghe...")
    : (STATUS_TEXT[step] || "")
  const isActive = step !== "idle" && step !== "report"
  const isDark = variant === "dark"

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl p-5 gap-3 h-full transition-colors ${
        isDark
          ? "bg-slate-800 border border-white/5"
          : "bg-white border border-gray-100 shadow-sm"
      }`}
    >
      {/* Branding */}
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/novagroup-logo.webp" alt="NovaGroup" width={32} height={32} className="rounded-lg" />
        <div>
          <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#1f3769]"}`}>NovaGroup AI</p>
          <p className={`text-[10px] font-medium ${isDark ? "text-emerald-400" : "text-[#8cc541]"}`}>
            Trợ lý tuyển dụng
          </p>
        </div>
      </div>

      {/* Avatar canvas */}
      <div
        className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
          isSpeaking
            ? isDark
              ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              : "border-[#8cc541] shadow-[0_0_12px_rgba(140,197,65,0.3)]"
            : isDark
              ? "border-white/10"
              : "border-[#e0e0e0]"
        }`}
      >
        <canvas
          ref={canvasRef}
          width={240}
          height={280}
          className="w-[180px] h-[210px]"
          style={{
            background: isDark
              ? "linear-gradient(180deg, #1e293b 0%, #1a2332 50%, #162030 100%)"
              : "linear-gradient(180deg, #f0f9e8 0%, #e8f5d8 50%, #dff0cc 100%)",
          }}
        />
        {isSpeaking && (
          <div
            className={`absolute inset-0 rounded-2xl border-2 animate-pulse pointer-events-none ${
              isDark ? "border-emerald-500/50" : "border-[#8cc541]"
            }`}
          />
        )}
      </div>

      {/* Status */}
      {isActive && (
        <div className="flex items-center gap-1.5 justify-center">
          <span
            className={`w-2 h-2 rounded-full ${
              isSpeaking
                ? isDark
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-[#8cc541] animate-pulse"
                : isDark
                  ? "bg-slate-500"
                  : "bg-gray-300"
            }`}
          />
          <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            {isSpeaking ? "Đang nói..." : statusText}
          </span>
        </div>
      )}

      {/* Name tag in dark mode */}
      {isDark && (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg px-2.5 py-1">
          <span className="text-white/60 text-xs font-medium">AI Interviewer</span>
        </div>
      )}
    </div>
  )
}
