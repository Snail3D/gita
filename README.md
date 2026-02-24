# GITA (Ghost In The Assistant)

A dockerized service that accepts a text command and triggers nearby voice assistants by speaking their wake phrase + the command through host speakers.

## Disclaimer & Reliability Limits
**Important Note:** This service controls assistants via audible wake-word playback. Its reliability depends entirely on microphone/speaker placement, hardware volume, device settings, and background noise. It cannot bypass platform restrictions or directly issue silent digital commands to external assistant APIs unless they have their own native integrations. It is a physical "hack" requiring clear line-of-sight audio to the target assistant device.

## Prerequisites
- Node.js (for local running) or Docker/Docker Compose
- Groq API Key (for Orpheus TTS)
- FFmpeg/ffplay installed on the host (if running locally and using `ENABLE_PLAYBACK=true`)

## Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update your `.env` with your `GROQ_API_KEY`.

## Running the Service

### Using Docker Compose
```bash
docker-compose up --build -d
```
*Note on Docker Audio:* Playing audio directly to host speakers from a Docker container can be complex depending on the OS (e.g., macOS Docker Desktop doesn't easily share host audio without custom ALSA/PulseAudio setups). If you need direct speaker playback, running the service locally (Node.js) is recommended.

### Running Locally (Node.js)
```bash
npm install
npm start
```

## API Endpoint

### `POST /trigger`

**Payload:**
```json
{
  "assistant": "alexa",
  "command": "turn on the living room lights",
  "voice": "troy",
  "speed": 1.0,
  "wakePhrase": "Computer" // Optional, required only if assistant="custom"
}
```

**Supported Assistants:**
- `alexa` (Alexa, ...)
- `google` (Hey Google, ...)
- `siri` (Hey Siri, ...)
- `custom` (Uses `wakePhrase` from request)

**Example cURL:**
```bash
curl -X POST http://localhost:3000/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "assistant": "alexa",
    "command": "what time is it?"
  }'
```

## How It Works
1. Receives the POST payload.
2. Constructs the wake-word phrase.
3. Calls Groq Orpheus TTS (`canopylabs/orpheus-v1-english`) to generate an MP3 audio file.
4. Saves the MP3 in `data/out/`.
5. Plays the audio file using `ffplay` if `ENABLE_PLAYBACK=true`.
