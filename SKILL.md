---
name: gita
description: Trigger nearby voice assistants (Siri, Alexa, Google, or custom wake phrase) by generating and playing wake-word + command audio via Groq Orpheus, and run Android device manipulation actions over ADB. Use when the user asks to control assistants through audible playback, test wake phrase reliability, automate assistant triggers from OpenClaw/TealClaw commands and cron jobs, or send tap/type/swipe/keyevent actions to Android devices.
---

# GITA (Ghost In The Assistant)

Use GITA to speak assistant wake phrase + command through host speakers.

## Run service

```bash
cd /Users/ericwoodard/Desktop/programs/gita
cp .env.example .env
# set GROQ_API_KEY
npm install
npm start
```

Default endpoint: `http://localhost:3000`

## Trigger command

`POST /trigger`

Payload fields:
- `assistant`: `siri|alexa|google|custom`
- `command`: text to speak after wake phrase
- `voice` (optional): Orpheus voice (default `troy`)
- `speed` (optional): speech speed (default `0.9`)
- `wakeDelayMs` (optional): delay between wake and command (default `2500`)
- `wakePhrase` (required for `custom`)

## Examples

### Siri
```bash
curl -X POST http://localhost:3000/trigger \
  -H "Content-Type: application/json" \
  -d '{"assistant":"siri","command":"open messages","speed":0.9,"wakeDelayMs":2800}'
```

### Alexa
```bash
curl -X POST http://localhost:3000/trigger \
  -H "Content-Type: application/json" \
  -d '{"assistant":"alexa","command":"play the audio bible on Audible"}'
```

## Android actions (ADB)

Endpoint: `POST /android/action`

Payload:
- `action`: `devices|shell|tap|swipe|type|keyevent|open-url|launch-app`
- `deviceId` (optional): explicit adb device id for multi-device setups
- action-specific fields (`x/y`, `text`, `key`, etc.)

Examples:

```bash
curl -X POST http://localhost:3000/android/action \
  -H "Content-Type: application/json" \
  -d '{"action":"devices"}'

curl -X POST http://localhost:3000/android/action \
  -H "Content-Type: application/json" \
  -d '{"action":"tap","x":540,"y":1700}'
```

## Notes

- This is audio-trigger based, not direct assistant API control.
- Reliability depends on volume, mic distance, room noise, and assistant device settings.
- Android actions require `adb` installed and an authorized device attached.
- Designed to integrate with TealClaw `/gita` command flows and cron actions.
