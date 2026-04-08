---
title: "Video Interview Feature Redo — Gemini 3.1 Flash Live"
description: "Rebuild video interview with proper audio resampling, modular utils, and clean Gemini Live protocol integration"
status: done
priority: P1
effort: 6h
branch: master
tags: [gemini-live, video-interview, audio-pipeline, refactor]
created: 2026-04-09
---

# Video Interview Feature Redo

Reference: `Gemini-3.1-Flash-Live-Realtime-Chat-Plan.md` (released 2026-04-06, model `gemini-3.1-flash-live-preview`)

## Problem Summary

Current implementation is **functionally unstable** due to:
1. **Critical**: No audio resampling — browser AudioContext at 48kHz sends to Gemini expecting 16kHz
2. **Critical**: AudioWorklet (`audio-processor.js`) is 21-line stub with no resampling
3. **Missing**: No `audio-utils.ts` / `video-utils.ts` utility modules (logic scattered inline)
4. **Fragile**: Silence-packet hack in old branch (removed but concept unclear); should use `audioStreamEnd`
5. **Minor**: `AudioContext({ sampleRate: 16000 })` hint is ignored by browsers

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 01 | [Audio Infrastructure](./phase-01-audio-infrastructure.md) | done (2026-04-09) | 1.5h |
| 02 | [Video Utilities](./phase-02-video-utilities.md) | done (2026-04-09) | 0.5h |
| 03 | [Session Hook Refactor](./phase-03-session-hook-refactor.md) | done (2026-04-09) | 2h |
| 04 | [UI Component Update](./phase-04-ui-component-update.md) | done (2026-04-09) | 1.5h |
| 05 | [Integration & Validation](./phase-05-integration-validation.md) | done (2026-04-09) | 0.5h |

## Key Decisions

- **Model**: Keep `gemini-3.1-flash-live-preview` (already set, correct)
- **Resampling**: In AudioWorklet processor (stateful linear interpolation, 48→16kHz)
- **First response trigger**: `audioStreamEnd` after `setupComplete` (replaces silence hack)
- **Message format**: Keep `audio: {mimeType, data}` (confirmed correct by research)
- **No `clientContent`** mid-session (native audio model restriction)

## Research

- [researcher-01-gemini-api-protocol.md](./research/researcher-01-gemini-api-protocol.md)
- [researcher-02-codebase-gaps.md](./research/researcher-02-codebase-gaps.md)

---

## Validation Summary

**Validated:** 2026-04-09  
**Questions asked:** 7

### Confirmed Decisions

- **First-response trigger**: `audioStreamEnd` + fallback silence 32ms nếu AI không phản hồi sau 5s
- **AudioWorklet file**: Tạo `public/audio-worklet.js` mới, giữ `audio-processor.js` cũ
- **Hybrid text input**: Ngoài scope — chỉ audio+video
- **Session timeout**: Bỏ qua trong phase này
- **GeminiAudioPlayer**: Refactor epoch trick → AbortController
- **sendText()**: Thêm vào hook (chưa expose ra UI)
- **Dashboard page**: Không chủ động đụng, chỉ sửa nếu phát hiện bug liên quan

### Action Items

- [ ] Phase 01: Thêm fallback trigger (5s timeout → send 32ms PCM silence nếu AI chưa nói)
- [ ] Phase 03: GeminiAudioPlayer refactor epoch trick → AbortController
- [ ] Phase 03: Thêm `sendText()` vào hook return type (không expose UI)
- [ ] Phase 04: Bỏ hybrid text input khỏi todo list
