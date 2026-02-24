import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function playAudio(filePath) {
  if (process.env.ENABLE_PLAYBACK !== 'true') {
    return false;
  }

  try {
    // Check if ffplay is available
    await execAsync('ffplay -version');
  } catch (err) {
    console.warn("Playback enabled but ffplay is not available in PATH. Skipping playback.");
    return false;
  }

  try {
    console.log(`Playing audio: ${filePath}`);
    // -nodisp prevents ffplay from trying to open a display window
    // -autoexit exits when the file is done playing
    await execAsync(`ffplay -nodisp -autoexit "${filePath}"`);
    return true;
  } catch (err) {
    console.error(`Error playing audio: ${err.message}`);
    return false;
  }
}
