# HR Interview System — Codebase Summary

**Phase:** phase-06-video-interview-redo (audio-worklet refactor, utils modularization)  
**Last Updated:** April 9, 2026 (Gemini Live audio turn tracking, WebSocket auto-reconnect, AudioContext suspend buffer)

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

## Phase 06 Audio Pipeline Refactor

**Objective:** Modularize audio/video processing into reusable utilities; upgrade AudioWorklet processor.

**Changes:**
1. **AudioWorklet Processor** (`public/audio-worklet.js`):
   - Replaced naive per-frame allocation with preallocated ring buffer (8192 samples)
   - Linear interpolation downsampling (48kHz → 16kHz) avoids quality loss
   - Emits 480-sample Float32 chunks (30ms); main thread does conversion
   - Registered as 'mic-processor' (clearer naming)

2. **Audio Utilities** (`src/lib/audio-utils.ts` — new):
   - Extracted conversion functions from scattered hook code
   - `float32ToInt16()`, `int16ToFloat32()` for PCM quantization
   - `uint8ToBase64()`, `pcmToBase64()`, `base64ToPcm()` for WebSocket encoding
   - Centralized to avoid duplication (used by `useMediaCapture`, `GeminiAudioPlayer`, `useGeminiLiveSession`)

3. **Video Utilities** (`src/lib/video-utils.ts` — new):
   - Extracted `captureFrame()` canvas logic from inline implementations
   - Canvas reuse per dimensions; JPEG quality 0.85 default
   - Returns raw base64 (Gemini Live format)

4. **Media Capture Hook** (`src/hooks/use-media-capture.ts` — updated):
   - Uses new 'mic-processor' AudioWorklet processor
   - Imports `float32ToInt16` from audio-utils
   - Imports `captureFrame` from video-utils
   - Dropped `audioSampleRate` param (now implicit 16kHz from worklet)
   - Callback signature: `onAudioChunk(pcm16: ArrayBuffer)`

5. **Gemini Audio Player** (`src/lib/gemini-live-audio-player.ts` — updated):
   - Replaced epoch-based stale detection with AbortController signal
   - Uses `int16ToFloat32()` + `base64ToPcm()` from audio-utils
   - Gapless scheduling via `Web Audio API` queue

6. **Gemini Live Session** (`src/hooks/use-gemini-live-session.ts` — updated):
   - Uses `uint8ToBase64()` for audio encoding
   - Silence packet: 128ms @ 16kHz (2048 zeros) triggers AI response
   - 5s fallback timeout post-`setupComplete`, clears when AI speaks
   - `aiHasSpokenRef` tracking for first response trigger logic
   - Audio turn tracking (`aiHasAudioThisTurnRef`) — detects silent AI turns, triggers reconnect on 3+ misses
   - WebSocket auto-reconnect: exponential backoff (1s, 2s, 4s) via `attemptGeminiReconnect()`, max 3 attempts
   - `buildSetupMsg()` extracted as DRY helper for setup/reconnect consistency
   - Human-readable WS close codes (Vietnamese UI labels)
   - `sendText()` via `realtimeInput.text`

7. **Video Interview Interface** (`src/components/interview/video-interview-interface.tsx` — updated):
   - Pre-start screen + "Bắt đầu phỏng vấn" button (user gesture requirement)
   - Status badge: connecting/active/error states
   - Error + retry UI with state reset on failure
   - Session validation: `hasTranscriptsRef` prevents empty report generation
   - `started` state reset on `handleStart()` failure

## Greeting Opener & Voice Session Flow (Phase 05 Recap)

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

### 3. Audio Worklet Processor
**File:** `public/audio-worklet.js`

- **Type:** AudioWorklet processor (registered as 'mic-processor')
- **Input:** Browser native audio (48kHz, 44kHz, or any rate via sampleRate global)
- **Processing:** Ring buffer + linear interpolation downsampling to 16kHz
- **Output:** 480-sample Float32 chunks (30ms at 16kHz), emitted to main thread via `postMessage()`
- **Design:** Preallocated ring buffer (8192 samples) avoids per-frame GC pressure in audio thread
- **Use:** Low-latency microphone capture for Gemini Live WebSocket streaming

### 4. Audio/Video Utilities & WebSocket Reconnect
**Files:** `src/lib/audio-utils.ts`, `src/lib/video-utils.ts`, `src/lib/ws-reconnect.ts`

**Audio Utilities (`audio-utils.ts`):**
- `float32ToInt16()` — converts Float32 [-1,1] to Int16 PCM ±32767 (IEEE standard)
- `int16ToFloat32()` — reverses conversion for playback
- `uint8ToBase64()` — encodes Uint8Array to base64 (chunked for large buffers)
- `pcmToBase64()` — encodes Int16 PCM buffer to base64 for WebSocket transmission
- `base64ToPcm()` — decodes base64 back to Int16 PCM

**Video Utilities (`video-utils.ts`):**
- `captureFrame()` — captures JPEG frame from video element via canvas
- Canvas reuse: created once per (width, height) pair, recreated on size change
- Defaults: 768×768 JPEG at 0.85 quality
- Returns: raw base64 (without `data:` prefix) for Gemini Live API

