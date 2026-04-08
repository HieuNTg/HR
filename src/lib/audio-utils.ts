/** Convert Float32 samples [-1,1] to Int16 PCM [-32768,32767].
 *  Uses ±0x7fff/0x8000 asymmetry — standard IEEE 754 PCM convention. */
export function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]))
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return int16
}

/** Convert Int16 PCM to Float32 samples */
export function int16ToFloat32(int16: Int16Array): Float32Array {
  const float32 = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 0x8000
  }
  return float32
}

/**
 * Encode a Uint8Array (or the bytes of any typed array) to base64.
 * Single canonical implementation — use this instead of inline btoa loops.
 */
export function uint8ToBase64(bytes: Uint8Array): string {
  // Use apply only for small buffers; chunked for large to avoid stack overflow
  const CHUNK = 0x8000
  let binary = ""
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/** Encode Int16 PCM buffer to base64 string for WebSocket transmission */
export function pcmToBase64(pcm16: Int16Array): string {
  return uint8ToBase64(new Uint8Array(pcm16.buffer))
}

/** Decode base64 string to Int16 PCM buffer */
export function base64ToPcm(base64: string): Int16Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Int16Array(bytes.buffer)
}
