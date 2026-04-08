# Codebase Analysis: Video Interview Implementation Gaps

## Executive Summary
Current implementation has **critical architectural gaps** preventing reliable Gemini Live integration. Missing audio resampling (critical), WebSocket message format inconsistencies, no modularized utilities, and fragile silence-packet handling.

---

## 1. CRITICAL ISSUE: Missing Audio Resampling

### Current State
- `audio-processor.js` converts **Float32→Int16 only**, no sample rate handling
- `use-media-capture.ts` creates AudioContext with requested 16kHz but browser typically returns 48kHz
- No downsampling pipeline: captures at native rate, sends at wrong rate

### Reference Plan Requirement (Section 6, lines 376-516)
Plan specifies:
```
48kHz/44.1kHz → linear interpolation resample → 16kHz → Float32→Int16
AudioWorklet processor with resampling buffer + 480-sample chunks
```

### Impact
- **Gemini Live API expects 16kHz PCM16** but receives mismatched sample rate
- Causes audio drift, dropped packets, quality degradation
- Plan includes full `resample()` utility + stateful resampling in AudioWorklet

### Current Gap
- `audio-processor.js` (21 lines) is **bare minimum**, missing:
  - Sample rate detection/storage
  - Resampling buffer accumulation
  - Linear interpolation math
- No `src/lib/audio-utils.ts` (plan defines this, codebase has nothing)

---

## 2. WebSocket Message Format Discrepancy

### Reference Plan (Line 217, use-gemini-live-session.ts)
```typescript
realtimeInput: {
  audio: { mimeType: "audio/pcm;rate=16000", data: arrayBufferToBase64(pcm16) }
}
```
**Actual implementation matches** ✓

### But Plan Also Defines (for future compatibility)
- Alternative: `mediaChunks: [{data, mimeType}]` format
- Plan shows both patterns as "WebSocket message format choice"

### Current State
- Single format hardcoded: `audio: {mimeType, data}`
- No flexibility for API version changes
- Inconsistency: video uses `video: {mimeType, data}` but not wrapped in `mediaChunks`

### Gap
- No abstraction layer for message building
- Tight coupling to current Gemini API message structure
- Plan suggests wrapping in `mediaChunks` for future API compat

---

## 3. Silence-Packet Hack (Not Implemented, But Expected)

### Reference Plan Section (Search "silence")
Plan mentions this pattern:
- "Send brief silence packet to trigger VAD"
- Workaround for Voice Activity Detection edge cases

### Current State
- **No silence-packet logic exists** in implementation
- VideoInterviewInterface sends audio when user speaks (natural VAD)
- GeminiAudioPlayer has no padding/warmup packet sending

### Risk
- If VAD fails to trigger, session hangs silently
- No fallback mechanism if first audio chunk is lost
- Plan suggests adding after warmUpAudio() call

### Current Position
- Works because Gemini Live API has built-in VAD
- But fragile: no defensive padding if API behavior changes

---

## 4. Missing Modularization: No audio-utils.ts / video-utils.ts

### Plan Defines (Lines 437-659)
Two utility modules:
1. **src/lib/audio-utils.ts** - Conversions + resampling
   - `float32ToInt16()`, `int16ToFloat32()`
   - `pcmToBase64()`, `base64ToPcm()`
   - `resample(input, sourceRate, targetRate)` - **LINEAR INTERPOLATION**

2. **src/lib/video-utils.ts** - Frame capture
   - `captureFrame(videoElement, width, height, quality)` - base64 JPEG

### Current State
- **Zero utility files** — all logic inline in hooks/components
- `use-media-capture.ts` line 138-140: frame capture inlined
- No reusable conversion functions anywhere
- Conversion logic duplicated across files

### Consequence
- Can't reuse audio/video conversion in tests or other features
- Harder to maintain and test encoding logic
- Violates DRY principle

---

## 5. Reference Plan vs Current Implementation

### Audio Pipeline (Plan vs Current)

| Aspect | Plan | Current |
|--------|------|---------|
| Resampling | 48kHz→16kHz (linear interp in AudioWorklet) | None—assumes 16kHz works |
| Conversion | Float32→Int16 in processor | Float32→Int16 in processor |
| Base64 encoding | Wrapped in audio-utils module | Inline in hook |
| Buffer management | Stateful 480-sample chunks | No chunking, raw postMessage |

### Session Setup (Plan vs Current)

| Aspect | Plan | Current |
|--------|------|---------|
| warmUpAudio() | Resume AudioContext in user gesture | ✓ Implemented (line 84) |
| Message format | Single format, no abstraction | ✓ Matches |
| Error handling | ECONNRESET suppression | ✓ Implemented (route.ts L56) |
| Ephemeral tokens | v1alpha fallback to API key | ✓ Implemented |

### Video Pipeline (Plan vs Current)

| Aspect | Plan | Current |
|--------|------|---------|
| Capture | Canvas.toDataURL() every 1000ms | ✓ Line 135-141 (1 FPS) |
| Quality | JPEG 0.6 quality | ✓ 0.85 quality (better) |
| Resolution | 720×480 | 768×768 (square, fine) |
| Module | video-utils.ts utility | Inline in hook |

---

## 6. Additional Gaps & Issues

### A. AudioContext Sample Rate Mismatch
- `use-media-capture.ts` L113: `AudioContext({ sampleRate: audioSampleRate })`
- But `audioSampleRate = 16000` (param default)
- Browser **overrides** this; creates at native 48kHz
- AudioContext doesn't honor sampleRate in constructor (read-only property)

### B. No Input Validation on Audio Chunks
- sendAudio() sends raw ArrayBuffer without checks
- No frame boundary validation
- Could send partial frames if media capture stutters

### C. Worklet Port Message Race Condition
- Line 122 in use-media-capture.ts: worklet fires immediately on process()
- No buffer accumulation—sends sub-128-sample chunks
- Gemini may not accept frames smaller than certain size

### D. No Jitter Buffer / Reordering
- WebSocket packets can arrive out-of-order
- No sequence numbers in audio chunks
- May cause audio glitches if packets reorder

### E. GeminiAudioPlayer Epoch Trick Works But Fragile
- Line 71-73: epoch invalidates stale callbacks
- Works, but non-standard pattern
- Should use AbortController or proper cleanup token

---

## 7. Type Safety Gaps

### Implicit Types in Worklet
- `audio-processor.js` receives `ArrayBuffer` from postMessage
- No TypeScript validation of Uint8Array vs Int16Array buffer layout
- Could send wrong byte ordering if changed

### Missing Type Definitions
- No `.d.ts` for audio-processor.js contract
- Hook doesn't validate onAudioChunk signature
- Could pass wrong buffer type without catching

---

## 8. What's Working ✓

- Ephemeral token fetching (route.ts)
- WebSocket connection setup & message parsing
- Audio playback scheduling (gapless)
- Media capture permission flow
- Video frame extraction (though quality config could use utils)
- AI speak detection via pending chunks counter
- Barge-in interrupt (clear queue on new audio)

---

## Unresolved Questions

1. Does current implementation actually pass audio at 48kHz to Gemini (causing errors we don't see)?
2. What sample rate does AudioContext actually create in browser? (Test needed)
3. Is video capture really 0.85 JPEG quality, or does toDataURL default override it?
4. Why are no current tests failing if audio resampling is missing?
5. Is the "silence packet" feature needed for current Gemini Live API version?
6. Does out-of-order WebSocket delivery cause audible artifacts?
