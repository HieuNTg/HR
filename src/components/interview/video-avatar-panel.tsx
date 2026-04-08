"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import type { InterviewStep } from "@/stores/interview-store"

interface VideoAvatarPanelProps {
  step: InterviewStep
  /** Text for TTS — when set, avatar speaks and lip-syncs */
  speakText: string | null
  onSpeakEnd?: () => void
  /** Called with char index as TTS speaks, for text stream sync */
  onSpokenProgress?: (charIndex: number) => void
  /** Live mode: bypass TTS, drive lip-sync directly from real Gemini audio signal */
  isAiSpeakingLive?: boolean
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

/** Draw a professional female HR interviewer avatar with NovaGroup branding.
 *  Features: face with hair, eyes with blink, headset, navy blazer, "N" badge.
 *  Uses ref for isSpeaking so the animation loop reads latest value. */
function useAvatarCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>, isSpeaking: boolean) {
  const mouthOpenRef = useRef(0)
  const frameRef = useRef(0)
  const isSpeakingRef = useRef(isSpeaking)
  const logoRef = useRef<HTMLImageElement | null>(null)
  isSpeakingRef.current = isSpeaking

  // Preload Nova logo for blazer badge
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

      // === Background glow when speaking ===
      if (isSpeakingRef.current) {
        const glow = ctx.createRadialGradient(cx, cy, 40, cx, cy, 130)
        glow.addColorStop(0, "rgba(140,197,65,0.15)")
        glow.addColorStop(1, "rgba(140,197,65,0)")
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, w, h)
      }

      // === Neck ===
      ctx.fillStyle = "#f0d0b8"
      ctx.fillRect(cx - 14, cy + 52, 28, 30)

      // === Blazer / shoulders (NovaGroup green) ===
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

      // Blazer lapel V-neck
      ctx.beginPath()
      ctx.moveTo(cx - 16, cy + 68)
      ctx.lineTo(cx, cy + 95)
      ctx.lineTo(cx + 16, cy + 68)
      ctx.fillStyle = "#f0d0b8"
      ctx.fill()

      // White collar hint
      ctx.beginPath()
      ctx.moveTo(cx - 14, cy + 70)
      ctx.lineTo(cx, cy + 88)
      ctx.lineTo(cx + 14, cy + 70)
      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 1.5
      ctx.stroke()

      // === Nova logo badge on blazer ===
      if (logoRef.current) {
        const logoSize = 18
        ctx.drawImage(logoRef.current, cx - 30 - logoSize / 2, cy + 74, logoSize, logoSize)
      }

      // === Hair (back layer — dark brown, frames face) ===
      ctx.beginPath()
      ctx.ellipse(cx, cy - 8, 62, 70, 0, 0, Math.PI * 2)
      ctx.fillStyle = "#2c1a10"
      ctx.fill()

      // === Face (oval, warm skin tone) ===
      ctx.beginPath()
      ctx.ellipse(cx, cy + 5, 48, 55, 0, 0, Math.PI * 2)
      const skinGrad = ctx.createRadialGradient(cx - 8, cy - 10, 10, cx, cy + 5, 55)
      skinGrad.addColorStop(0, "#fce4d0")
      skinGrad.addColorStop(1, "#f0c8a8")
      ctx.fillStyle = skinGrad
      ctx.fill()

      // === Hair front (bangs + sides) ===
      // Left side hair
      ctx.beginPath()
      ctx.moveTo(cx - 48, cy - 20)
      ctx.quadraticCurveTo(cx - 62, cy + 10, cx - 50, cy + 50)
      ctx.quadraticCurveTo(cx - 55, cy + 20, cx - 52, cy - 5)
      ctx.quadraticCurveTo(cx - 50, cy - 30, cx - 20, cy - 55)
      ctx.fillStyle = "#2c1a10"
      ctx.fill()
      // Right side hair
      ctx.beginPath()
      ctx.moveTo(cx + 48, cy - 20)
      ctx.quadraticCurveTo(cx + 62, cy + 10, cx + 50, cy + 50)
      ctx.quadraticCurveTo(cx + 55, cy + 20, cx + 52, cy - 5)
      ctx.quadraticCurveTo(cx + 50, cy - 30, cx + 20, cy - 55)
      ctx.fillStyle = "#2c1a10"
      ctx.fill()
      // Bangs
      ctx.beginPath()
      ctx.moveTo(cx - 40, cy - 38)
      ctx.quadraticCurveTo(cx - 10, cy - 30, cx + 5, cy - 42)
      ctx.quadraticCurveTo(cx + 25, cy - 50, cx + 42, cy - 35)
      ctx.quadraticCurveTo(cx + 55, cy - 55, cx + 48, cy - 60)
      ctx.quadraticCurveTo(cx, cy - 78, cx - 48, cy - 60)
      ctx.quadraticCurveTo(cx - 55, cy - 55, cx - 40, cy - 38)
      ctx.fillStyle = "#2c1a10"
      ctx.fill()

      // === Eyebrows ===
      const eyeY = cy - 10
      ctx.strokeStyle = "#3d2215"
      ctx.lineWidth = 2.5
      ctx.lineCap = "round"
      // Left brow
      ctx.beginPath()
      ctx.moveTo(cx - 32, eyeY - 14)
      ctx.quadraticCurveTo(cx - 22, eyeY - 19, cx - 12, eyeY - 14)
      ctx.stroke()
      // Right brow
      ctx.beginPath()
      ctx.moveTo(cx + 12, eyeY - 14)
      ctx.quadraticCurveTo(cx + 22, eyeY - 19, cx + 32, eyeY - 14)
      ctx.stroke()

      // === Eyes with blink ===
      const blinkPhase = Math.sin(Date.now() / 2500) > 0.93
      if (blinkPhase) {
        // Blink — curved lines
        ctx.strokeStyle = "#3d2215"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(cx - 22, eyeY, 8, 0.2, Math.PI - 0.2)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(cx + 22, eyeY, 8, 0.2, Math.PI - 0.2)
        ctx.stroke()
      } else {
        // Open eyes — white, iris, pupil, highlight
        for (const ex of [cx - 22, cx + 22]) {
          // White
          ctx.beginPath()
          ctx.ellipse(ex, eyeY, 10, 8, 0, 0, Math.PI * 2)
          ctx.fillStyle = "#fff"
          ctx.fill()
          // Iris
          ctx.beginPath()
          ctx.arc(ex, eyeY + 1, 5.5, 0, Math.PI * 2)
          ctx.fillStyle = "#3d2215"
          ctx.fill()
          // Pupil
          ctx.beginPath()
          ctx.arc(ex, eyeY + 1, 2.5, 0, Math.PI * 2)
          ctx.fillStyle = "#1a0e08"
          ctx.fill()
          // Highlight
          ctx.beginPath()
          ctx.arc(ex + 2, eyeY - 1.5, 1.5, 0, Math.PI * 2)
          ctx.fillStyle = "#fff"
          ctx.fill()
        }
        // Eyelashes (subtle top line)
        ctx.strokeStyle = "#2c1a10"
        ctx.lineWidth = 1.5
        for (const ex of [cx - 22, cx + 22]) {
          ctx.beginPath()
          ctx.ellipse(ex, eyeY, 10, 8, 0, Math.PI + 0.3, -0.3)
          ctx.stroke()
        }
      }

      // === Nose (subtle) ===
      ctx.beginPath()
      ctx.moveTo(cx - 2, cy + 8)
      ctx.quadraticCurveTo(cx - 5, cy + 20, cx - 4, cy + 22)
      ctx.quadraticCurveTo(cx, cy + 25, cx + 4, cy + 22)
      ctx.strokeStyle = "#d4a88a"
      ctx.lineWidth = 1.5
      ctx.stroke()

      // === Mouth with lip-sync ===
      const speaking = isSpeakingRef.current
      const targetOpen = speaking ? 5 + Math.sin(Date.now() / 80) * 4 : 0
      mouthOpenRef.current += (targetOpen - mouthOpenRef.current) * 0.25
      const mouthY = cy + 32
      const mouthOpen = Math.max(0, mouthOpenRef.current)

      if (mouthOpen > 1) {
        // Speaking — open mouth
        ctx.beginPath()
        ctx.ellipse(cx, mouthY, 12, mouthOpen, 0, 0, Math.PI * 2)
        ctx.fillStyle = "#c44040"
        ctx.fill()
        // Teeth hint
        ctx.beginPath()
        ctx.ellipse(cx, mouthY - mouthOpen * 0.3, 8, Math.min(mouthOpen * 0.4, 3), 0, 0, Math.PI * 2)
        ctx.fillStyle = "#fff"
        ctx.fill()
        // Lips outline
        ctx.beginPath()
        ctx.ellipse(cx, mouthY, 12, mouthOpen, 0, 0, Math.PI * 2)
        ctx.strokeStyle = "#b55555"
        ctx.lineWidth = 1.5
        ctx.stroke()
      } else {
        // Resting — gentle smile
        ctx.beginPath()
        ctx.moveTo(cx - 12, mouthY - 1)
        ctx.quadraticCurveTo(cx, mouthY + 8, cx + 12, mouthY - 1)
        ctx.strokeStyle = "#c06060"
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.stroke()
        // Upper lip
        ctx.beginPath()
        ctx.moveTo(cx - 10, mouthY)
        ctx.quadraticCurveTo(cx - 4, mouthY - 3, cx, mouthY - 1)
        ctx.quadraticCurveTo(cx + 4, mouthY - 3, cx + 10, mouthY)
        ctx.strokeStyle = "#c06060"
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // === Cheek blush ===
      ctx.beginPath()
      ctx.ellipse(cx - 34, cy + 18, 10, 6, -0.2, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(240,140,130,0.15)"
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(cx + 34, cy + 18, 10, 6, 0.2, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(240,140,130,0.15)"
      ctx.fill()

      // === Headset (green themed) ===
      // Headband
      ctx.beginPath()
      ctx.ellipse(cx, cy - 25, 55, 45, 0, Math.PI + 0.3, -0.3)
      ctx.strokeStyle = "#66963f"
      ctx.lineWidth = 3
      ctx.stroke()
      // Left ear cup
      ctx.beginPath()
      ctx.roundRect(cx - 58, cy - 8, 14, 22, 4)
      ctx.fillStyle = "#8cc541"
      ctx.fill()
      ctx.strokeStyle = "#66963f"
      ctx.lineWidth = 1.5
      ctx.stroke()
      // Right ear cup
      ctx.beginPath()
      ctx.roundRect(cx + 44, cy - 8, 14, 22, 4)
      ctx.fillStyle = "#8cc541"
      ctx.fill()
      ctx.strokeStyle = "#66963f"
      ctx.lineWidth = 1.5
      ctx.stroke()
      // Microphone boom (left side)
      ctx.beginPath()
      ctx.moveTo(cx - 52, cy + 10)
      ctx.quadraticCurveTo(cx - 48, cy + 35, cx - 25, cy + 38)
      ctx.strokeStyle = "#66963f"
      ctx.lineWidth = 2
      ctx.stroke()
      // Mic tip
      ctx.beginPath()
      ctx.arc(cx - 24, cy + 38, 4, 0, Math.PI * 2)
      ctx.fillStyle = speaking ? "#8cc541" : "#aaa"
      ctx.fill()
      // Mic glow when speaking
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
  }, [canvasRef]) // single stable loop, never restarts
}

