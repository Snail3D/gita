import { exec } from 'child_process';
import http from 'http';

const URL = 'http://localhost:' + (process.env.PORT || 3000);

function openBrowser() {
  const platform = process.platform;
  let cmd = '';
  if (platform === 'darwin') cmd = `open ${URL}`;
  else if (platform === 'win32') cmd = `start ${URL}`;
  else cmd = `xdg-open ${URL}`;

  exec(cmd, (err) => {
    if (err) console.error('Failed to open browser:', err);
  });
}

// Check if server is already running
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
  const child = exec('npm start', { cwd: process.cwd() });
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  
  // Wait a second for express to start listening
  setTimeout(openBrowser, 1500);
}
