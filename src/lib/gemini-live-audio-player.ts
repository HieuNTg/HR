/**
 * Sequential PCM16 audio playback for Gemini Live API responses.
 * Decodes base64 PCM16 24kHz chunks and plays them gaplessly via Web Audio API.
 */

import { int16ToFloat32, base64ToPcm } from "@/lib/audio-utils"

const GEMINI_OUTPUT_SAMPLE_RATE = 24000 // Gemini outputs 24kHz PCM16
/** Lookahead added when a late chunk arrives (nextPlayTime already passed).
 *  Gives the audio rendering thread enough lead time to schedule smoothly
 *  instead of scheduling at currentTime which may already be past by render time. */
const LOOKAHEAD_S = 0.05 // 50ms

export class GeminiAudioPlayer {
  private ctx: AudioContext | null = null
  private nextPlayTime = 0
  private isPlaying = false
  private pendingChunks = 0
  // AbortController signals stale onended callbacks after clear() is called
  private abortController = new AbortController()
  // Track live sources so clear() can stop them without closing the AudioContext
  private scheduledSources: AudioBufferSourceNode[] = []
  // Buffer chunks received while AudioContext is suspended, replay on resume
  private suspendBuffer: string[] = []
  private skippedChunks = 0

  onPlayStart?: () => void
  onPlayEnd?: () => void

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext({ sampleRate: GEMINI_OUTPUT_SAMPLE_RATE })
    }
    return this.ctx
  }

  /** Decode base64 PCM16 → Float32Array (uses shared audio-utils to avoid duplication) */
  private decodeChunk(base64: string): Float32Array {
    return int16ToFloat32(base64ToPcm(base64))
  }

  /** Pre-warm the AudioContext inside a user-gesture callback to avoid autoplay suspension */
  async warmUp(): Promise<void> {
    const ctx = this.ensureContext()
    if (ctx.state === "suspended") await ctx.resume()
  }

  /** Enqueue and schedule a PCM16 audio chunk for gapless playback */
  enqueue(base64Pcm16: string): void {
    const ctx = this.ensureContext()
    // Buffer chunks while suspended — replay when context resumes
    if (ctx.state === "suspended") {
      this.suspendBuffer.push(base64Pcm16)
      this.skippedChunks++
      if (this.skippedChunks <= 3) {
        console.warn(`[audio-player] AudioContext suspended, buffering chunk #${this.skippedChunks} (call warmUp() in user gesture)`)
      }
      ctx.resume().then(() => this.flushSuspendBuffer()).catch(() => {})
      return
    }
    this.skippedChunks = 0

    const float32 = this.decodeChunk(base64Pcm16)
    if (float32.length === 0) return

    const buffer = ctx.createBuffer(1, float32.length, GEMINI_OUTPUT_SAMPLE_RATE)
    buffer.getChannelData(0).set(float32)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)

    // Schedule after previous chunk ends — gapless.
    // If nextPlayTime has already passed (late chunk due to network jitter), add LOOKAHEAD_S
    // so the audio rendering thread has time to process the scheduling command.
    const when = this.nextPlayTime > ctx.currentTime
      ? this.nextPlayTime
      : ctx.currentTime + LOOKAHEAD_S
    source.start(when)
    this.nextPlayTime = when + buffer.duration

    this.pendingChunks++
    this.scheduledSources.push(source)
    if (!this.isPlaying) {
      this.isPlaying = true
      this.onPlayStart?.()
    }

    // Capture signal at enqueue time — if clear() is called before this source ends,
    // the signal will be aborted and onended becomes a no-op.
    const { signal } = this.abortController
    source.onended = () => {
      this.scheduledSources = this.scheduledSources.filter(s => s !== source)
      if (signal.aborted) return
      this.pendingChunks--
      if (this.pendingChunks <= 0) {
        this.pendingChunks = 0
        this.isPlaying = false
        this.nextPlayTime = 0
        this.onPlayEnd?.()
      }
    }
  }

  /** Replay buffered chunks after AudioContext resumes from suspended state */
  private flushSuspendBuffer(): void {
    if (!this.ctx || this.ctx.state !== "running") return
    const buffered = this.suspendBuffer.splice(0)
    for (const chunk of buffered) {
      this.enqueue(chunk)
    }
  }

  /** Stop all playback immediately (barge-in / interrupt) */
  clear(): void {
    // Abort all pending onended callbacks
    this.abortController.abort()
    this.abortController = new AbortController()

    // Stop each scheduled source individually — preserves the AudioContext so the
    // warm-up resume() from the user gesture remains valid for future chunks.
    for (const src of this.scheduledSources) {
      try { src.stop() } catch { /* already ended */ }
    }
    this.scheduledSources = []
    this.suspendBuffer = []
    this.skippedChunks = 0

    this.nextPlayTime = 0
    this.pendingChunks = 0
    if (this.isPlaying) {
      this.isPlaying = false
      this.onPlayEnd?.()
    }
  }

  get speaking(): boolean {
    return this.isPlaying
  }

  close(): void {
    this.clear()
    this.ctx?.close()
    this.ctx = null
  }
}
