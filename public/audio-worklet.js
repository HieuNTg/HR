/**
 * AudioWorklet processor for Gemini Live API audio capture.
 *
 * Resamples browser-native audio (typically 48kHz) down to 16kHz via
 * linear interpolation, then emits 480-sample Float32 chunks (30ms).
 * The main thread converts Float32 → Int16 PCM before sending to Gemini.
 *
 * Registered as 'mic-processor'.
 */
const TARGET_RATE = 16000
const CHUNK_SIZE = 480    // 30ms at 16kHz
// Preallocate ring buffer: 4× the max required input per chunk (48kHz ratio = 3:1, buffer 4× = 1920)
const MAX_BUF = 8192      // power-of-2 ring capacity — safely covers any source rate up to 192kHz
const OUTPUT_BUF = new Float32Array(CHUNK_SIZE)

class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    // Ring buffer to avoid per-frame Float32Array allocation (reduces GC pressure in audio thread)
    this._ring = new Float32Array(MAX_BUF)
    this._writePos = 0  // next write position
    this._available = 0 // number of valid samples in ring
  }

  process(inputs) {
    const input = inputs[0]
    if (!input?.[0]) return true

    const channelData = input[0]
    // `sampleRate` is an AudioWorklet global — the actual browser context rate (e.g. 48000)
    const sourceRate = sampleRate
    const ratio = sourceRate / TARGET_RATE
    const requiredInput = Math.ceil(CHUNK_SIZE * ratio)

    // Write incoming samples into ring buffer (overwrite oldest if full — shouldn't happen at 1× speed)
    for (let i = 0; i < channelData.length; i++) {
      this._ring[this._writePos] = channelData[i]
      this._writePos = (this._writePos + 1) % MAX_BUF
      if (this._available < MAX_BUF) this._available++
    }

    // Emit resampled chunks whenever we have enough input samples
    while (this._available >= requiredInput) {
      const readStart = (this._writePos - this._available + MAX_BUF) % MAX_BUF
      for (let i = 0; i < CHUNK_SIZE; i++) {
        const srcIdx = i * ratio
        const lo = Math.floor(srcIdx)
        const hi = Math.min(lo + 1, requiredInput - 1)
        const frac = srcIdx - lo
        const loIdx = (readStart + lo) % MAX_BUF
        const hiIdx = (readStart + hi) % MAX_BUF
        OUTPUT_BUF[i] = this._ring[loIdx] * (1 - frac) + this._ring[hiIdx] * frac
      }
      this._available -= requiredInput
      // Transfer ownership of a copy (OUTPUT_BUF is reused next iteration)
      const out = OUTPUT_BUF.slice(0)
      this.port.postMessage({ type: 'audio', samples: out, sampleRate: TARGET_RATE }, [out.buffer])
    }

    return true
  }
}

registerProcessor('mic-processor', MicProcessor)
