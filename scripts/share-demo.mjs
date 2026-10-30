import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const local = resolve(
  root,
  '.local/tools',
  process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared',
);
const executable =
  process.env.CLOUDFLARED_PATH || (existsSync(local) ? local : 'cloudflared');
try {
  if (!(await fetch('http://127.0.0.1:4173')).ok) throw new Error();
} catch {
  throw new Error('Start npm run demo:serve before sharing.');
}
const child = spawn(
  executable,
  [
    'tunnel',
    '--url',
    'http://127.0.0.1:4173',
    '--protocol',
    'http2',
    '--no-autoupdate',
  ],
  { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
);
let published = false;
async function output(chunk) {
  const text = chunk.toString();
  process.stdout.write(text);
  const url = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (url && !published) {
    published = true;
    await mkdir(resolve(root, '.local'), { recursive: true });
    await writeFile(resolve(root, '.local/share-url.txt'), url[0] + '\n');
    console.log(
      '\nPHONE LINK: ' +
        url[0] +
        '\nKeep this terminal and the app running. The link changes when the tunnel restarts.',
    );
  }
}
child.stdout.on('data', (chunk) => {
  void output(chunk);
});
child.stderr.on('data', (chunk) => {
  void output(chunk);
});
child.on('error', (error) => {
  console.error(
    error.message +
      '\nInstall cloudflared or set CLOUDFLARED_PATH. See README.',
  );
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code || 0;
});
process.on('SIGINT', () => child.kill());
process.on('SIGTERM', () => child.kill());
