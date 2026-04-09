"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { GeminiAudioPlayer } from "@/lib/gemini-live-audio-player"
import { uint8ToBase64 } from "@/lib/audio-utils"

const GEMINI_LIVE_MODEL = "models/gemini-3.1-flash-live-preview"

// 32ms of silence at 16kHz (512 samples) — used to trigger VAD on session start
const SILENCE_FALLBACK_PCM = new Int16Array(512) // all zeros

/** Human-readable WebSocket close code labels (Vietnamese for production UI) */
const WS_CLOSE_REASONS: Record<number, string> = {
  1000: "Phiên kết thúc bình thường",
  1006: "Mất kết nối mạng",
  1007: "Lỗi giao thức — vui lòng liên hệ hỗ trợ",
  1008: "Vi phạm chính sách",
  1011: "Lỗi server Gemini — thử lại sau",
  1012: "Server đang khởi động lại",
  1013: "Server quá tải",
}

export type SessionStatus = "idle" | "connecting" | "active" | "error" | "closed"

export interface UseGeminiLiveSessionOptions {
  interviewId: string
  systemInstruction: string
  onTranscript: (text: string, role: "ai" | "candidate") => void
  onAiSpeakStart: () => void
  onAiSpeakEnd: () => void
  onError: (error: string) => void
  onSessionEnd: () => void
}

export interface UseGeminiLiveSessionReturn {
  status: SessionStatus
  connect: () => Promise<void>
  disconnect: () => void
  sendAudio: (pcm16: ArrayBuffer) => void
  sendVideo: (jpegBase64: string) => void
  sendText: (text: string) => void
  isAiSpeaking: boolean
  warmUpAudio: () => Promise<void>
}

/** ArrayBuffer → base64 (thin wrapper around the canonical util) */
const arrayBufferToBase64 = (buf: ArrayBuffer) => uint8ToBase64(new Uint8Array(buf))