/** Web Speech API TTS hook with time-based text streaming sync.
 *  Chrome onboundary events are unreliable for Vietnamese — fires only a few
 *  word events then stops. We interpolate charIndex based on elapsed time.
 *  Key insight: utterance.onend can fire early (Chrome quirk), so we never
 *  instantly reveal all text — the interval handles smooth progress and finish. */
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

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    textLenRef.current = text.length
    startTimeRef.current = 0
    setSpokenCharIndex(0)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "vi-VN"
    utterance.rate = 1.05
    utterance.pitch = 1.0

    // Try to find a female Vietnamese voice
    const voices = window.speechSynthesis.getVoices()
    const viVoices = voices.filter((v) => v.lang.startsWith("vi"))
    const femaleVoice = viVoices.find(
      (v) =>
        /female|woman|nữ/i.test(v.name) ||
        v.name.includes("Google") ||
        v.name.includes("Microsoft HoaiMy") ||
        v.name.includes("Microsoft An")
    )
    utterance.voice = femaleVoice ?? viVoices[0] ?? null

    let done = false
    // Vietnamese TTS at rate 1.05 ≈ 18 chars/sec (empirically measured)
    const CHARS_PER_SEC = 18
    // Estimated speech duration with 20% buffer
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

      // Time-based interpolation: advance charIndex every 80ms
      // When elapsed exceeds estimated duration, finalize
      tickRef.current = window.setInterval(() => {
        if (done) return
        const elapsed = Date.now() - startTimeRef.current
        const estimated = Math.min(Math.floor((elapsed / 1000) * CHARS_PER_SEC), textLenRef.current)
        setSpokenCharIndex(estimated)

        // Once we've shown all text AND enough time has passed, we're done
        if (estimated >= textLenRef.current && elapsed > estDurationMs) {
          finalize()
        }
      }, 80)
    }

    // Don't call finalize on onend — Chrome fires it early for Vietnamese.
    // Instead, just note the engine stopped. The interval handles finish timing.
    utterance.onend = () => { /* handled by interval */ }
    utterance.onerror = () => { /* handled by interval */ }

    window.speechSynthesis.speak(utterance)

    // Chrome bug: if onstart never fires, or speech stalls, clean up after timeout
    const timeout = setTimeout(() => {
      if (!done && startTimeRef.current === 0) {
        // Speech never started — reveal text and finish
        finalize()
      }
    }, 5000)

    return () => {
      done = true
      clearTimeout(timeout)
      clearInterval(tickRef.current)
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      // Don't reveal all text on cleanup — parent handles reset via handleSpeakEnd
    }
  }, [text])

  return { isSpeaking, spokenCharIndex }
}

