import express from 'express';
import dotenv from 'dotenv';
import { generateTTS } from './tts.js';
import { playAudio, setSystemVolume, sleep } from './playback.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/trigger', async (req, res) => {
  try {
    const { assistant, command, voice, speed, wakePhrase, wakeDelayMs, prePauseMs, preVolume } = req.body;

    if (!assistant || !command) {
      return res.status(400).json({ error: "Missing 'assistant' or 'command' in request body." });
    }

    const effectiveSpeed = Number(speed ?? process.env.DEFAULT_SPEED ?? 0.9);
    const effectiveWakeDelayMs = Number(wakeDelayMs ?? process.env.WAKE_DELAY_MS ?? 2500);

    let wake = "";
    switch (assistant.toLowerCase()) {
      case 'alexa':
        wake = 'Alexa';
        break;
      case 'google':
        wake = 'Hey Google';
        break;
      case 'siri':
        wake = 'Hey Siri';
        break;
      case 'custom':
        if (!wakePhrase) {
          return res.status(400).json({ error: "Missing 'wakePhrase' for custom assistant." });
        }
        wake = wakePhrase;
        break;
      default:
        return res.status(400).json({ error: "Invalid assistant. Supported: alexa, google, siri, custom." });
    }

    const effectivePrePauseMs = Number(prePauseMs ?? process.env.PRE_PAUSE_MS ?? 0);
    const effectivePreVolume = (preVolume ?? process.env.PRE_VOLUME) !== undefined ? Number(preVolume ?? process.env.PRE_VOLUME) : null;

    if (effectivePrePauseMs > 0) {
      await sleep(effectivePrePauseMs);
    }
    let volumeAdjusted=false;
    if (effectivePreVolume !== null && !Number.isNaN(effectivePreVolume)) {
      volumeAdjusted = await setSystemVolume(effectivePreVolume);
    }

    console.log(`Generating wake TTS for: "${wake}" @${effectiveSpeed}x`);
    const wakeAudioPath = await generateTTS(wake, voice, effectiveSpeed);

    console.log(`Generating command TTS for: "${command}" @${effectiveSpeed}x`);
    const commandAudioPath = await generateTTS(command, voice, effectiveSpeed);

    const playedWake = await playAudio(wakeAudioPath);
    if (playedWake && effectiveWakeDelayMs > 0) {
      await new Promise(r => setTimeout(r, effectiveWakeDelayMs));
    }
    const playedCommand = await playAudio(commandAudioPath);

    res.json({
      success: true,
      wake,
      command,
      phrase: `${wake}, ${command}`,
      wakeAudioPath,
      commandAudioPath,
      played: playedWake || playedCommand,
      playedWake,
      playedCommand,
      wakeDelayMs: effectiveWakeDelayMs,
      speed: effectiveSpeed,
      prePauseMs: effectivePrePauseMs,
      preVolume: effectivePreVolume,
      volumeAdjusted
    });

  } catch (error) {
    console.error("Error processing /trigger:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`GITA (Ghost In The Assistant) service listening on port ${PORT}`);
});
