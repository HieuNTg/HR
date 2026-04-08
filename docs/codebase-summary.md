# HR Interview System — Codebase Summary

**Phase:** phase-05-integration-state  
**Last Updated:** April 8, 2026

## Overview

AI-powered recruitment system automating interview workflows: job analysis → candidate matching → AI interviews (text/voice) → scoring & recommendations.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│ Frontend: Next.js (interviews, dashboards)              │
├─────────────────────────────────────────────────────────┤
│ API: Next.js Routes                                     │
│   - /api/interviews/[id]/live-token (WebSocket token)  │
│   - Other interview endpoints                           │
├─────────────────────────────────────────────────────────┤
│ Services: GeminiClient (SDK: @google/genai)            │
│   - generateContent(), generateJSON(), generateEmbedding()
├─────────────────────────────────────────────────────────┤
│ Storage: Prisma ORM + Database                          │
└─────────────────────────────────────────────────────────┘
```

## Implementations (Phase 05 Complete)

**Interview State Management:** Zustand store extended with live session tracking.
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

```
1. Candidate initiates interview
   ↓
2. Frontend requests POST /api/interviews/[id]/live-token
   ↓
3. Backend returns ephemeral token + WebSocket URI
   ↓
4. Frontend loads audio-proc