export function useGeminiLiveSession({
  interviewId,
  systemInstruction,
  onTranscript,
  onAiSpeakStart,
  onAiSpeakEnd,
  onError,
  onSessionEnd,
}: UseGeminiLiveSessionOptions): UseGeminiLiveSessionReturn {
  const [status, setStatus] = useState<SessionStatus>("idle")
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  // Player created once on mount so warmUpAudio() can be called before connect()
  const playerRef = useRef<GeminiAudioPlayer>(new GeminiAudioPlayer())
  const isConnectingRef = useRef(false)
  const userClosedRef = useRef(false)
  const wasActiveRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  // Tracks whether AI has spoken at least once this session (for fallback trigger)
  const aiHasSpokenRef = useRef(false)
  // Timer for fallback silence trigger if AI doesn't respond to audioStreamEnd
  const firstResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Transcript accumulators — buffer partial chunks, emit one entry per turn
  const partialAiTranscriptRef = useRef("")
  const partialCandidateTranscriptRef = useRef("")

  // Stable callback refs
  const onTranscriptRef = useRef(onTranscript)
  const onAiSpeakStartRef = useRef(onAiSpeakStart)
  const onAiSpeakEndRef = useRef(onAiSpeakEnd)
  const onErrorRef = useRef(onError)
  const onSessionEndRef = useRef(onSessionEnd)
  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])
  useEffect(() => { onAiSpeakStartRef.current = onAiSpeakStart }, [onAiSpeakStart])
  useEffect(() => { onAiSpeakEndRef.current = onAiSpeakEnd }, [onAiSpeakEnd])
  useEffect(() => { onErrorRef.current = onError }, [onError])
  useEffect(() => { onSessionEndRef.current = onSessionEnd }, [onSessionEnd])

  const clearFirstResponseTimer = useCallback(() => {
    if (firstResponseTimerRef.current) {
      clearTimeout(firstResponseTimerRef.current)
      firstResponseTimerRef.current = null
    }
  }, [])

  const disconnect = useCallback(() => {
    userClosedRef.current = true
    clearFirstResponseTimer()
    abortControllerRef.current?.abort()
    wsRef.current?.close()
    wsRef.current = null
    playerRef.current.close()
    isConnectingRef.current = false
    wasActiveRef.current = false
    aiHasSpokenRef.current = false
    partialAiTranscriptRef.current = ""
    partialCandidateTranscriptRef.current = ""
    setStatus("closed")
    setIsAiSpeaking(false)
  }, [clearFirstResponseTimer])

  const connect = useCallback(async () => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) return
    isConnectingRef.current = true
    setStatus("connecting")

    try {
      userClosedRef.current = false
      wasActiveRef.current = false
      aiHasSpokenRef.current = false
      partialAiTranscriptRef.current = ""
      partialCandidateTranscriptRef.current = ""
      abortControllerRef.current = new AbortController()

      // Fetch ephemeral token from backend
      const res = await fetch(`/api/interviews/${interviewId}/live-token`, {
        method: "POST",
        signal: abortControllerRef.current.signal,
      })
      if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`)
      const { token, wsUri, isEphemeral } = await res.json()

      // Wire up audio player callbacks (player created once on mount)
      const player = playerRef.current
      player.onPlayStart = () => {
        aiHasSpokenRef.current = true
        clearFirstResponseTimer() // AI responded — cancel fallback timer
        setIsAiSpeaking(true)
        onAiSpeakStartRef.current()
      }
      player.onPlayEnd = () => { setIsAiSpeaking(false); onAiSpeakEndRef.current() }

      // Ephemeral tokens use ?access_token=; API keys use ?key=
      const wsUrl = isEphemeral ? `${wsUri}?access_token=${token}` : `${wsUri}?key=${token}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        const setupMsg = {
          setup: {
            model: GEMINI_LIVE_MODEL,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
            },
            systemInstruction: { parts: [{ text: systemInstruction }] },
          },
        }
        console.log("[gemini-ws] setup:", JSON.stringify(setupMsg).slice(0, 300))
        ws.send(JSON.stringify(setupMsg))
      }

      const handleMessage = async (event: MessageEvent) => {
        const raw: string = event.data instanceof Blob
          ? await event.data.text()
          : event.data as string
        try {
          const msg = JSON.parse(raw)
          // Debug: log all top-level keys so we can diagnose message structure
          console.debug("[gemini-ws] msg:", Object.keys(msg).join(","), JSON.stringify(msg).slice(0, 200))
          if ("setupComplete" in msg) {
            setStatus("active")
            wasActiveRef.current = true
            isConnectingRef.current = false

            // Trigger AI greeting via realtimeInput.text (clientContent causes 1007 on this model).
            ws.send(JSON.stringify({
              realtimeInput: { text: "Bắt đầu" },
            }))

            // Fallback: if AI hasn't spoken after 5s, nudge again.
            firstResponseTimerRef.current = setTimeout(() => {
              if (wsRef.current?.readyState === WebSocket.OPEN && !aiHasSpokenRef.current) {
                console.debug("[gemini-ws] fallback silence trigger fired")
                wsRef.current.send(JSON.stringify({
                  realtimeInput: {
                    audio: { data: arrayBufferToBase64(SILENCE_FALLBACK_PCM.buffer), mimeType: "audio/pcm;rate=16000" },
                  },
                }))
                wsRef.current.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }))
              }
            }, 5000)
            return
          }

          // Enqueue AI audio chunks; also capture inline text parts as transcript fallback
          const parts = msg.serverContent?.modelTurn?.parts ?? []
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("audio/pcm") && part.inlineData.data) {
              player.enqueue(part.inlineData.data)
            }
            // Capture text parts as AI transcript (gemini-3.1-flash-live outputs text in parts)
            if (part.text && !msg.outputTranscription) {
              partialAiTranscriptRef.current += part.text
            }
          }

          // Accumulate partial transcript chunks — Gemini streams tokens incrementally.
          // Transcription fields arrive as TOP-LEVEL message keys (not under serverContent).
          // Emit a single entry per turn (on turnComplete) instead of one bubble per chunk.
          if (msg.outputTranscription?.text) {
            partialAiTranscriptRef.current += msg.outputTranscription.text
          }
          if (msg.inputTranscription?.text) {
            partialCandidateTranscriptRef.current += msg.inputTranscription.text
          }
          if (msg.serverContent?.turnComplete) {
            if (partialCandidateTranscriptRef.current.trim()) {
              onTranscriptRef.current(partialCandidateTranscriptRef.current.trim(), "candidate")
              partialCandidateTranscriptRef.current = ""
            }
            if (partialAiTranscriptRef.current.trim()) {
              onTranscriptRef.current(partialAiTranscriptRef.current.trim(), "ai")
              partialAiTranscriptRef.current = ""
            }
          }

          if (msg.error) {
            const errMsg = msg.error.message || JSON.stringify(msg.error)
            onErrorRef.current(`Gemini: ${errMsg}`)
            ws.close()
          }
        } catch {
          // Non-JSON frame — ignore
        }
      }

      ws.onmessage = handleMessage

      ws.onerror = () => {
        onErrorRef.current("Lỗi kết nối WebSocket")
        setStatus("error")
        isConnectingRef.current = false
      }

      ws.onclose = (e) => {
        console.log("[gemini-ws] closed:", e.code, e.reason, "wasClean:", e.wasClean, "wasActive:", wasActiveRef.current)
        clearFirstResponseTimer()
        setStatus("closed")
        isConnectingRef.current = false
        // clear() not close() — preserve AudioContext for potential reconnect
        playerRef.current.clear()
        if (!userClosedRef.current) {
          if (!e.wasClean || e.code !== 1000) {
            const label = WS_CLOSE_REASONS[e.code] ?? `Kết nối đóng bất thường (mã ${e.code})`
            const detail = e.reason ? `: ${e.reason}` : ""
            if (!wasActiveRef.current) {
              onErrorRef.current(`Phiên kết nối thất bại — ${label}${detail}`)
            } else {
              onErrorRef.current(`${label}${detail}`)
            }
          }
        }
        if (!userClosedRef.current && wasActiveRef.current) onSessionEndRef.current()
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return
      const msg = e instanceof Error ? e.message : "Kết nối thất bại"
      onErrorRef.current(msg)
      setStatus("error")
      isConnectingRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps — refs used for guards; status excluded intentionally
  }, [interviewId, systemInstruction, clearFirstResponseTimer])

  const sendAudio = useCallback((pcm16: ArrayBuffer) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    // Barge-in: clear AI audio queue when user sends audio while AI is speaking
    if (playerRef.current?.speaking) playerRef.current.clear()
    ws.send(JSON.stringify({
      realtimeInput: {
        audio: { data: arrayBufferToBase64(pcm16), mimeType: "audio/pcm;rate=16000" },
      },
    }))
  }, [])

  const sendVideo = useCallback((jpegBase64: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({
      realtimeInput: {
        video: { data: jpegBase64, mimeType: "image/jpeg" },
      },
    }))
  }, [])

  /** Send a text message mid-session via realtimeInput.text. */
  const sendText = useCallback((text: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ realtimeInput: { text } }))
  }, [])

  useEffect(() => () => {
    clearFirstResponseTimer()
    disconnect() // disconnect() already calls player.clear()
  }, [disconnect, clearFirstResponseTimer])

  const warmUpAudio = useCallback(async () => {
    await playerRef.current.warmUp()
  }, [])

  return { status, connect, disconnect, sendAudio, sendVideo, sendText, isAiSpeaking, warmUpAudio }
}

