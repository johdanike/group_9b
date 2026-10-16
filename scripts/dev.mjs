import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const children = [
  ['backend', 'node_modules/@nestjs/cli/bin/nest.js', ['start', '--watch']],
  ['frontend', 'node_modules/vite/bin/vite.js', ['--host', '0.0.0.0']],
].map(([workspace, executable, args]) =>
  spawn(process.execPath, [resolve(root, executable), ...args], {
    cwd: resolve(root, workspace),
    stdio: 'inherit',
    detached: process.platform !== 'win32',
  }),
);
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid) continue;
    if (process.platform === 'win32')
      spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
    else {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch {
        /* Already stopped. */
      }
    }
  }
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const child of children) {
  child.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
    stop();
  });
  child.on('exit', (code) => {
    if (!stopping) {
      process.exitCode = code || 1;
      stop();
    }
  });
}
