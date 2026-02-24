import express from 'express';
import dotenv from 'dotenv';
import { generateTTS } from './tts.js';
import { playAudio } from './playback.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/trigger', async (req, res) => {
  try {
    const { assistant, command, voice, speed, wakePhrase } = req.body;

    if (!assistant || !command) {
      return res.status(400).json({ error: "Missing 'assistant' or 'command' in request body." });
    }

    let phrase = "";
    switch (assistant.toLowerCase()) {
      case 'alexa':
        phrase = `Alexa, ${command}`;
        break;
      case 'google':
        phrase = `Hey Google, ${command}`;
        break;
      case 'siri':
        phrase = `Hey Siri, ${command}`;
        break;
      case 'custom':
        if (!wakePhrase) {
          return res.status(400).json({ error: "Missing 'wakePhrase' for custom assistant." });
        }
        phrase = `${wakePhrase}, ${command}`;
        break;
      default:
        return res.status(400).json({ error: "Invalid assistant. Supported: alexa, google, siri, custom." });
    }

    console.log(`Generating TTS for: "${phrase}"`);
    
    // Generate audio
    const audioPath = await generateTTS(phrase, voice, speed);
    
    // Play audio
    const played = await playAudio(audioPath);

    res.json({
      success: true,
      phrase,
      audioPath,
      played
    });

  } catch (error) {
    console.error("Error processing /trigger:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`GITA (Ghost In The Assistant) service listening on port ${PORT}`);
});
