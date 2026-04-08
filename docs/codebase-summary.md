# HR Interview System — Codebase Summary

**Phase:** phase-05-integration-state (greeting-opener-fix)  
**Last Updated:** April 8, 2026 (greeting & voice session UX improvements)

## Overview

AI-powered recruitment system automating interview workflows: job analysis → candidate matching → AI interviews (text/voice) → scoring & recommendations.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│ Frontend: Next.js (interviews, dashboards)              │
├─────────────────────────────────────────────────────────┤
│ API: Next.js Routes                                     │
│   - /api/interviews/[id]/live-token (WebSocket token)  │
│   - /api/interviews/[id]/chat (AI chat)                │
│   - /api/interviews/[id]/report (report generation)    │
│   - /api/interviews/[id]/save-live-results (results)   │
│   - /api/interviews/[id]/start (interview init)        │
├─────────────────────────────────────────────────────────┤
│ Services: GeminiClient (SDK: @google/genai)            │
│   - generateContent(), generateJSON(), generateEmbedding()
├─────────────────────────────────────────────────────────┤
│ Instrumentation: Error suppression (process.emit)      │
│   - Suppress ECONNRESET / ABORT_ERR from client drops  │
├─────────────────────────────────────────────────────────┤
│ Storage: Prisma ORM + Database                          │
└─────────────────────────────────────────────────────────┘
```

## Error Suppression (ECONNRESET Fix)

**File:** `src/instrumentation.ts`

- **Strategy:** Monkey-patch `process.emit()` at Next.js startup to intercept `uncaughtException` events.
- **Suppressed errors:** `ECONNRESET`, `ABORT_ERR`, `ERR_STREAM_PREMATURE_CLOSE`, "aborted"
- **Purpose:** Browser/client disconnections (TCP close mid-request) are harmless socket errors; suppress before Next.js listeners see them.
- **Common triggers:** React StrictMode remount, tab close, navigation during fetch
- **Logging:** Debug-level console.debug() for tracing
- **Benefit:** Prevents false crash logs and improves signal-to-noise in error monitoring

## Implementations (Phase 05 Complete)

**Interview State Management:** Zustand store with abort control & live session tracking.
- `_abortController`: Nulled after successful response to prevent re-entry abort (safe null check via `?.abort()`)
- `interviewMode`: 'TEXT' | 'VOICE' | 'HYBRID'
- `liveSessionStatus`: 'idle' | 'connecting' | 'active' | 'error' | 'closed'
- `isAiSpeaking`, `mediaPermission` state fields
- Actions: `setInterviewMode()`, `setLiveSessionStatus()`, `setAiSpeaking()`, `addLiveTranscript()`, `saveLiveResults()`

**Video Interview Integration:** Interview page conditionally renders `VideoInterviewInterface` vs `ChatInterface` based on mode.
- Mode toggle in header enables video/text switching
- System instruction builder formats 5-question flow for natural AI interviewing
- Callbacks propagate transcripts to store for real-time visibility

**Live Results Persistence:** New API endpoint `/api/interviews/[id]/save-live-results` (POST).
- Extracts Q&A pairs from streaming transcript
- Evaluates each answer using existing evaluation service
- Persists results to DB: answerText, durationSeconds, AnswerEvaluation records
- Returns evaluation payload for report generation

## Greeting Opener & Voice Session Flow (Phase 05 Update)

**Interview Initialization:** AI greeting + first question now combined into single message.
- **Text Mode:** Greeting + Q1 sent immediately when `startInterview()` is called. Skips dedicated "greeting" step, interview state goes straight to "questioning". User input enabled right away.
- **Voice Mode:** After WebSocket `setupComplete`, sends 1 second PCM silence packet (16kHz, 32000 bytes zeros) via RealtimeInput to trigger Gemini's first spoken response. Timeout: 8 seconds with retry. Timeout clears on disconnect or when AI starts speaking.

**Files Modified:**
1. `src/stores/interview-store.ts` — `startInterview()` combines greeting + Q1 into single AI message. `advanceFromGreeting()` kept but is dead code for text mode.
2. `src/app/(dashboard)/interviews/[id]/page.tsx` — Removed `advanceFromGreeting()` call from `handleSpeakEnd`. TTS is now cosmetic only, not a progression gate.
3. `src/hooks/use-gemini-live-session.ts` — Sends silence packet post-`setupComplete` to trigger Gemini's first response. Implements 8s timeout with retry logic.
4. `src/components/interview/video-interview-interface.tsx` — Empty transcript state shows "Đang chờ AI phản hồi..." when session is active (improved UX).

**Impact:** Both text and voice modes now deliver seamless greeting + first question experience, reducing perceived latency in voice interviews.

## Key Components

### 1. Gemini SDK Client
**File:** `src/lib/gemini.ts`

- **SDK:** `@google/genai` (GoogleGenAI class)
- **Models:** `gemini-3.1-flash-lite-preview`, `gemini-3.1-flash-lite-preview-lite`
- **Methods:**
  - `generateContent(prompt, options)` → string
  - `generateJSON<T>(prompt, options)` → T (with fallback JSON parsing)
  - `generateEmbedding(text)` → number[] (model: `text-embedding-004`)
- **Options:** temperature, maxOutputTokens, responseMimeType

### 2. Live Interview WebSocket Endpoint
**File:** `src/app/api/interviews/[id]/live-token/route.ts`

- **Endpoint:** `POST /api/interviews/[id]/live-token`
- **Returns:** `{ token, wsUri, expiresAt }`
- **WebSocket URI:** `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`
- **Gemini Live Model:** `gemini-2.5-flash-native-audio-preview-12-2025`
- **Token Source (Priority):**
  1. Ephemeral token via v1alpha authTokens API (production)
  2. Direct API key fallback (dev only)
- **Token TTL:** 30 minutes
- **Constraints:** Single-use (uses: 1)

### 3. Audio Capture
**File:** `public/audio-processor.js`

- **Type:** AudioWorklet processor (pcm-processor)
- **Functionality:** Real-time Float32 → Int16 PCM conversion
- **Output:** Quantizes to ±32767 range, posts to main thread as Int16Array buffer
- **Use:** Browser microphone capture for WebSocket streaming

### 4. Media Capture Hook
**File:** `src/hooks/use-media-capture.ts`

- **Hook:** `useMediaCapture` — unified camera+mic capture
- **Features:**
  - `getUserMedia()` for audio+video streams
  - AudioWorklet PCM16 streaming at 16kHz
  - Canvas JPEG capture at 1 FPS (768x768)
  - MediaRecorder for audio file saving
- **Exports:** `UseMediaCaptureOptions`, `CaptureStatus`, `UseMediaCaptureReturn`, `useMediaCapture`

### 5. Gemini Audio Player
**File:** `src/lib/gemini-live-audio-player.ts`

- **Class:** `GeminiAudioPlayer` — Web Audio API playback
- **Features:**
  - PCM16 24kHz gapless playback via AudioContext
  - Epoch-based barge-in detection
  - Methods: `enqueue(buffer)`, `clear()`, `close()`
  - Handles audio chunks streaming from Gemini Live

### 6. Gemini Live Session Hook
**File:** `src/hooks/use-gemini-live-session.ts`

- **Hook:** `useGeminiLiveSession` — WebSocket-based Gemini Live session
- **Features:**
  - WebSocket connection to Gemini Live API
  - Ephemeral token fetch & auth
  - Send audio/video frames as RealtimeInput messages
  - Receive AI audio → pass to GeminiAudioPlayer
  - Barge-in support (interrupt AI)
  - **New:** Silence packet trigger (1s PCM silence @ 16kHz, 32000 bytes) post-`setupComplete` to initiate Gemini's first spoken response
    - 8s retry timeout; clears on disconnect or when AI speaks
- **Integration:** Works with `useMediaCapture` for media input

### 7. Video Interview Interface Component
**File:** `src/components/interview/video-interview-interface.tsx`

- **Component:** `VideoInterviewInterface` — Main video interview UI
- **Features:**
  - Composes `useMediaCapture` + `useGeminiLiveSession` hooks
  - Camera preview with video frame display
  - AI avatar panel for interviewee responses
  - Transcript sidebar showing interview conversation
  - Mic/camera controls (toggle on/off)
  - Permission denied fallback to text mode
- **Replaces:** `chat-interface` for video/audio interviews

### 8. Video Avatar Panel Component
**File:** `src/components/interview/video-avatar-panel.tsx`

- **Component:** `VideoAvatarPanel` — AI avatar display & lip-sync
- **Updates:** Added `isAiSpeakingLive?: boolean` prop
- **Purpose:** When true, bypasses TTS and drives avatar lip-sync directly from real Gemini Live audio signal
- **Benefit:** Synchronized lip movement with native Gemini audio output (lower latency than post-synthesis TTS)

## Data Flow: AI Interview Session

**Text Mode:**
```
1. Candidate initiates interview
   ↓
