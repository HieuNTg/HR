"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { GeminiAudioPlayer } from "@/lib/gemini-live-audio-player"

const GEMINI_LIVE_MODEL = "models/gemini-3.1-flash-live-preview"

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
  isAiSpeaking: boolean
}

/** ArrayBuffer → base64 string (browser-compatible) */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

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
  const playerRef = useRef<GeminiAudioPlayer | null>(null)
  const isConnectingRef = useRef(false)
  const userClosedRef = useRef(false)
  const wasActiveRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const triggerRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialTriggerPendingRef = useRef(false)

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

  const disconnect = useCallback(() => {
    userClosedRef.current = true
    abortControllerRef.current?.abort()
    if (triggerRetryRef.current) { clearTimeout(triggerRetryRef.current); triggerRetryRef.current = null }
    wsRef.current?.close()
    wsRef.current = null
    playerRef.current?.close()
    playerRef.current = null
    isConnectingRef.current = false
    wasActiveRef.current = false
    setStatus("closed")
    setIsAiSpeaking(false)
  }, [])

  const connect = useCallback(async () => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) return
    isConnectingRef.current = true
    setStatus("connecting")

    try {
      userClosedRef.current = false
      wasActiveRef.current = false
      abortControllerRef.current = new AbortController()

      // Fetch ephemeral token from backend
      const res = await fetch(`/api/interviews/${interviewId}/live-token`, {
        method: "POST",
        signal: abortControllerRef.current.signal,
      })
      if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`)
      const { token, wsUri, isEphemeral } = await res.json()

      // Setup audio player
      const player = new GeminiAudioPlayer()
      playerRef.current = player
      player.onPlayStart = () => {
        // AI responded — clear retry timeout
        if (triggerRetryRef.current) { clearTimeout(triggerRetryRef.current); triggerRetryRef.current = null }
        setIsAiSpeaking(true); onAiSpeakStartRef.current()
      }
      player.onPlayEnd = () => { setIsAiSpeaking(false); onAiSpeakEndRef.current() }

      // Ephemeral tokens use ?access_token=; API keys use ?key=
      const wsUrl = isEphemeral ? `${wsUri}?access_token=${token}` : `${wsUri}?key=${token}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        // Send BidiGenerateContentSetup — minimal first, features added after setupComplete
        const setupMsg = {
          setup: {
            model: GEMINI_LIVE_MODEL,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
            },
            systemInstruction: { parts: [{ text: systemInstruction }] },
            outputAudioTranscription: {},
            inputAudioTranscription: {},
          },
        }
        console.log("[gemini-ws] setup:", JSON.stringify(setupMsg).slice(0, 300))
        console.log("[gemini-ws] wsUrl:", wsUrl.replace(/[?].+/, "?***"))
        ws.send(JSON.stringify(setupMsg))
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string)
          console.log("[gemini-ws] msg keys:", Object.keys(msg).join(","))

          // Session ready — send text turn to trigger AI's opening greeting
          if ("setupComplete" in msg) {
            setStatus("active")
            wasActiveRef.current = true
            isConnectingRef.current = false

            // Send clientContent text turn to trigger Gemini's first response per system instruction
            initialTriggerPendingRef.current = true
            ws.send(JSON.stringify({
              clientContent: {
                turns: [{ role: "user", parts: [{ text: "Xin chào, tôi đã sẵn sàng cho buổi phỏng vấn." }] }],
                turnComplete: true,
              },
            }))

            // Retry if AI hasn't responded within 8s
            triggerRetryRef.current = setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN && !playerRef.current?.speaking) {
                ws.send(JSON.stringify({
                  clientContent: {
                    turns: [{ role: "user", parts: [{ text: "Xin chào" }] }],
                    turnComplete: true,
                  },
                }))
              }
            }, 8000)

            return
          }

          // Enqueue AI audio chunks for playback
          const parts = msg.serverContent?.modelTurn?.parts ?? []
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("audio/pcm") && part.inlineData.data) {
              player.enqueue(part.inlineData.data)
            }
          }

          // Transcription fields are top-level in server messages (not under serverContent)
          if (msg.outputTranscription?.text) {
            onTranscriptRef.current(msg.outputTranscription.text, "ai")
          }
          if (msg.inputTranscription?.text) {
            // Skip echoed initial trigger — don't show as candidate message
            if (initialTriggerPendingRef.current) {
              initialTriggerPendingRef.current = false
            } else {
              onTranscriptRef.current(msg.inputTranscription.text, "candidate")
            }
          }

          if (msg.serverContent?.turnComplete) {
            // AI finished speaking this turn — player.onPlayEnd fires after queue drains
          }

          // Catch Gemini error responses (e.g. invalid model, quota exceeded)
          if (msg.error) {
            const errMsg = msg.error.message || JSON.stringify(msg.error)
            onErrorRef.current(`Gemini: ${errMsg}`)
            ws.close()
          }
        } catch {
          // Non-JSON frame (binary audio) — ignore; audio arrives as base64 in JSON
        }
      }

      ws.onerror = () => {
        onErrorRef.current("WebSocket connection error")
        setStatus("error")
        isConnectingRef.current = false
      }

      ws.onclose = (e) => {
        console.log("[gemini-ws] closed:", e.code, e.reason, "wasClean:", e.wasClean, "wasActive:", wasActiveRef.current)
        setStatus("closed")
        isConnectingRef.current = false
        playerRef.current?.close()
        if (!userClosedRef.current) {
          if (!e.wasClean) {
            onErrorRef.current(`Connection closed unexpectedly (${e.code})`)
          } else if (!wasActiveRef.current) {
            onErrorRef.current(`Phiên kết nối thất bại (${e.code}${e.reason ? `: ${e.reason}` : ""})`)
          }
        }
        if (!userClosedRef.current && wasActiveRef.current) onSessionEndRef.current()
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return // user disconnected
      const msg = e instanceof Error ? e.message : "Connection failed"
      onErrorRef.current(msg)
      setStatus("error")
      isConnectingRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps — status removed: refs used for guards instead
  }, [interviewId, systemInstruction])

  const sendAudio = useCallback((pcm16: ArrayBuffer) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    // Barge-in: clear AI audio queue when user sends audio while AI is speaking
    if (playerRef.current?.speaking) playerRef.current.clear()
    ws.send(JSON.stringify({
      realtimeInput: {
        audio: { mimeType: "audio/pcm;rate=16000", data: arrayBufferToBase64(pcm16) },
      },
    }))
  }, [])

  const sendVideo = useCallback((jpegBase64: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({
      realtimeInput: {
        video: { mimeType: "image/jpeg", data: jpegBase64 },
      },
    }))
  }, [])

  useEffect(() => () => { disconnect() }, [disconnect])

  return { status, connect, disconnect, sendAudio, sendVideo, isAiSpeaking }
}
