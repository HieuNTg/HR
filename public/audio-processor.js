/**
 * AudioWorklet processor for real-time PCM16 capture.
 * Converts Float32 audio samples to Int16Array and posts to main thread.
 * Registered as 'pcm-processor' for use with AudioWorkletNode.
 */
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]?.[0]
    if (!input) return true

    const pcm16 = new Int16Array(input.length)
    for (let i = 0; i < input.length; i++) {
      pcm16[i] = Math.max(-32768, Math.min(32767, input[i] * 32767))
    }

    this.port.postMessage(pcm16.buffer, [pcm16.buffer])
    return true
  }
}

registerProcessor("pcm-processor", PCMProcessor)