2. startInterview() generates greeting + Q1 (combined message)
   ↓
3. AI message appended to interview state
   ↓
4. Interview step → "questioning" (no dedicated "greeting" step)
   ↓
5. Chat input enabled; candidate responds
   ↓
6. Candidate answer → evaluation → next question
```

**Voice Mode:**
```
1. Candidate initiates interview
   ↓
2. Frontend requests POST /api/interviews/[id]/live-token
   ↓
3. Backend returns ephemeral token + WebSocket URI
   ↓
4. WebSocket connection + setupComplete
   ↓
5. Client sends 1s silence packet (16kHz, 32000 bytes) to trigger AI response
   ↓
6. Gemini speaks greeting + Q1
   ↓
7. Candidate answers via live audio stream
   ↓
8. Mic capture → Int16 PCM chunks → WebSocket to Gemini Live
   ↓
9. Gemini evaluates & continues questioning
   ↓
10. Results → Database via API
```

## Dependencies (phase-01-deps-token)

- **@google/genai:** Gemini SDK (replaced @google/generative-ai)
- **next.js:** Full-stack framework
- **prisma:** Database ORM
- **typescript:** Type safety

## Security Notes

- Ephemeral tokens: v1alpha API, short-lived (30min), single-use
- Production: Never falls back to API key (fails with 503)
- Dev: API key fallback for testing without token service
- WebSocket: Candidate credentials isolated per token

## Configuration

**Environment Variables:**
- `GEMINI_API_KEY` — Required for SDK initialization
- `NODE_ENV` — Controls ephemeral token fallback behavior

## Next Steps (Post-Phase-05)

- Holistic evaluation: Replace per-question eval with transcript-wide assessment (4 dimensions: communication, reasoning, technical, culture fit)
- MediaRecorder parallel track: Record WebM/OGG alongside PCM16 stream for local `uploads/` storage
- Enhanced system instruction: AI evaluates CV consistency, communication style, culture fit during interview
- Dashboard: Multi-candidate scoring & comparison with video/text mode metrics
- Session monitoring: Track Gemini Live API usage and session duration limits
