/**
 * Sequential PCM16 audio playback for Gemini Live API responses.
 * Decodes base64 PCM16 24kHz chunks and plays them gaplessly via Web Audio API.
 */

import { int16ToFloat32, base64ToPcm } from "@/lib/audio-utils"

const GEMINI_OUTPUT_SAMPLE_RATE = 24000 // Gemini outputs 24kHz PCM16

export class GeminiAudioPlayer {
  private ctx: AudioContext | null = null
  private nextPlayTime = 0
  private isPlaying = false
  private pendingChunks = 0
  // AbortController signals stale onended callbacks after clear() is called
  private abortController = new AbortController()

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
    // warmUp() should have been called in a user-gesture context first.
    // Resume here as a best-effort fallback (may be a no-op if already running).
    if (ctx.state === "suspended") ctx.resume().catch(() => {})

    const float32 = this.decodeChunk(base64Pcm16)
    if (float32.length === 0) return

    const buffer = ctx.createBuffer(1, float32.length, GEMINI_OUTPUT_SAMPLE_RATE)
    buffer.getChannelData(0).set(float32)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)

    // Schedule after previous chunk ends — gapless
    const when = Math.max(ctx.currentTime, this.nextPlayTime)
    source.start(when)
    this.nextPlayTime = when + buffer.duration

    this.pendingChunks++
    if (!this.isPlaying) {
      this.isPlaying = true
      this.onPlayStart?.()
    }

    // Capture signal at enqueue time — if clear() is called before this source ends,
    // the signal will be aborted and onended becomes a no-op.
    const { signal } = this.abortController
    source.onended = () => {
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

  /** Stop all playback immediately (barge-in / interrupt) */
  clear(): void {
    // Abort all pending onended callbacks
    this.abortController.abort()
    this.abortController = new AbortController()

    this.nextPlayTime = 0
    this.pendingChunks = 0
    if (this.isPlaying) {
      this.isPlaying = false
      // Recreate context to stop all in-flight sources cleanly
      this.ctx?.close()
      this.ctx = null
      this.onPlayEnd?.()
    }
  }

  get speaking(): boolean {
    return this.isPlaying
  }

  close(): void {
    this.clear() // clears context and fires onPlayEnd if needed
  }
}
