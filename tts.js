import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function generateTTS(text, voiceOverride, speedOverride) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in environment.");
  }

  const voice = voiceOverride || process.env.DEFAULT_VOICE || 'troy';
  const speed = speedOverride || 1.0;
  
  const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'canopylabs/orpheus-v1-english',
      input: text,
      voice: voice,
      speed: speed,
      response_format: 'wav'
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq TTS API Error: ${response.status} ${errText}`);
  }

  const buffer = await response.arrayBuffer();
  
  const filename = `${crypto.randomUUID()}.wav`;
  const outDir = path.resolve('data', 'out');
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, Buffer.from(buffer));
  
  return filePath;
}
