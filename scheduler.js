import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve('data', 'db.json');

let db = { presets: [], jobs: [], logs: [] };

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (!db.presets) db.presets = [];
      if (!db.jobs) db.jobs = [];
      if (!db.logs) db.logs = [];
    } else {
      saveDb();
    }
  } catch (e) {
    console.error('Error loading db:', e);
  }
}

function saveDb() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Error saving db:', e);
  }
}

export function getDb() { return db; }

export function addPreset(p) { db.presets.push(p); saveDb(); }
export function deletePreset(id) { db.presets = db.presets.filter(p => p.id !== id); saveDb(); }

export function addJob(j) { db.jobs.push(j); saveDb(); }
export function updateJob(id, updates) { 
  const i = db.jobs.findIndex(j => j.id === id);
  if(i>=0) { db.jobs[i] = { ...db.jobs[i], ...updates }; saveDb(); }
}
export function deleteJob(id) { db.jobs = db.jobs.filter(j => j.id !== id); saveDb(); }

export function addLog(msg) {
  db.logs.push({ time: Date.now(), msg });
  if (db.logs.length > 50) db.logs.shift();
  saveDb();
}

loadDb();
