# GITA (Ghost In The Assistant)

<p align="center">
  <img src="assets/gita-logo.svg" alt="GITA logo" width="220" />
</p>

**GITA** is a tiny Docker-ready service that turns text into wake-word commands for voice assistants.

It works standalone, and is also deeply integrated with the **OpenClaw ecosystem**.

**TealClaw is optional, but highly awesome when paired.**

- TealClaw repo: https://github.com/Snail3D/tealclaw
- GITA repo: https://github.com/Snail3D/gita

## What it does

You send a command like:
- `assistant=siri, command="open messages"`

GITA will:
1. Generate a wake phrase clip (e.g. `Hey Siri`)
2. Wait a short delay (default 2500ms)
3. Generate/play the command clip (e.g. `open messages`)

This significantly improves wake-word hit rate vs speaking everything in one clip.

---

## Quick start

```bash
cd /Users/ericwoodard/Desktop/programs/gita
cp .env.example .env
# add your GROQ_API_KEY in .env
npm install
npm start
```

Service runs on `http://localhost:3000`.

---

## `.env` example

```env
GROQ_API_KEY=your_key_here
ENABLE_PLAYBACK=true
DEFAULT_VOICE=troy
DEFAULT_SPEED=0.9
WAKE_DELAY_MS=2500
PORT=3000
```

---

## API

### `POST /trigger`

Payload:

```json
{
  "assistant": "alexa",
  "command": "play the audio bible on Audible",
  "voice": "troy",
  "speed": 0.9,
  "wakeDelayMs": 2500,
  "wakePhrase": "Computer"
}
```

- `assistant`: `alexa | google | siri | custom`
- `wakePhrase`: required only when `assistant=custom`

### Example: Siri

```bash
curl -X POST http://localhost:3000/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "assistant":"siri",
    "command":"open messages",
    "speed":0.9,
    "wakeDelayMs":2800
  }'
```

### Example: Alexa

```bash
curl -X POST http://localhost:3000/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "assistant":"alexa",
    "command":"play the audio bible on Audible",
    "speed":0.9,
    "wakeDelayMs":2500
  }'
```

---

## OpenClaw / TealClaw integration

GITA can run by itself (curl/API/automation scripts) and does **not** require TealClaw.

If you do use TealClaw, it's highly integrated:
- use the **`/gita`** command
- trigger from cron/schedules
- route remote requests through your OpenClaw setup

Typical TealClaw flow:
1. TealClaw command (`/gita ...`)
2. POST to GITA endpoint
3. GITA plays wake + command audio on host speakers

---

## Docker

```bash
docker-compose up --build -d
```

> Note: host speaker playback from Docker can be tricky on macOS Docker Desktop.
> For reliable local speaker playback, run with Node on host.

---

## Important limitations

This is an **audio-trigger hack** (not direct Siri/Alexa API control).

Reliability depends on:
- speaker volume
- mic distance/angle
- room noise
- device assistant settings

It cannot bypass platform restrictions with silent/private APIs.
