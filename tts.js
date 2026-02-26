import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

async function generateGroqTTS(text, voiceOverride, speedOverride, modelOverride, apiKeyOverride) {
  const apiKey = apiKeyOverride || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in environment.');
  }

  const voice = voiceOverride || process.env.DEFAULT_VOICE || 'daniel';
  const speed = speedOverride || 1.0;
  const model = modelOverride || 'canopylabs/orpheus-v1-english';

  const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: text,
      voice,
      speed,
      response_format: 'wav',
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq TTS API Error: ${response.status} ${errText}`);
  }

  const buffer = await response.arrayBuffer();
  const filename = `${crypto.randomUUID()}.wav`;
  const outDir = path.resolve('data', 'out');

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, Buffer.from(buffer));
  return filePath;
}

async function voiceboxGenerate(baseUrl, payload) {
  const response = await fetch(`${baseUrl}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Voicebox API Error: ${response.status} ${errText}`);
  }

  const json = await response.json();
  if (!json?.audio_path) {
    throw new Error('Voicebox API returned no audio_path.');
  }

  return json.audio_path;
}

async function generateVoiceboxTTS(text, profileOverride, modelOverride) {
  const baseUrl = process.env.VOICEBOX_URL || 'http://127.0.0.1:17493';
  const profileId = profileOverride || process.env.VOICEBOX_PROFILE_ID;
  const modelSize = modelOverride || process.env.VOICEBOX_MODEL_SIZE || '0.6B';
  const fallbackModelSize = process.env.VOICEBOX_FALLBACK_MODEL_SIZE || '';
  const language = process.env.VOICEBOX_LANGUAGE || 'en';

  if (!profileId) {
    throw new Error('VOICEBOX_PROFILE_ID is not set for voicebox provider.');
  }

  const primaryPayload = {
    profile_id: profileId,
    text,
    language,
    model_size: modelSize,
  };

  try {
    return await voiceboxGenerate(baseUrl, primaryPayload);
  } catch (err) {
    if (!fallbackModelSize || fallbackModelSize === modelSize) throw err;

    console.warn(`[voicebox] primary model ${modelSize} failed, retrying ${fallbackModelSize}: ${err.message}`);
    return voiceboxGenerate(baseUrl, {
      ...primaryPayload,
      model_size: fallbackModelSize,
    });
  }
}

export async function generateTTS(text, voiceOverride, speedOverride, modelOverride, apiKeyOverride) {
  const provider = String(process.env.TTS_PROVIDER || 'groq').toLowerCase();

  if (provider === 'voicebox') {
    return generateVoiceboxTTS(text, voiceOverride, modelOverride);
  }

  return generateGroqTTS(text, voiceOverride, speedOverride, modelOverride, apiKeyOverride);
}
