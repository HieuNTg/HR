# Phase 04 — UI Component Update

**Parent:** [plan.md](./plan.md)  
**Dependencies:** Phase 01, Phase 03  
**Date:** 2026-04-09  
**Priority:** P2  
**Effort:** 1.5h  
**Status:** pending

---

## Context

`VideoInterviewInterface` works but has UX gaps and couples too tightly to hooks internals. With Phase 01-03 done, the component needs to consume the new `sendText` API and provide better status feedback.

Also: the interview page (`src/app/(dashboard)/interviews/page.tsx` and `[id]/page.tsx`) may need minor updates for the new session lifecycle.

---

## Key Insights

- Current pre-start screen is good — keep it (satisfies Chrome AudioContext autoplay policy)
- "Đang chờ AI phản hồi..." empty-state message works but could show connection status
- Session status states: `idle → connecting → active → error | closed`
- `sendText` from Phase 03 enables hybrid mode: user types during video interview
- `VideoAvatarPanel` with `isAiSpeakingLive` drives lip-sync — keep as-is
- Dashboard page shows interview list — no changes needed

---

## Requirements

1. **`VideoInterviewInterface` updates:**
   - Expose session status (`connecting`, `active`, `error`) in UI (status badge)
   - Show connection error message with retry button
   - Optionally expose `sendText` for hybrid mode (text input while on video)
   - Clean up `started` state logic (currently leaks if connection fails)

2. **`VideoAvatarPanel`** — no changes needed (already has `isAiSpeakingLive`)

3. **Interviews page** (`src/app/(dashboard)/interviews/[id]/page.tsx`):
   - Verify `onSessionEnd` callback triggers report generation correctly
   - Verify mode switching (VIDEO ↔ TEXT) still works after hook refactor

---

## Architecture

```
VideoInterviewInterface
├── Pre-start screen (user gesture → warmUpAudio + connect + media.start)
├── Permission denied screen (→ onFallbackToText)
├── Active session screen:
│   ├── Left column:
│   │   ├── CandidateCameraPreview (video element + controls)
│   │   └── VideoAvatarPanel (isAiSpeakingLive=session.isAiSpeaking)
│   ├── Right column:
│   │   ├── SessionStatusBadge (new: connecting/active/error)
│   │   ├── TranscriptList (ai/candidate turns)
│   │   └── [optional] TextInputBar (sendText for hybrid)
│   └── Error banner (non-fatal: show + allow continue; fatal: show + end)
```

---

## Related Files

- `src/components/interview/video-interview-interface.tsx` → **update**
- `src/app/(dashboard)/interviews/[id]/page.tsx` → **verify/minor update**
- `src/components/interview/video-avatar-panel.tsx` → no changes

---

## Implementation Steps

### Step 1: Session status badge

Add a small badge showing connection status:
```tsx
const statusLabel = {
  idle: null,
  connecting: "Đang kết nối...",
  active: "Đang phỏng vấn",
  error: "Lỗi kết nối",
  closed: "Đã kết thúc",
}[session.status]
```

### Step 2: Error handling UI

Replace `sessionError` string display with:
- Non-fatal (e.g. audio hiccup): toast notification, auto-dismiss
- Fatal (connection closed unexpectedly): error banner with "Thử lại" button

```tsx
const handleRetry = useCallback(async () => {
  setSessionError(null)
  await session.connect()
}, [session])
```

### Step 3: `started` state cleanup

If `connect()` fails, reset `started` to show pre-start screen again:
```typescript
const handleStart = useCallback(async () => {
  setStarted(true)
  try {
    await session.warmUpAudio()
    await session.connect()
    await media.start()
  } catch {
    setStarted(false) // allow retry
  }
}, [session, media])
```

### Step 4: Hybrid text input (optional, scope-dependent)

If required by product: add collapsible text input bar at bottom:
```tsx
<form onSubmit={(e) => { e.preventDefault(); session.sendText(textInput); setTextInput('') }}>
  <input value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Nhập câu trả lời..." />
  <button type="submit">Gửi</button>
</form>
```

### Step 5: Verify interview page callbacks

- `onSessionEnd` → check it calls `saveLiveResults` API correctly
- `onTranscript` → check it updates Zustand store
- Mode toggle → verify `setInterviewMode('VIDEO')` / `'TEXT'` still dispatches correctly

---

## Todo

- [ ] Add session status badge to `VideoInterviewInterface`
- [ ] Improve error handling UI (retry button for fatal errors)
- [ ] Fix `started` state reset on connection failure
- [ ] Optional: add hybrid text input bar
- [ ] Verify interview page callbacks after hook changes

---

## Success Criteria

- User sees "Đang kết nối..." while WebSocket is establishing
- User sees "Đang phỏng vấn" when session is active
- Connection failure shows error + retry (not blank screen)
- Interview completion triggers report generation (no regression)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| `sendText` in hybrid mode causes 1007 | Low | Medium | Test before enabling; keep behind flag |
| Retry logic double-connects | Low | Medium | Guard with `isConnecting` ref |

---

## Security Considerations

- Hybrid text input must sanitize before display (XSS via transcript render)
- Existing `ChatMessageBubble` handles this — use it for rendering

---

## Next Steps

→ Phase 05: Integration & Validation
