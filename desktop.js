import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const URL = 'http://localhost:' + (process.env.PORT || 3000);

function openBrowser() {
  const platform = process.platform;
  let cmd = '';
  if (platform === 'darwin') cmd = `open ${URL}`;
  else if (platform === 'win32') cmd = `start ${URL}`;
  else cmd = `xdg-open ${URL}`;

  import('child_process').then(({ exec }) => {
    exec(cmd, (err) => {
      if (err) console.error('Failed to open browser:', err);
    });
  });
}

const req = http.get(URL + '/health', (res) => {
  if (res.statusCode === 200) {
    console.log('GITA server is already running. Opening browser...');
    openBrowser();
  } else {
    startServer();
  }
}).on('error', () => {
  console.log('Starting GITA server...');
  startServer();
});

function startServer() {
  const child = spawn('npm', ['start'], { cwd: __dirname, stdio: 'inherit' });
  setTimeout(openBrowser, 1500);
}