**WebSocket Reconnect Utility** (`ws-reconnect.ts` — new):
- `attemptGeminiReconnect()` — Handles exponential backoff + token refresh for failed WebSocket sessions
- Retry delays: 1s, 2s, 4s (configurable maxAttempts)
- Fetches fresh ephemeral token on each attempt via `/api/interviews/[id]/live-token`
- Builds new WebSocket + sends setup payload (extracted to support stateless reconnect logic)
- Cancellation support: caller can abort retry loop via `isCancelled()` check
- Extracted from hook to keep `use-gemini-live-session.ts` file size manageable

### 5. Media Capture Hook
**File:** `src/hooks/use-media-capture.ts`

- **Hook:** `useMediaCapture` — unified camera+mic capture with audio-worklet integration
- **Features:**
  - `getUserMedia()` for audio+video streams
  - AudioWorklet processor ('mic-processor') emits Float32 chunks
  - `float32ToInt16` + `captureFrame` from utils for stream conversion
  - Callbacks: `onAudioChunk(pcm16: ArrayBuffer)`, `onVideoFrame(jpegBase64: string)`
  - MediaRecorder for audio file saving
- **Exports:** `UseMediaCaptureOptions`, `CaptureStatus`, `UseMediaCaptureReturn`, `useMediaCapture`
- **Changed:** Dropped `audioSampleRate` param (now implicit 16kHz from audio-worklet)

### 6. Gemini Audio Player
**File:** `src/lib/gemini-live-audio-player.ts`

- **Class:** `GeminiAudioPlayer` — Web Audio API playback for Gemini Live responses
- **Features:**
  - Decodes base64 PCM16 chunks → Float32 using `base64ToPcm()` + `int16ToFloat32()` from audio-utils
  - 24kHz gapless playback via Web Audio API with queue-based scheduling
  - **Stale callback detection:** AbortController signals deprecated onended handlers after `clear()` call
  - **AudioContext suspend buffer:** Buffers incoming chunks during suspend state (autoplay restrictions), replays on resume via `flushSuspendBuffer()`
  - Methods: `enqueue(base64Pcm16)`, `clear()`, `close()`, `warmUp()`, `onPlayStart/End` callbacks
  - Handles continuous audio chunks streaming from Gemini Live

### 7. Gemini Live Session Hook
**File:** `src/hooks/use-gemini-live-session.ts`

- **Hook:** `useGeminiLiveSession` — WebSocket-based Gemini Live session management
- **Features:**
  - WebSocket connection + ephemeral token fetch from `/api/interviews/[id]/live-token`
  - Models supported: `gemini-3.1-flash-live-preview`
  - Send audio/video/text via `RealtimeInput` messages
  - Receive AI audio → decode + pass to GeminiAudioPlayer
  - Barge-in support (interrupt AI with new audio)
  - **First Response Trigger:** Sends 128ms PCM silence (2048 zeros @ 16kHz) post-`setupComplete` + 5s fallback timeout
    - Clears timeout when AI starts speaking or session closes
    - Uses `uint8ToBase64()` for base64 encoding
  - **Audio Turn Tracking** (`aiHasAudioThisTurnRef`): Detects when AI turn completes with 0 audio bytes (missed response)
    - Threshold: 3+ consecutive missed turns triggers automatic WebSocket reconnection
    - Prevents UI hang on silent/incomplete Gemini responses
  - **WebSocket Auto-Reconnect** (via `attemptGeminiReconnect()`):
    - Exponential backoff delays: 1s, 2s, 4s
    - Max 3 reconnection attempts per session
    - Fetches fresh ephemeral token on each attempt
    - Tracks `reconnectAttemptsRef` to enforce limit
  - **Setup Message DRY:** `buildSetupMsg()` extracted helper for consistent setup payload on initial connect + reconnect
  - **AI Speaking Detection:** `aiHasSpokenRef` tracks whether AI has emitted audio
  - **WS Close Codes:** Human-readable Vietnamese labels for close events (1006/1007/1011 mapped to user messages)
  - **Integration:** Pairs with `useMediaCapture` for bidirectional streams
  - **Methods:** `connect()`, `disconnect()`, `sendAudio()`, `sendVideo()`, `sendText()`, `warmUpAudio()`

### 8. Video Interview Interface Component
**File:** `src/components/interview/video-interview-interface.tsx`

- **Component:** `VideoInterviewInterface` — Main video interview UI with controls
- **Features:**
  - Composes `useMediaCapture` + `useGeminiLiveSession` hooks
  - Pre-start screen with "Bắt đầu phỏng vấn" button (satisfies Chrome AudioContext autoplay policy)
  - Camera preview + video frame streaming
  - AI avatar panel (`VideoAvatarPanel`) for interviewee responses
  - Real-time transcript sidebar
  - Mic/camera toggle controls with status badges
  - Status indicator: connecting/active/error/closed states
  - Error display + retry button on connection failure
  - Session validation: `onSessionEnd()` only fires if interview has transcripts (prevents empty reports)
  - `handleStart()`: warmUp audio, connect session, start media capture (error → `started = false`)
  - `handleRetry()`: reconnect with existing/new media stream
  - Permission denied fallback: `onFallbackToText()` callback to parent

### 9. Video Avatar Panel Component
**File:** `src/components/interview/video-avatar-panel.tsx`

- **Component:** `VideoAvatarPanel` — AI avatar display with real-time lip-sync
- **Props:** `isAiSpeakingLive?: boolean` — when true, drives lip-sync from Gemini Live audio directly
- **Purpose:** Synchronized avatar animation with native Gemini audio (lower latency than post-TTS synthesis)
- **Behavior:** Bypasses TTS lip-sync when live audio is streaming

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
