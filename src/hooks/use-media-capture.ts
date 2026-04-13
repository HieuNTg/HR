"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { float32ToInt16 } from "@/lib/audio-utils"
import { captureFrame } from "@/lib/video-utils"

export interface UseMediaCaptureOptions {
  onAudioChunk: (pcm16: ArrayBuffer) => void
  onVideoFrame: (jpegBase64: string) => void
  videoFps?: number        // default 0.5
  captureWidth?: number    // frame sent to Gemini, default 512
  captureHeight?: number   // frame sent to Gemini, default 512
  /** Optional AI audio MediaStream — mixed into the recording so the saved blob
   *  contains both mic + AI speech. Provided lazily so the hook is agnostic to
   *  session startup order. */
  getExtraAudioStream?: () => MediaStream | null
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
  /** Stop the recorder and resolve with the final flushed Blob. Safe to call
   *  before stop() — ensures trailing audio chunks are captured. */
  stopRecordingAndGetAudio: () => Promise<Blob | null>
}

export function useMediaCapture({
  onAudioChunk,
  onVideoFrame,
  videoFps = 0.5,
  captureWidth = 512,
  captureHeight = 512,
  getExtraAudioStream,
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
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const isMutedRef = useRef(false)
  const isStartingRef = useRef(false)
  const recordedMimeRef = useRef("audio/webm")
  // Mix destination for mic + AI audio — feeds MediaRecorder
  const mixDestRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const getExtraAudioStreamRef = useRef(getExtraAudioStream)
  useEffect(() => { getExtraAudioStreamRef.current = getExtraAudioStream }, [getExtraAudioStream])

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
    mixDestRef.current?.disconnect()
    mixDestRef.current = null
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
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
      streamRef.current = stream

      // Attach to video element for preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }

      // ── AudioWorklet setup ──────────────────────────────────────────────
      // Do NOT pass sampleRate hint — browsers ignore it and it can cause issues.
      // The worklet reads the actual sampleRate global and resamples to 16kHz internally.
      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      if (audioCtx.state === "suspended") await audioCtx.resume()
      await audioCtx.audioWorklet.addModule("/audio-worklet.js")

      const source = audioCtx.createMediaStreamSource(stream)
      const workletNode = new AudioWorkletNode(audioCtx, "mic-processor")
      workletNodeRef.current = workletNode

      // Worklet posts { type:'audio', samples:Float32Array, sampleRate:16000 }
      // Convert Float32 → Int16 here and pass the buffer to the session hook
      workletNode.port.onmessage = (e: MessageEvent<{ type: string; samples: Float32Array; sampleRate: number }>) => {
        if (e.data.type !== "audio") return
        if (isMutedRef.current) return
        const int16 = float32ToInt16(e.data.samples)
        onAudioChunkRef.current(int16.buffer as ArrayBuffer)
      }
      source.connect(workletNode)
      // No connect to destination — capture only, no mic playback

      // ── Mix mic + AI output for recording ───────────────────────────────
      // We feed a MediaStreamAudioDestinationNode on the capture AudioContext.
      // MediaStreamAudioSourceNode auto-resamples the incoming stream, so the
      // player's 24kHz context and this context (device rate) interop safely.
      const mixDest = audioCtx.createMediaStreamDestination()
      mixDestRef.current = mixDest
      source.connect(mixDest) // mic → mix
      const extraStream = getExtraAudioStreamRef.current?.()
      if (extraStream && extraStream.getAudioTracks().length) {
        const aiSource = audioCtx.createMediaStreamSource(extraStream)
        aiSource.connect(mixDest) // AI → mix
      } else {
        console.warn("[media-capture] no AI audio stream — recording mic only")
      }

      // ── Video frame capture ─────────────────────────────────────────────
      videoIntervalRef.current = setInterval(() => {
        const video = videoRef.current
        if (!video || video.readyState < 2) return
        const videoTrack = streamRef.current?.getVideoTracks()[0]
        if (!videoTrack?.enabled) return
        const frame = captureFrame(video, captureWidth, captureHeight)
        onVideoFrameRef.current(frame)
      }, Math.round(1000 / videoFps))

      // ── MediaRecorder for audio saving (WebM/OGG) ──────────────────────
      // Records the MIXED stream (mic + AI) so the saved blob contains the full conversation.
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg"
      recordedMimeRef.current = mimeType
      const recorder = new MediaRecorder(mixDest.stream, { mimeType })
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
  }, [status, captureWidth, captureHeight, videoFps, stop])

  const toggleMute = useCallback(() => {
    const track = streamRef.current?.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    isMutedRef.current = !track.enabled
    setIsMuted(!track.enabled)
    // Pause/resume recorder so saved audio respects mute state
    const rec = recorderRef.current
    if (!track.enabled) {
      if (rec?.state === "recording") rec.pause()
    } else {
      if (rec?.state === "paused") rec.resume()
    }
  }, [])

  const getRecordedAudio = useCallback((): Blob | null => {
    const chunks = recordedChunksRef.current
    if (!chunks.length) return null
    return new Blob(chunks, { type: recordedMimeRef.current })
  }, [])

  const stopRecordingAndGetAudio = useCallback((): Promise<Blob | null> => {
    const rec = recorderRef.current
    if (!rec || rec.state === "inactive") return Promise.resolve(getRecordedAudio())
    return new Promise((resolve) => {
      const finish = () => resolve(getRecordedAudio())
      rec.addEventListener("stop", finish, { once: true })
      try { rec.stop() } catch { finish() }
    })
  }, [getRecordedAudio])

  // Cleanup on unmount
  useEffect(() => () => { stop() }, [stop])

  return { status, error, videoRef, start, stop, toggleMute, isMuted, hasCamera, hasMic, getRecordedAudio, stopRecordingAndGetAudio }
}
