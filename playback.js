import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function sleep(ms){
  return new Promise(r=>setTimeout(r,ms));
}

export async function setSystemVolume(percent){
  if (typeof percent !== 'number' || Number.isNaN(percent)) return false;
  const clamped=Math.max(0,Math.min(100,Math.round(percent)));
  try{
    // macOS system output volume via AppleScript
    await execAsync(`osascript -e 'set volume output volume ${clamped}'`);
    return true;
  }catch{
    return false;
  }
}

export async function playAudio(filePath) {
  if (process.env.ENABLE_PLAYBACK !== 'true') {
    return false;
  }

  try {
    await execAsync('ffplay -version');
  } catch (err) {
    console.warn("Playback enabled but ffplay is not available in PATH. Skipping playback.");
    return false;
  }

  try {
    console.log(`Playing audio: ${filePath}`);
    await execAsync(`ffplay -nodisp -autoexit "${filePath}"`);
    return true;
  } catch (err) {
    console.error(`Error playing audio: ${err.message}`);
    return false;
  }
}
