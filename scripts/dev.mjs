import { spawn } from 'node:child_process';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = ['backend', 'frontend'].map((workspace) =>
  spawn(npm, ['run', workspace === 'backend' ? 'start:dev' : 'dev', '--workspace', workspace], {
    stdio: 'inherit', shell: process.platform === 'win32',
  }),
);
function stop() { for (const child of children) child.kill(); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const child of children) child.on('exit', (code) => { if (code) { stop(); process.exitCode = code; } });
