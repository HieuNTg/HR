# Gemini 3.1 Flash Live API Protocol Research

**Date:** 2026-04-09  
**Model:** gemini-3.1-flash-live-preview  
**Focus:** WebSocket protocol, audio pipeline, native audio restrictions

---

## 1. RealtimeInput Message Format

### Current Code Issue
```typescript
// WRONG (current implementation)
realtimeInput: {
  audio: { mimeType: "audio/pcm;rate=16000", data: arrayBufferToBase64(pcm16) },
  video: { mimeType: "image/jpeg", data: jpegBase64 },
}
```

### Correct Format (Official API)
```json
{
  "realtimeInput": {
    "audio": {
      "mimeType": "audio/pcm;rate=16000",
      "data": "<base64_encoded_pcm_data>"
    }
  }
}
```

**Status:** Current code structure is CORRECT. The API supports direct `audio` and `video` fields (not `mediaChunks`).  
**Note:** The plan doc shows deprecated `mediaChunks` format. Official docs confirm `audio`/`video`/`text` fields are the standard.

---

## 2. Audio Pipeline Specifications

### Input Requirements (Gemini 3.1)
- **Format:** PCM 16-bit signed, little-endian
- **Sample Rate:** 16kHz (native, no resampling needed in transit)
- **Encoding:** Base64 when sent over WebSocket
- **Channel:** Mono (single channel)

### Output Requirements
- **Format:** PCM 16-bit signed, little-endian
- **Sample Rate:** 24kHz (NOT 16kHz)
- **Parsing:** Decode from `serverContent.modelTurn.parts[].inlineData.data`

### Resampling (Browser → API)
- Browser `AudioContext` operates at 48kHz or 44.1kHz
- Must resample to 16kHz before sending
- Linear interpolation acceptable (reference code uses this)
- Current hook: resampling omitted in `sendAudio()` — **POTENTIAL BUG**

---

## 3. ClientContent Limitations (Critical)

### The Problem
`clientContent` messages are **restricted to initial history seeding only**. Sending them mid-conversation causes **WebSocket 1007 error** (Invalid Argument).

### When It Works
```json
{
  "clientContent": {
    "turns": [
      {
        "role": "user",
        "parts": [{ "text": "Initial context..." }]
      }
    ]
  }
}
```
Only during initial connection setup before first `setupComplete`.

### When It Fails
After `setupComplete`, `clientContent` triggers 1007 close. For text input mid-conversation, **must use `realtimeInput.text`** instead:
```json
{
  "realtimeInput": {
    "text": { "text": "User message..." }
  }
}
```

### Current Code
The hook never sends `clientContent` during live sessions — **CORRECT**. System instruction passed in setup only.

---

## 4. Voice Activity Detection (VAD)

### Default Behavior
- **Enabled by default** via automatic VAD
- Model detects speech boundaries automatically
- Responds when silence duration threshold exceeded

### Configuration (Optional)
```typescript
realtimeInputConfig: {
  automaticActivityDetection: true,
  speechStartThresholdMs: 100,  // Adjust if needed
  silenceDurationMs: 100,        // Trigger response after 100ms silence
  prefixPaddingMs: 20            // Capture early speech onset
}
```

### First Response Trigger (No Silence Hack Needed)
- **VAD listens automatically** to audio stream
- When user speaks → silence → responds
- **Alternative:** Send empty `audioStreamEnd` event to force flush:
```json
{ "realtimeInput": { "audioStreamEnd": {} } }
```

This is **cleaner than silence packets** — explicitly signals end of user input.

---

## 5. Native Audio Model Constraints

### Supported Features
- Audio input/output (A2A native, not STT→LLM→TTS)
- Voice customization (prebuiltVoiceConfig)
- Affective dialogue (emotion detection in tone)
- Multimodal (audio + video + text concurrent)

### NOT Supported
- **`responseModalities: ["TEXT"]`** alone → causes 1007 error
- **`clientContent` after setup** → 1007 error
- Async function calling (sync only)
- Batch API, caching, code execution

### Setup Must Include Audio
```typescript
generationConfig: {
  responseModalities: ["AUDIO"],  // Always include AUDIO
  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
}
```

---

## 6. Transcription Fields

### Output Transcription
```json
{
  "outputTranscription": {
    "text": "What are the main reasons..."
  }
}
```
AI's spoken words. Located at **message top level** (not nested in `serverContent`).

### Input Transcription
```json
{
  "inputTranscription": {
    "text": "I want to know the reasons..."
  }
}
```
User's spoken words. Also at **message top level**.

### Current Code
Correctly extracts both at top level (line 156-161 in hook).

---

## 7. Turn Completion & Barge-In

### Turn Complete Signal
```json
{
  "serverContent": {
    "turnComplete": true
  }
}
```
Indicates AI finished all response parts for this turn.

### Barge-In Implementation
When user sends audio while AI is speaking:
1. Clear AI audio queue (`player.clear()`)
2. Send audio (interrupts playback)
3. AI responds to new user input

Current code implements barge-in correctly (line 213-214).

---

## Known Issues & Solutions

| Issue | Current Code | Fix |
|-------|--------------|-----|
| **Resampling missing** | `sendAudio()` doesn't resample 48→16kHz | Add resample before conversion to Int16 |
| **Silence hack** | Not present (good) | Use `audioStreamEnd` if needed, VAD works by default |
| **ClientContent** | Never sent mid-session (correct) | Keep as-is, use `realtimeInput.text` for text |
| **Audio output rate** | Correctly reads 24kHz from server | No change needed |

---

## Unresolved Questions

1. **Exact resampling approach:** Are AudioWorklet resampling ratios (from plan) compatible with current timestamp-based architecture?
2. **Video frame rate:** Max 1/sec confirmed, but is JPEG quality (0.6-0.7) hardcoded or configurable?
3. **Session timeout:** Docs say 15min audio-only, 2min with video—how does reconnect work?
