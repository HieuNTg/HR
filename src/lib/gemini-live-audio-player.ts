/**
 * Sequential PCM16 audio playback for Gemini Live API responses.
 * Decodes base64 PCM16 24kHz chunks and plays them gaplessly via Web Audio API.
 */

const GEMINI_OUTPUT_SAMPLE_RATE = 24000 // Gemini outputs 24kHz PCM16

export class GeminiAudioPlayer {
  private ctx: AudioContext | null = null
  private nextPlayTime = 0
  private isPlaying = false
  private pendingChunks = 0
  private epoch = 0 // incremented on clear() to invalidate stale onended callbacks

  onPlayStart?: () => void
  onPlayEnd?: () => void

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext({ sampleRate: GEMINI_OUTPUT_SAMPLE_RATE })
    }
    return this.ctx
  }

  /** Decode base64 PCM16 → Float32Array */
  private decodeChunk(base64: string): Float32Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

    const int16 = new Int16Array(bytes.buffer)
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0
    return float32
  }

  /** Enqueue and schedule a PCM16 audio chunk for gapless playback */
  enqueue(base64Pcm16: string): void {
    const ctx = this.ensureContext()
    if (ctx.state === "suspended") ctx.resume()

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

    const capturedEpoch = this.epoch
    source.onended = () => {
      if (capturedEpoch !== this.epoch) return // invalidated by clear()
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
    this.epoch++ // invalidate all pending onended callbacks
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