export function VideoAvatarPanel({ step, speakText, onSpeakEnd, onSpokenProgress, isAiSpeakingLive }: VideoAvatarPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Live mode: disable TTS, use real audio signal for lip-sync
  const { isSpeaking: ttsSpeaking, spokenCharIndex } = useTTS(
    isAiSpeakingLive !== undefined ? null : speakText,
    isAiSpeakingLive !== undefined ? undefined : onSpeakEnd,
  )
  const isSpeaking = isAiSpeakingLive ?? ttsSpeaking
  const onSpokenProgressRef = useRef(onSpokenProgress)
  onSpokenProgressRef.current = onSpokenProgress

  // Notify parent of spoken progress for text stream sync
  useEffect(() => {
    onSpokenProgressRef.current?.(spokenCharIndex)
  }, [spokenCharIndex])

  useAvatarCanvas(canvasRef, isSpeaking)

  // Live mode overrides status text
  const statusText = isAiSpeakingLive !== undefined
    ? (isAiSpeakingLive ? "Đang nói..." : "Đang lắng nghe...")
    : (STATUS_TEXT[step] || "")
  const isActive = step !== "idle" && step !== "report"

  return (
    <div className="flex flex-col items-center justify-center rounded-xl p-6 gap-4 min-h-[300px] lg:min-h-0 bg-white border border-gray-100 shadow-sm">
      {/* NovaGroup branding */}
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/novagroup-logo.webp" alt="NovaGroup" width={36} height={36} />
        <div>
          <p className="text-[#1f3769] text-sm font-semibold">NovaGroup</p>
          <p className="text-[#8cc541] text-[10px] font-medium">Trợ lý tuyển dụng AI</p>
        </div>
      </div>

      {/* Avatar canvas */}
      <div className={`relative rounded-2xl overflow-hidden border-2 transition-colors ${isSpeaking ? "border-[#8cc541] shadow-[0_0_12px_rgba(140,197,65,0.3)]" : "border-[#e0e0e0]"}`}>
        <canvas
          ref={canvasRef}
          width={240}
          height={280}
          className="w-[200px] h-[230px]"
          style={{ background: "linear-gradient(180deg, #f0f9e8 0%, #e8f5d8 50%, #dff0cc 100%)" }}
        />
        {isSpeaking && (
          <div className="absolute inset-0 rounded-2xl border-2 border-[#8cc541] animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Status */}
      <div className="text-center space-y-1">
        {isActive && (
          <div className="flex items-center gap-1.5 justify-center">
            <span className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-[#8cc541] animate-pulse" : "bg-gray-300"}`} />
            <span className="text-gray-500 text-xs">{isSpeaking ? "Đang nói..." : statusText}</span>
          </div>
        )}
      </div>
    </div>
  )
}
