import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function captureMicrophone({ seconds = 5, input = process.env.MIC_INPUT || ':0' } = {}) {
  const outDir = path.resolve('data', 'in');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, `${crypto.randomUUID()}.wav`);
  const dur = Math.max(1, Math.min(20, Number(seconds) || 5));

  // macOS avfoundation: default input device index 0 via ":0"
  const cmd = `ffmpeg -hide_banner -loglevel error -y -f avfoundation -i "${input}" -t ${dur} -ac 1 -ar 16000 "${filePath}"`;
  await execAsync(cmd);
  return filePath;
}

export async function transcribeAudioFile(filePath, { language = 'en' } = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set in environment.');

  const fd = new FormData();
  const buf = fs.readFileSync(filePath);
  fd.append('file', new Blob([buf], { type: 'audio/wav' }), path.basename(filePath));
  fd.append('model', process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo');
  if (language) fd.append('language', language);

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: fd,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq STT API Error: ${response.status} ${errText}`);
  }
  const data = await response.json();
  return String(data?.text || '').trim();
}

export async function captureAndTranscribe(opts = {}) {
  const wav = await captureMicrophone(opts);
  const text = await transcribeAudioFile(wav, opts);
  return { text, wav };
}
