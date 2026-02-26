import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function parseLines(text = '') {
  return String(text)
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
}

function buildAdbBase(deviceId) {
  const base = ['adb'];
  if (deviceId) base.push('-s', String(deviceId));
  return base;
}

async function runAdb(args = [], { timeoutMs = 15000 } = {}) {
  const [bin, ...baseArgs] = args;
  try {
    const { stdout, stderr } = await execFileAsync(bin, baseArgs, {
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024,
    });
    return { stdout: String(stdout || ''), stderr: String(stderr || '') };
  } catch (err) {
    if (err?.code === 'ENOENT') {
      throw new Error('adb not found. Install Android platform-tools and ensure adb is in PATH.');
    }
    throw err;
  }
}

export async function listAndroidDevices() {
  const { stdout } = await runAdb(['adb', 'devices']);
  const lines = parseLines(stdout).filter(l => !l.toLowerCase().startsWith('list of devices'));
  const devices = lines
    .map(line => {
      const [id, state] = line.split(/\s+/);
      return { id, state };
    })
    .filter(d => d.id);
  return { devices };
}

export async function androidShell(command, { deviceId, timeoutMs } = {}) {
  const base = buildAdbBase(deviceId);
  const cmd = Array.isArray(command) ? command : ['sh', '-lc', String(command || '')];
  const { stdout, stderr } = await runAdb([...base, 'shell', ...cmd], { timeoutMs });
  return { success: true, stdout: stdout.trim(), stderr: stderr.trim() };
}

export async function androidTap({ x, y, deviceId }) {
  if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) {
    throw new Error('tap requires numeric x and y');
  }
  return androidShell(['input', 'tap', String(Math.round(Number(x))), String(Math.round(Number(y)))], { deviceId });
}

export async function androidSwipe({ x1, y1, x2, y2, durationMs = 300, deviceId }) {
  const vals = [x1, y1, x2, y2].map(Number);
  if (vals.some(v => !Number.isFinite(v))) {
    throw new Error('swipe requires numeric x1, y1, x2, y2');
  }
  const d = Number(durationMs);
  return androidShell(
    ['input', 'swipe', ...vals.map(v => String(Math.round(v))), String(Number.isFinite(d) ? Math.max(0, Math.round(d)) : 300)],
    { deviceId }
  );
}

export async function androidType({ text, deviceId }) {
  const raw = String(text || '').trim();
  if (!raw) throw new Error('type requires non-empty text');

  // ADB input text: spaces should be %s
  const safe = raw.replace(/\s/g, '%s');
  return androidShell(['input', 'text', safe], { deviceId });
}

export async function androidKeyevent({ key, deviceId }) {
  const val = String(key || '').trim();
  if (!val) throw new Error('keyevent requires key');
  return androidShell(['input', 'keyevent', val], { deviceId });
}

export async function androidOpenUrl({ url, deviceId }) {
  const value = String(url || '').trim();
  if (!value) throw new Error('open-url requires url');
  return androidShell(['am', 'start', '-a', 'android.intent.action.VIEW', '-d', value], { deviceId });
}

export async function androidLaunchApp({ pkg, activity, deviceId }) {
  const p = String(pkg || '').trim();
  if (!p) throw new Error('launch-app requires pkg');
  const target = activity ? `${p}/${String(activity).trim()}` : p;
  return androidShell(['monkey', '-p', p, '-c', 'android.intent.category.LAUNCHER', '1'], { deviceId });
}

export async function runAndroidAction({ action, deviceId, params = {} }) {
  const a = String(action || '').toLowerCase();

  if (a === 'devices') return listAndroidDevices();
  if (a === 'shell') return androidShell(params.command, { deviceId, timeoutMs: params.timeoutMs });
  if (a === 'tap') return androidTap({ ...params, deviceId });
  if (a === 'swipe') return androidSwipe({ ...params, deviceId });
  if (a === 'type') return androidType({ ...params, deviceId });
  if (a === 'keyevent') return androidKeyevent({ ...params, deviceId });
  if (a === 'open-url') return androidOpenUrl({ ...params, deviceId });
  if (a === 'launch-app') return androidLaunchApp({ ...params, deviceId });

  throw new Error(`Unsupported android action: ${a}`);
}
