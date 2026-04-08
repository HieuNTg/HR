"use client"

import { useRef, useState, useCallback, useEffect } from "react"

export interface UseMediaCaptureOptions {
  onAudioChunk: (pcm16: ArrayBuffer) => void
  onVideoFrame: (jpegBase64: string) => void
  videoFps?: number        // default 1
  videoWidth?: number      // default 768
  videoHeight?: number     // default 768
  audioSampleRate?: number // default 16000
}

export type CaptureStatus = "idle" | "requesting" | "active" | "error" | "denied"

export interface UseMediaCaptureReturn {
  status: CaptureStatus
  error: string | null
  videoRef: React.RefObject<HTMLVideoElement | null>
  start: () => Promise<void>
  stop: () => void
  toggleMute: () => void
  isMuted: boolean
  hasCamera: boolean
  hasMic: boolean
  getRecordedAudio: () => Blob | null
}

export function useMediaCapture({
  onAudioChunk,
  onVideoFrame,
  videoFps = 1,
  videoWidth = 768,
  videoHeight = 768,
  audioSampleRate = 16000,
}: UseMediaCaptureOptions): UseMediaCaptureReturn {
  const [status, setStatus] = useState<CaptureStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const [hasMic, setHasMic] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const videoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const isMutedRef = useRef(false)
  const isStartingRef = useRef(false)
  const recordedMimeRef = useRef("audio/webm")

  // Stable callback refs — avoid stale closures in worklet handler
  const onAudioChunkRef = useRef(onAudioChunk)
  const onVideoFrameRef = useRef(onVideoFrame)
  useEffect(() => { onAudioChunkRef.current = onAudioChunk }, [onAudioChunk])
  useEffect(() => { onVideoFrameRef.current = onVideoFrame }, [onVideoFrame])

  // Check device availability upfront
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      setHasCamera(devices.some((d) => d.kind === "videoinput"))
      setHasMic(devices.some((d) => d.kind === "audioinput"))
    }).catch(() => {})
  }, [])

  const stop = useCallback(() => {
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current)
      videoIntervalRef.current = null
    }
    workletNodeRef.current?.disconnect()
    workletNodeRef.current = null
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop()
    recorderRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus("idle")
    setIsMuted(false)
    isMutedRef.current = false
  }, [])

  const start = useCallback(async () => {
    if (isStartingRef.current || status === "active") return
    isStartingRef.current = true
    setStatus("requesting")
    setError(null)
    recordedChunksRef.current = []

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia not supported")
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: videoWidth }, height: { ideal: videoHeight }, facingMode: "user" },
        audio: { sampleRate: audioSampleRate, channelCount: 1, echoCancellation: true },
      })
      streamRef.current = stream

      // Attach to video element for preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }

      // ── AudioWorklet setup ──────────────────────────────────────────────
      const audioCtx = new AudioContext({ sampleRate: audioSampleRate })
      audioCtxRef.current = audioCtx
      if (audioCtx.state === "suspended") await audioCtx.resume()
      await audioCtx.audioWorklet.addModule("/audio-processor.js")

      const source = audioCtx.createMediaStreamSource(stream)
      const workletNode = new AudioWorkletNode(audioCtx, "pcm-processor")
      workletNodeRef.current = workletNode

      workletNode.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
        if (!isMutedRef.current) onAudioChunkRef.current(e.data)
      }
      source.connect(workletNode)
      // No connect to destination — we only want to capture, not play back mic

      // ── Video frame capture ─────────────────────────────────────────────
      if (!canvasRef.current) canvasRef.current = document.createElement("canvas")
      const canvas = canvasRef.current
      canvas.width = videoWidth
      canvas.height = videoHeight
      const ctx2d = canvas.getContext("2d")!

      videoIntervalRef.current = setInterval(() => {
        const video = videoRef.current
        if (!video || video.readyState < 2) return
        ctx2d.drawImage(video, 0, 0, videoWidth, videoHeight)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
        onVideoFrameRef.current(dataUrl.split(",")[1]) // strip data:image/jpeg;base64,
      }, Math.round(1000 / videoFps))

      // ── MediaRecorder for audio saving (WebM/OGG) ──────────────────────
      const audioOnlyStream = new MediaStream(stream.getAudioTracks())
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg"
      recordedMimeRef.current = mimeType
      const recorder = new MediaRecorder(audioOnlyStream, { mimeType })
      recorderRef.current = recorder
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data)
      }
      recorder.start(1000) // collect chunks every 1s

      setStatus("active")
    } catch (e) {
      const err = e as Error
      const isDenied = err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
      setStatus(isDenied ? "denied" : "error")
      setError(err.message ?? "Media capture failed")
      stop()
    } finally {
      isStartingRef.current = false
    }
  }, [status, videoWidth, videoHeight, audioSampleRate, videoFps, stop])

  const toggleMute = useCallback(() => {
    const track = streamRef.current?.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    isMutedRef.current = !track.enabled
    setIsMuted(!track.enabled)
  }, [])

  const getRecordedAudio = useCallback((): Blob | null => {
    const chunks = recordedChunksRef.current
    if (!chunks.length) return null
    return new Blob(chunks, { type: recordedMimeRef.current })
  }, [])

  // Cleanup on unmount
  useEffect(() => () => { stop() }, [stop])

  return { status, error, videoRef, start, stop, toggleMute, isMuted, hasCamera, hasMic, getRecordedAudio }
}
