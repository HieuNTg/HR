# Phase 05 — Integration & Validation

**Parent:** [plan.md](./plan.md)  
**Dependencies:** Phase 01–04  
**Date:** 2026-04-09  
**Priority:** P2  
**Effort:** 0.5h  
**Status:** pending

---

## Context

After rebuilding all components, validate the full interview flow end-to-end. Focus on the critical audio pipeline fix (Phase 01) and session lifecycle (Phase 03).

---

## Requirements

1. **Manual E2E test** of full video interview flow
2. **Console verification** of correct audio sample rate
3. **Session lifecycle** test: start → AI greets → Q&A → end → report generated
4. **Barge-in test**: interrupt AI mid-speech, AI stops and listens
5. **Fallback test**: deny camera permission → falls back to text mode
6. **Disconnect test**: close tab mid-interview → no crash, no orphaned session

---

## Validation Checklist

### Audio Pipeline (Phase 01)
- [ ] Console shows: `[mic] source rate: 48000, target: 16000, chunk: 480 samples`
- [ ] No `400 Bad Request` or audio-related 1007 errors in WebSocket
- [ ] AI voice is clear and intelligible (not speed-distorted from wrong sample rate)

### First Response Trigger (Phase 03)
- [ ] AI begins speaking within 3s of `setupComplete`
- [ ] No silence packet visible in WebSocket frames (use DevTools → Network → WS)
- [ ] `audioStreamEnd` message visible in WS frames after `setupComplete`

### Transcription
- [ ] `outputTranscription.text` appears in transcript sidebar for AI speech
- [ ] `inputTranscription.text` appears for candidate speech
- [ ] Both show in correct order (AI first, then candidate)

### Session Lifecycle
- [ ] "Đang kết nối..." shows during WebSocket setup
- [ ] "Đang phỏng vấn" shows when active
- [ ] Ending call triggers `onSessionEnd` → `saveLiveResults` API call
- [ ] Report generation completes without error

### Edge Cases
- [ ] Camera permission denied → text mode fallback (no crash)
- [ ] Network drops mid-session → error message + retry button shown
- [ ] Multiple rapid connect attempts don't create duplicate WebSockets

---

## Debug Tools

```typescript
// Add to sendAudio temporarily to verify sample rate
console.debug('[audio] chunk size:', pcm16Buffer.byteLength, 'bytes =', 
  pcm16Buffer.byteLength / 2, 'samples @ 16kHz =',
  (pcm16Buffer.byteLength / 2 / 16000 * 1000).toFixed(0), 'ms')
```

Use Chrome DevTools → Network → Filter by `WS` → click the WebSocket connection → Messages tab to inspect frames.

---

## Related Files

All files modified in Phase 01–04.

---

## Todo

- [ ] Run full interview flow in dev environment
- [ ] Verify audio quality with `console.debug` logging
- [ ] Check WS frames in DevTools (audioStreamEnd present, no clientContent)
- [ ] Test barge-in
- [ ] Test permission denied fallback
- [ ] Remove debug logging before merge

---

## Success Criteria

All checklist items pass. AI interviews feel natural and responsive.

---

## Unresolved Questions

1. Does `audioStreamEnd` reliably trigger AI greeting on `gemini-3.1-flash-live-preview`? (Research suggests yes, but needs live test)
2. What's the real browser AudioContext rate on user's device? (Verify in Phase 01 logs)
3. Is 2-min video session limit enforced server-side? If so, add client-side warning at ~1:45.
