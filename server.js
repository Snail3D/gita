import express from 'express';
import dotenv from 'dotenv';
import { generateTTS } from './tts.js';
import { playAudio, setSystemVolume, sleep } from './playback.js';
import { captureAndTranscribe } from './stt.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const duplexState = {
  active: false,
  id: null,
  startedAt: null,
  turnsCompleted: 0,
  lastHeard: '',
  mode: null,
  config: null,
};

function resolveWake({ assistant, wakePhrase }) {
  const id = String(assistant || '').toLowerCase();
  if (id === 'alexa') return 'Alexa';
  if (id === 'google') return 'Hey Google';
  if (id === 'siri') return 'Hey Siri';
  if (id === 'custom') return String(wakePhrase || '').trim();
  return '';
}

async function speakText(text, { voice, speed } = {}) {
  const audioPath = await generateTTS(text, voice, speed);
  const played = await playAudio(audioPath);
  return { text, audioPath, played };
}

async function runTrigger(payload) {
  const {
    assistant,
    command,
    voice,
    speed,
    wakePhrase,
    wakeDelayMs,
    prePauseMs,
    preVolume,
  } = payload;

  if (!assistant || !command) {
    throw new Error("Missing 'assistant' or 'command' in request body.");
  }

  const wake = resolveWake({ assistant, wakePhrase });
  if (String(assistant).toLowerCase() === 'custom' && !wake) {
    throw new Error("Missing 'wakePhrase' for custom assistant.");
  }
  if (!['alexa', 'google', 'siri', 'custom'].includes(String(assistant).toLowerCase())) {
    throw new Error('Invalid assistant. Supported: alexa, google, siri, custom.');
  }

  const effectiveSpeed = Number(speed ?? process.env.DEFAULT_SPEED ?? 0.9);
  const effectiveWakeDelayMs = Number(wakeDelayMs ?? process.env.WAKE_DELAY_MS ?? 2500);
  const effectivePrePauseMs = Number(prePauseMs ?? process.env.PRE_PAUSE_MS ?? 0);
  const effectivePreVolume =
    (preVolume ?? process.env.PRE_VOLUME) !== undefined
      ? Number(preVolume ?? process.env.PRE_VOLUME)
      : null;

  if (effectivePrePauseMs > 0) await sleep(effectivePrePauseMs);

  let volumeAdjusted = false;
  if (effectivePreVolume !== null && !Number.isNaN(effectivePreVolume)) {
    volumeAdjusted = await setSystemVolume(effectivePreVolume);
  }

  let wakeAudioPath = null;
  let playedWake = false;

  if (wake) {
    console.log(`Generating wake TTS for: "${wake}" @${effectiveSpeed}x`);
    wakeAudioPath = await generateTTS(wake, voice, effectiveSpeed);
    playedWake = await playAudio(wakeAudioPath);
    if (playedWake && effectiveWakeDelayMs > 0) await sleep(effectiveWakeDelayMs);
  }

  console.log(`Generating command TTS for: "${command}" @${effectiveSpeed}x`);
  const commandAudioPath = await generateTTS(command, voice, effectiveSpeed);
  const playedCommand = await playAudio(commandAudioPath);

  return {
    success: true,
    wake,
    command,
    phrase: wake ? `${wake}, ${command}` : command,
    wakeAudioPath,
    commandAudioPath,
    played: playedWake || playedCommand,
    playedWake,
    playedCommand,
    wakeDelayMs: effectiveWakeDelayMs,
    speed: effectiveSpeed,
    prePauseMs: effectivePrePauseMs,
    preVolume: effectivePreVolume,
    volumeAdjusted,
  };
}

async function runFlow(flow = []) {
  const results = [];
  for (const step of flow) {
    const op = String(step?.op || '').toLowerCase();
    if (op === 'wait') {
      const ms = Math.max(0, Number(step.ms) || 0);
      await sleep(ms);
      results.push({ op, ok: true, ms });
      continue;
    }
    if (op === 'speak') {
      const text = String(step.text || '').trim();
      if (!text) throw new Error('flow speak step missing text');
      const out = await speakText(text, { voice: step.voice, speed: step.speed });
      results.push({ op, ok: true, text: out.text, played: out.played });
      continue;
    }
    if (op === 'trigger') {
      const out = await runTrigger(step);
      results.push({ op, ok: true, phrase: out.phrase, played: out.played });
      continue;
    }
    throw new Error(`Unknown flow op: ${op}`);
  }
  return results;
}

async function duplexLoop(sessionId, cfg) {
  const {
    mode = 'voice-control',
    assistant = 'custom',
    wakePhrase = '',
    turnSeconds = 5,
    turnGapMs = 700,
    maxTurns = 100,
    speed,
    voice,
  } = cfg;

  duplexState.active = true;
  duplexState.id = sessionId;
  duplexState.startedAt = Date.now();
  duplexState.turnsCompleted = 0;
  duplexState.lastHeard = '';
  duplexState.mode = mode;
  duplexState.config = { mode, assistant, wakePhrase, turnSeconds, turnGapMs, maxTurns };

  while (duplexState.active && duplexState.id === sessionId && duplexState.turnsCompleted < maxTurns) {
    let heard = '';
    try {
      const out = await captureAndTranscribe({ seconds: turnSeconds, language: 'en' });
      heard = String(out.text || '').trim();
    } catch (err) {
      console.warn('[duplex] capture/transcribe error:', err.message);
      await sleep(turnGapMs);
      continue;
    }

    if (!heard) {
      await sleep(turnGapMs);
      continue;
    }

    duplexState.lastHeard = heard;

    const lower = heard.toLowerCase();
    if (['stop duplex', 'duplex stop', 'stop listening', 'cancel duplex'].some(s => lower.includes(s))) {
      duplexState.active = false;
      break;
    }

    try {
      if (mode === 'voice-control') {
        await speakText(heard, { speed: Number(speed ?? 1.18), voice });
      } else {
        await runTrigger({
          assistant,
          wakePhrase,
          command: heard,
          speed: Number(speed ?? process.env.DEFAULT_SPEED ?? 0.9),
        });
      }
    } catch (err) {
      console.warn('[duplex] play/trigger error:', err.message);
    }

    duplexState.turnsCompleted += 1;
    await sleep(turnGapMs);
  }

  duplexState.active = false;
}

app.post('/trigger', async (req, res) => {
  try {
    const out = await runTrigger(req.body || {});
    res.json(out);
  } catch (error) {
    console.error('Error processing /trigger:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/flow/run', async (req, res) => {
  try {
    const flow = Array.isArray(req.body?.flow) ? req.body.flow : [];
    if (!flow.length) return res.status(400).json({ error: "Missing non-empty 'flow' array" });
    const results = await runFlow(flow);
    res.json({ success: true, steps: results.length, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/duplex/start', async (req, res) => {
  try {
    if (duplexState.active) {
      return res.status(409).json({ error: 'Duplex session already active', duplex: duplexState });
    }
    const sessionId = `dpx_${Date.now()}`;
    duplexLoop(sessionId, req.body || {}).catch(err => {
      console.error('[duplex] fatal:', err.message);
      duplexState.active = false;
    });
    res.json({ success: true, started: true, id: sessionId, duplex: { ...duplexState, active: true } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/duplex/stop', async (_req, res) => {
  duplexState.active = false;
  res.json({ success: true, stopped: true });
});

app.get('/duplex/status', async (_req, res) => {
  res.json({ success: true, duplex: duplexState });
});

app.listen(PORT, () => {
  console.log(`GITA (Ghost In The Assistant) service listening on port ${PORT}`);
});
