"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { GeminiAudioPlayer } from "@/lib/gemini-live-audio-player"
import { uint8ToBase64 } from "@/lib/audio-utils"
import { attemptGeminiReconnect } from "@/lib/ws-reconnect"

const GEMINI_LIVE_MODEL = "models/gemini-3.1-flash-live-preview"

// 128ms of silence at 16kHz (2048 samples) — used to trigger VAD on session start
const SILENCE_FALLBACK_PCM = new Int16Array(2048) // all zeros

const MAX_RECONNECT_ATTEMPTS = 3
// How long user must be silent before we signal end-of-turn to Gemini (ms).
// Longer = user gets more thinking time; shorter = snappier AI responses.
const SILENCE_BEFORE_TURN_END_MS = 5000
// RMS threshold to consider mic input as "speech" (16-bit scale, 0–32767)
const SPEECH_RMS_THRESHOLD = 800
const RECONNECTABLE_CODES = new Set([1006, 1011, 1012, 1013])

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
  /** MediaStream of AI audio output — for mixing into a recording of the full conversation */
  getAiAudioStream: () => MediaStream | null
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
  const secondResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Counter for empty AI turns (turnComplete with no audio/text)
  const missedTurnCountRef = useRef(0)
  const MAX_MISSED_TURNS = 3
  // Track whether AI sent audio in the current turn (more precise than text-only check)
  const aiHasAudioThisTurnRef = useRef(false)
  // Gate mic→WS until AI's first turn completes — prevents greeting interruption
  const firstTurnDoneRef = useRef(false)
  const reconnectAttemptsRef = useRef(0)
  // Client-side silence timer — sends audioStreamEnd after SILENCE_BEFORE_TURN_END_MS of silence
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userIsSpeakingRef = useRef(false)
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
    if (secondResponseTimerRef.current) {
      clearTimeout(secondResponseTimerRef.current)
      secondResponseTimerRef.current = null
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
    aiHasAudioThisTurnRef.current = false
    firstTurnDoneRef.current = false
    missedTurnCountRef.current = 0
    reconnectAttemptsRef.current = 0
    partialAiTranscriptRef.current = ""
    partialCandidateTranscriptRef.current = ""
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    userIsSpeakingRef.current = false
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
      firstTurnDoneRef.current = false
      partialAiTranscriptRef.current = ""
      partialCandidateTranscriptRef.current = ""
      missedTurnCountRef.current = 0
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

      const buildSetupMsg = () => ({
        setup: {
          model: GEMINI_LIVE_MODEL,
          generationConfig: {
            responseModalities: ["AUDIO"],
            mediaResolution: "MEDIA_RESOLUTION_LOW",
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
          },
          realtimeInputConfig: {
            activityHandling: "START_OF_ACTIVITY_INTERRUPTS",
            turnCoverage: "TURN_INCLUDES_ALL_INPUT",
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contextWindowCompression: { slidingWindow: {} },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      })

      ws.onopen = () => {
        const setupMsg = buildSetupMsg()
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

            // Fallback 1: if AI hasn't spoken after 8s, nudge with silence audio.
            firstResponseTimerRef.current = setTimeout(() => {
              if (wsRef.current?.readyState === WebSocket.OPEN && !aiHasSpokenRef.current) {
                console.warn("[gemini-ws] fallback 1: sending silence + audioStreamEnd")
                wsRef.current.send(JSON.stringify({
                  realtimeInput: {
                    audio: { data: arrayBufferToBase64(SILENCE_FALLBACK_PCM.buffer), mimeType: "audio/pcm;rate=16000" },
                  },
                }))
                wsRef.current.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }))

                // Fallback 2: if still no response after 12 more seconds, report error.
                secondResponseTimerRef.current = setTimeout(() => {
                  if (!aiHasSpokenRef.current) {
                    console.error("[gemini-ws] fallback 2: AI still not responding after 20s total")
                    onErrorRef.current("AI không phản hồi. Vui lòng kiểm tra micro và thử lại.")
                  }
                }, 12000)
              }
            }, 8000)
            return
          }

          // Enqueue AI audio chunks; also capture inline text parts as transcript fallback
          const parts = msg.serverContent?.modelTurn?.parts ?? []
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("audio/pcm") && part.inlineData.data) {
              aiHasAudioThisTurnRef.current = true
              player.enqueue(part.inlineData.data)
            }
            // Capture text parts as AI transcript fallback (only when outputTranscription is absent)
            if (part.text && !msg.serverContent?.outputTranscription) {
              partialAiTranscriptRef.current += part.text
            }
          }

          // Accumulate partial transcript chunks — Gemini streams tokens incrementally.
          // Transcription fields arrive INSIDE serverContent (not top-level).
          // Emit a single entry per turn (on turnComplete) instead of one bubble per chunk.
          const sc = msg.serverContent
          if (sc?.outputTranscription?.text) {
            partialAiTranscriptRef.current += sc.outputTranscription.text
          }
          if (sc?.inputTranscription?.text) {
            partialCandidateTranscriptRef.current += sc.inputTranscription.text
          }
          if (msg.serverContent?.turnComplete) {
            firstTurnDoneRef.current = true
            if (partialCandidateTranscriptRef.current.trim()) {
              onTranscriptRef.current(partialCandidateTranscriptRef.current.trim(), "candidate")
              partialCandidateTranscriptRef.current = ""
            }
            // Check both text AND audio to avoid false "empty turn" when audio-only response
            const hasContent = partialAiTranscriptRef.current.trim() || aiHasAudioThisTurnRef.current
            if (hasContent) {
              if (partialAiTranscriptRef.current.trim()) {
                onTranscriptRef.current(partialAiTranscriptRef.current.trim(), "ai")
              }
              partialAiTranscriptRef.current = ""
              aiHasAudioThisTurnRef.current = false
              missedTurnCountRef.current = 0
            } else {
              // Empty AI turn — no audio AND no text (safety filter or miss)
              aiHasAudioThisTurnRef.current = false
              missedTurnCountRef.current++
              console.warn(`[gemini-ws] empty AI turn #${missedTurnCountRef.current}/${MAX_MISSED_TURNS}`)
              if (missedTurnCountRef.current <= MAX_MISSED_TURNS) {
                wsRef.current?.send(JSON.stringify({
                  realtimeInput: { text: "Xin hãy trả lời lại câu hỏi" },
                }))
              } else {
                console.error("[gemini-ws] too many missed turns, notifying user")
                onErrorRef.current("AI không thể phản hồi. Đang chuyển sang câu hỏi tiếp theo...")
                missedTurnCountRef.current = 0
              }
            }
          }

          if (msg.error) {
            const errMsg = msg.error.message || JSON.stringify(msg.error)
            onErrorRef.current(`Gemini: ${errMsg}`)
            wsRef.current?.close()
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

      // Reconnect-capable onclose — assigned as a named const so reconnected sockets can reuse it
      const onWsClose = async (e: CloseEvent) => {
        console.log("[gemini-ws] closed:", e.code, e.reason, "wasClean:", e.wasClean, "wasActive:", wasActiveRef.current)
        clearFirstResponseTimer()
        isConnectingRef.current = false
        playerRef.current.clear()

        // Attempt transparent reconnect for recoverable close codes
        if (!userClosedRef.current && wasActiveRef.current && RECONNECTABLE_CODES.has(e.code)) {
          setStatus("connecting")
          const newWs = await attemptGeminiReconnect({
            interviewId,
            maxAttempts: MAX_RECONNECT_ATTEMPTS,
            buildSetupMsg,
            onAttemptStart: (attempt, delay) => {
              console.warn(`[gemini-ws] reconnect ${attempt}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`)
            },
            isCancelled: () => userClosedRef.current,
          })

          if (newWs) {
            newWs.onmessage = handleMessage
            newWs.onerror = () => { onErrorRef.current("Lỗi kết nối WebSocket"); setStatus("error") }
            newWs.onclose = (ev) => { onWsClose(ev).catch(err => console.error("[gemini-ws] onclose error:", err)) }
            wsRef.current = newWs
            reconnectAttemptsRef.current = 0
            aiHasSpokenRef.current = false
            aiHasAudioThisTurnRef.current = false
            firstTurnDoneRef.current = false
            missedTurnCountRef.current = 0
            partialAiTranscriptRef.current = ""
            partialCandidateTranscriptRef.current = ""
            if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
            userIsSpeakingRef.current = false
            return
          }

          // All reconnect attempts exhausted
          reconnectAttemptsRef.current = 0
          setStatus("closed")
          const label = WS_CLOSE_REASONS[e.code] ?? `Kết nối đóng bất thường (mã ${e.code})`
          onErrorRef.current(`Không thể kết nối lại: ${label}`)
          onSessionEndRef.current()
          return
        }

        // Non-reconnectable close
        setStatus("closed")
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
      ws.onclose = (e) => { onWsClose(e).catch(err => console.error("[gemini-ws] onclose error:", err)) }
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
    // Gate mic→WS until AI's first turn completes to prevent greeting interruption
    if (!firstTurnDoneRef.current) return

    // Compute RMS energy of this audio chunk
    const samples = new Int16Array(pcm16)
    let sumSq = 0
    for (let i = 0; i < samples.length; i++) sumSq += samples[i] * samples[i]
    const rms = Math.sqrt(sumSq / samples.length)

    // While AI is speaking, gate low-energy audio to prevent echo/ambient noise
    // from triggering barge-in. Only let through high-energy audio (intentional barge-in).
    if (playerRef.current?.speaking) {
      if (rms <= 2000) return
      playerRef.current.clear() // intentional barge-in — clear local playback
    }

    // Send audio to Gemini
    ws.send(JSON.stringify({
      realtimeInput: {
        audio: { data: arrayBufferToBase64(pcm16), mimeType: "audio/pcm;rate=16000" },
      },
    }))

    // ── Client-side silence detection (manual turn management) ──────────
    // Since server-side VAD is disabled, we control when the user's turn ends
    // by sending audioStreamEnd after SILENCE_BEFORE_TURN_END_MS of silence.
    const isSpeech = rms > SPEECH_RMS_THRESHOLD

    if (isSpeech) {
      userIsSpeakingRef.current = true
      // Clear any pending silence timer — user is still talking
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
    } else if (userIsSpeakingRef.current && !silenceTimerRef.current) {
      // User was speaking but now silent — start countdown
      silenceTimerRef.current = setTimeout(() => {
        silenceTimerRef.current = null
        userIsSpeakingRef.current = false
        // Signal end of user's turn to Gemini
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          console.log("[gemini-ws] silence timeout — sending audioStreamEnd")
          wsRef.current.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }))
        }
      }, SILENCE_BEFORE_TURN_END_MS)
    }
  }, [])

  const sendVideo = useCallback((jpegBase64: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    // Skip video frames while AI is speaking to avoid interrupting its turn
    if (playerRef.current?.speaking) return
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

  const getAiAudioStream = useCallback((): MediaStream | null => {
    return playerRef.current.getOutputStream()
  }, [])

  return { status, connect, disconnect, sendAudio, sendVideo, sendText, isAiSpeaking, warmUpAudio, getAiAudioStream }
}

