# Phase 02 — Video Utilities

**Parent:** [plan.md](./plan.md)  
**Dependencies:** Phase 01 (audio-utils pattern)  
**Date:** 2026-04-09  
**Priority:** P2  
**Effort:** 0.5h  
**Status:** pending

---

## Context

Current video frame capture is inlined in `use-media-capture.ts`. The reference plan defines a `src/lib/video-utils.ts` module with reusable `captureFrame()`. Minor DRY/maintainability improvement.

---

## Key Insights

- Gemini Live accepts JPEG at ≤1 FPS, mimeType `image/jpeg`
- Current capture: 768×768 @ 0.85 quality (reference says 720×480 @ 0.6 — current is fine, higher quality OK)
- Canvas `toDataURL('image/jpeg', quality)` returns `data:image/jpeg;base64,...` — need to strip prefix
- No rate-limiting issues at 1 FPS; keep as-is

---

## Requirements

1. Create `src/lib/video-utils.ts`:
   - `captureFrame(videoElement, width?, height?, quality?): string` — returns base64 JPEG (no data URL prefix)

2. Update `src/hooks/use-media-capture.ts`:
   - Replace inline canvas capture with `captureFrame()` from video-utils

---

## Architecture

```
<video> element (hidden, from getUserMedia)
    → captureFrame(videoEl, 768, 768, 0.85) every 1000ms
    → setInterval in useMediaCapture
    → onVideoFrame(base64String) callback
    → session.sendVideo(base64)
    → WebSocket: { realtimeInput: { video: { mimeType: 'image/jpeg', data: base64 } } }
```

---

## Related Files

- `src/lib/video-utils.ts` → **create new**
- `src/hooks/use-media-capture.ts` → **update** (use captureFrame utility)

---

## Implementation Steps

### Step 1: Create `src/lib/video-utils.ts`

```typescript
export function captureFrame(
  videoElement: HTMLVideoElement,
  width = 768,
  height = 768,
  quality = 0.85,
): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d unavailable')
  ctx.drawImage(videoElement, 0, 0, width, height)
  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  return dataUrl.split(',')[1] // strip "data:image/jpeg;base64," prefix
}
```

### Step 2: Update `use-media-capture.ts`

Replace inline `canvas.toDataURL(...)` logic with `captureFrame(videoEl)`.

---

## Todo

- [ ] Create `src/lib/video-utils.ts`
- [ ] Update `use-media-capture.ts` to use `captureFrame`

---

## Success Criteria

- Video frames sent correctly (same format as before, just cleaner code)
- No regression in camera preview or video transmission

---

## Risk Assessment

Low risk — pure refactor, no behavior change.

---

## Next Steps

→ Phase 03: Session Hook Refactor
