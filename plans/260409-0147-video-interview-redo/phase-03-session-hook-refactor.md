# Phase 03 — Session Hook Refactor

**Parent:** [plan.md](./plan.md)  
**Dependencies:** Phase 01 (audio-utils)  
**Date:** 2026-04-09  
**Priority:** P1  
**Effort:** 2h  
**Status:** pending

---

## Context

`use-gemini-live-session.ts` is the core WebSocket orchestrator. Current issues:
1. `sendAudio()` receives raw ArrayBuffer but performs no resampling verification
2. First-response trigger: old code had "send silence packet" hack (removed in recent commit); need clean `audioStreamEnd` approach
3. `GeminiAudioPlayer` uses epoch-based barge-in detection (functional but opaque)
4. No `sendText()` capability (may be needed for hybrid interviews)

Also: `src/lib/gemini-live-audio-player.ts` needs audit for cleanup reliability.

---

## Key Insights

- **`audioStreamEnd`** is the clean way to tell Gemini "user input done, please respond":
  ```json
  { "realtimeInput": { "audioStreamEnd": {} } }
  ```
  Send this after `setupComplete` to trigger AI greeting. Replaces silence-packet hack.
- **VAD is always active** — if user speaks, AI responds automatically. `audioStreamEnd` only needed for initial trigger.
- **`clientContent` is banned** mid-session for native audio models (1007 error). Use `realtimeInput.text` for any text input.
- **Max session**: 15min audio-only, 2min with video — add session timer or at minimum log warning.
- Current `sendAudio()` correctly receives `ArrayBuffer` from Phase 01's updated hook.

---

## Requirements

1. **`use-gemini-live-session.ts` changes:**
   - On `setupComplete`: send `audioStreamEnd` to trigger AI greeting (cleaner than silence packet)
   - Add `sendText(text: string)` method using `realtimeInput.text` format
   - Add session duration timer (warn at 13min for audio-only, 1.5min for video)
   - Improve error messages (distinguish 1007/1011/1006 WebSocket close codes)
   - Remove old silence-packet dead code if any remains

2. **`src/lib/gemini-live-audio-player.ts` audit:**
   - Verify cleanup on `close()` / `clear()` is reliable
   - Ensure `speaking` getter returns correct state
   - No behavioral changes unless bugs found

---

## Architecture

```
setupComplete received
    ↓
send audioStreamEnd → { realtimeInput: { audioStreamEnd: {} } }
    ↓
Gemini detects end-of-input, generates greeting + Q1
    ↓
serverContent.modelTurn.parts[].inlineData → enqueue to GeminiAudioPlayer
outputTranscription.text → onTranscript("...", "ai")
    ↓
AI playback starts → onAiSpeakStart()
AI playback ends → onAiSpeakEnd()
    ↓
User speaks into mic → sendAudio(pcm16Buffer)
    [barge-in: if player.speaking → player.clear()]
    → { realtimeInput: { audio: { mimeType: "audio/pcm;rate=16000", data: base64 } } }
    ↓
inputTranscription.text → onTranscript("...", "candidate")
```

---

## Related Files

- `src/hooks/use-gemini-live-session.ts` → **update**
- `src/lib/gemini-live-audio-player.ts` → **audit + minor fixes if needed**

---

## Implementation Steps

### Step 1: `setupComplete` handler — replace silence with `audioStreamEnd`

```typescript
if ("setupComplete" in msg) {
  setStatus("active")
  wasActiveRef.current = true
  isConnectingRef.current = false

  // Trigger AI to produce greeting without silence-packet hack
  ws.send(JSON.stringify({ realtimeInput: { audioStreamEnd: {} } }))
  return
}
```

### Step 2: Add `sendText()` method

```typescript
const sendText = useCallback((text: string) => {
  const ws = wsRef.current
  if (!ws || ws.readyState !== WebSocket.OPEN) return
  ws.send(JSON.stringify({
    realtimeInput: { text: { text } },
  }))
}, [])
```

### Step 3: WebSocket close code handling

```typescript
ws.onclose = (e) => {
  const reason = WS_CLOSE_REASONS[e.code] ?? `code ${e.code}`
  // 1007 = native audio model received clientContent mid-session (programming error)
  // 1011 = server internal error (may retry)
  // 1006 = abnormal close (network drop)
  ...
}

const WS_CLOSE_REASONS: Record<number, string> = {
  1000: "Normal close",
  1006: "Mất kết nối mạng",
  1007: "Lỗi giao thức — liên hệ hỗ trợ",
  1011: "Lỗi server Gemini",
}
```

### Step 4: Update `UseGeminiLiveSessionReturn` type

Add `sendText` to the returned interface.

### Step 5: Audit `gemini-live-audio-player.ts`

Check:
- `speaking` getter accuracy (based on pending chunks counter)
- `clear()` actually stops all scheduled AudioBufferSourceNodes
- `close()` closes AudioContext cleanly
- No memory leaks from unclosed source nodes

---

## Todo

- [ ] Update `setupComplete` handler to send `audioStreamEnd`
- [ ] Add `sendText()` method + update return type
- [ ] Improve WS close code error messages
- [ ] Audit `gemini-live-audio-player.ts` for cleanup reliability
- [ ] Remove any lingering silence-packet dead code

---

## Success Criteria

- AI greets candidate within 2s of session starting (no silence hack needed)
- Barge-in works: user speech during AI playback cuts AI off
- Session ends gracefully when user hangs up
- WebSocket 1007/1011 errors show meaningful messages in UI

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| `audioStreamEnd` not supported by model | Low | High | Fallback: small actual silence buffer (32ms zeros at 16kHz) |
| Player cleanup leaves AudioContext open | Low | Medium | Verify `close()` in audit step |
| `sendText` causes 1007 if model rejects | Low | Low | Wrap in try-catch, log warning |

---

## Security Considerations

- No user input goes to `clientContent` (would expose to 1007 + potential injection)
- `sendText` uses `realtimeInput.text` (correct, safe path)

---

## Next Steps

→ Phase 04: UI Component Update
