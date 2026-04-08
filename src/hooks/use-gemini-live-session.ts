"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { GeminiAudioPlayer } from "@/lib/gemini-live-audio-player"

const GEMINI_LIVE_MODEL = "models/gemini-2.5-flash-native-audio-preview-12-2025"

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
  const abortControllerRef = useRef<AbortController | null>(null)

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
    wsRef.current?.close()
    wsRef.current = null
    playerRef.current?.close()
    playerRef.current = null
    isConnectingRef.current = false
    setStatus("closed")
    setIsAiSpeaking(false)
  }, [])

  const connect = useCallback(async () => {
    if (isConnectingRef.current || status === "active") return
    isConnectingRef.current = true
    setStatus("connecting")

    try {
      userClosedRef.current = false
      abortControllerRef.current = new AbortController()

      // Fetch ephemeral token from backend
      const res = await fetch(`/api/interviews/${interviewId}/live-token`, {
        method: "POST",
        signal: abortControllerRef.current.signal,
      })
      if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`)
      const { token, wsUri } = await res.json()

      // Setup audio player
      const player = new GeminiAudioPlayer()
      playerRef.current = player
      player.onPlayStart = () => { setIsAiSpeaking(true); onAiSpeakStartRef.current() }
      player.onPlayEnd = () => { setIsAiSpeaking(false); onAiSpeakEndRef.current() }

      // Open WebSocket
      const ws = new WebSocket(`${wsUri}?key=${token}`)
      wsRef.current = ws

      ws.onopen = () => {
        // Send BidiGenerateContentSetup
        ws.send(JSON.stringify({
          setup: {
            model: GEMINI_LIVE_MODEL,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
            },
            systemInstruction: { parts: [{ text: systemInstruction }] },
          },
        }))
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string)

          // Session ready
          if ("setupComplete" in msg) {
            setStatus("active")
            isConnectingRef.current = false
            return
          }

          // AI response content
          const parts = msg.serverContent?.modelTurn?.parts ?? []
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("audio/pcm") && part.inlineData.data) {
              player.enqueue(part.inlineData.data)
            }
            if (part.text) {
              onTranscriptRef.current(part.text, "ai")
            }
          }

          if (msg.serverContent?.turnComplete) {
            // AI finished speaking this turn — player.onPlayEnd fires after queue drains
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
        setStatus("closed")
        isConnectingRef.current = false
        playerRef.current?.close()
        if (!e.wasClean && !userClosedRef.current) {
          onErrorRef.current(`Connection closed unexpectedly (${e.code})`)
        }
        if (!userClosedRef.current) onSessionEndRef.current()
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return // user disconnected
      const msg = e instanceof Error ? e.message : "Connection failed"
      onErrorRef.current(msg)
      setStatus("error")
      isConnectingRef.current = false
    }
  }, [status, interviewId, systemInstruction])

  const sendAudio = useCallback((pcm16: ArrayBuffer) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN || status !== "active") return
    // Barge-in: clear AI audio queue when user sends audio while AI is speaking
    if (playerRef.current?.speaking) playerRef.current.clear()
    ws.send(JSON.stringify({
      realtimeInput: {
        mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: arrayBufferToBase64(pcm16) }],
      },
    }))
  }, [status])

  const sendVideo = useCallback((jpegBase64: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN || status !== "active") return
    ws.send(JSON.stringify({
      realtimeInput: {
        mediaChunks: [{ mimeType: "image/jpeg", data: jpegBase64 }],
      },
    }))
  }, [status])

  useEffect(() => () => { disconnect() }, [disconnect])

  return { status, connect, disconnect, sendAudio, sendVideo, isAiSpeaking }
}
