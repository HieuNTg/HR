# Phase 01 — Audio Infrastructure

**Parent:** [plan.md](./plan.md)  
**Date:** 2026-04-09  
**Priority:** P1 (Critical)  
**Effort:** 1.5h  
**Status:** pending

---

## Context

Gemini Live API requires **16kHz PCM16 mono** audio input. Browser `AudioContext` runs at **48kHz** (hardware native). Current `audio-processor.js` converts Float32→Int16 but does **zero resampling** — we're sending 48kHz audio and Gemini is receiving garbled data.

Also missing: `src/lib/audio-utils.ts` (conversion utilities) referenced throughout the reference plan.

---

## Key Insights

- `AudioContext({ sampleRate: 16000 })` constructor hint is **ignored by Chrome/Firefox** — context always at native rate (48kHz)
- Resampling must happen in `AudioWorklet` (real-time, no main thread hop)
- Linear interpolation is sufficient (API accuracy not audio quality)
- Buffer size: 480 samples at 16kHz = 30ms chunks (good latency/overhead balance)
- `sampleRate` global in AudioWorklet context gives real rate — use it

---

## Requirements

1. Replace `public/audio-processor.js` with new `public/audio-worklet.js` that:
   - Reads `sampleRate` global (browser's actual rate, e.g. 48000)
   - Accumulates input samples in a float buffer
   - Downsamples to 16kHz via linear interpolation
   - Emits 480-sample chunks (30ms at 16kHz)
   - Posts `{ type: 'audio', samples: Float32Array, sampleRate: 16000 }`

2. Create `src/lib/audio-utils.ts`:
   - `float32ToInt16(float32: Float32Array): Int16Array`
   - `int16ToFloat32(int16: Int16Array): Float32Array`
   - `pcmToBase64(pcm16: Int16Array): string`
   - `base64ToPcm(base64: string): Int16Array`
   - `resample(input: Float32Array, sourceRate: number, targetRate: number): Float32Array`

3. Update `src/hooks/use-media-capture.ts`:
   - Change worklet module reference from `/audio-processor.js` → `/audio-worklet.js`
   - Remove incorrect `AudioContext({ sampleRate: audioSampleRate })` — use `new AudioContext()` (no hint)
   - Use `float32ToInt16` + `pcmToBase64` from audio-utils instead of inline conversion
   - Worklet posts pre-resampled Float32 at 16kHz → hook converts to Int16 → passes as ArrayBuffer

---

## Architecture

```
Microphone → getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    → AudioContext (at browser native rate: 48kHz)
    → MediaStreamAudioSourceNode
    → AudioWorkletNode('mic-processor')
        [WORKLET]
        accumulate Float32 samples at 48kHz
        when buffer >= 480 * (48000/16000) = 1440 samples:
            resample 1440 → 480 via linear interp
            postMessage({ type:'audio', samples: Float32Array(480), sampleRate: 16000 })
    → main thread: float32ToInt16(samples) → Int16Array
    → main thread: pcmToBase64(int16) → string  [OR pass as ArrayBuffer directly]
    → session.sendAudio(int16.buffer) → WebSocket
```

---

## Related Files

- `public/audio-processor.js` → **replace** with `public/audio-worklet.js`
- `src/lib/audio-utils.ts` → **create new**
- `src/hooks/use-media-capture.ts` → **update** worklet ref + conversion

---

## Implementation Steps

### Step 1: Create `public/audio-worklet.js`

```javascript
class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buffer = new Float32Array(0)
    this._targetRate = 16000
    this._chunkSize = 480 // 30ms at 16kHz
  }

  process(inputs) {
    const input = inputs[0]
    if (!input?.[0]) return true

    const channelData = input[0]
    const sourceRate = sampleRate // AudioWorklet global — actual browser rate

    // Accumulate
    const combined = new Float32Array(this._buffer.length + channelData.length)
    combined.set(this._buffer)
    combined.set(channelData, this._buffer.length)
    this._buffer = combined

    const ratio = sourceRate / this._targetRate
    const requiredInput = Math.ceil(this._chunkSize * ratio)

    while (this._buffer.length >= requiredInput) {
      const resampled = new Float32Array(this._chunkSize)
      for (let i = 0; i < this._chunkSize; i++) {
        const srcIdx = i * ratio
        const lo = Math.floor(srcIdx)
        const hi = Math.min(lo + 1, this._buffer.length - 1)
        const frac = srcIdx - lo
        resampled[i] = this._buffer[lo] * (1 - frac) + this._buffer[hi] * frac
      }
      this._buffer = this._buffer.slice(requiredInput)
      this.port.postMessage({ type: 'audio', samples: resampled, sampleRate: this._targetRate })
    }

    return true
  }
}

registerProcessor('mic-processor', MicProcessor)
```

### Step 2: Create `src/lib/audio-utils.ts`

Full utility functions: `float32ToInt16`, `int16ToFloat32`, `pcmToBase64`, `base64ToPcm`, `resample`

### Step 3: Update `use-media-capture.ts`

- Change worklet path: `/audio-processor.js` → `/audio-worklet.js`
- Change `new AudioContext({ sampleRate: audioSampleRate })` → `new AudioContext()`
- Change worklet name: `'pcm-processor'` → `'mic-processor'` (match new worklet)
- Handle `event.data.type === 'audio'` (already matches new format)
- Use `float32ToInt16` from audio-utils

---

## Todo

- [ ] Create `public/audio-worklet.js` (new, replaces audio-processor.js)
- [ ] Create `src/lib/audio-utils.ts`
- [ ] Update `src/hooks/use-media-capture.ts` (worklet path, AudioContext, processor name)
- [ ] Verify `public/audio-processor.js` is no longer referenced (can keep for safety or remove)

---

## Success Criteria

- AudioWorklet emits 480-sample Float32 chunks at `sampleRate: 16000`
- `sendAudio()` sends Int16 PCM at 16kHz to Gemini (verified via console log)
- No "Invalid argument" or malformed audio errors from Gemini WebSocket
- AI voice responses are coherent and not distorted

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Browser AudioContext real rate not 48kHz | Low | High | Use `sampleRate` global (authoritative) |
| Resampling introduces latency | Low | Medium | 480-sample chunks = 30ms — acceptable |
| Old `audio-processor.js` still loaded | Medium | High | Update all references in use-media-capture.ts |

---

## Security Considerations

- No API keys in AudioWorklet (worklet only processes audio, no network)
- Microphone access requires user gesture — already handled

---

## Next Steps

→ Phase 02: Video Utilities
