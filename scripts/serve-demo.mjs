import { createServer, request } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';

const root = fileURLToPath(new URL('../frontend/dist/', import.meta.url));
if (!existsSync(resolve(root, 'index.html')))
  throw new Error('Run npm run build first.');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
const server = createServer(async (req, res) => {
  let path;
  try {
    path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (
    path.split('/').some((part) => part.startsWith('.') || part.startsWith('@'))
  ) {
    res.writeHead(404).end();
    return;
  }
  if (path === '/api' || path.startsWith('/api/')) {
    const upstream = request(
      {
        hostname: '127.0.0.1',
        port: Number(process.env.API_PORT || 3000),
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: '127.0.0.1:3000' },
        timeout: 30000,
      },
      (response) => {
        res.writeHead(response.statusCode || 502, response.headers);
        response.pipe(res);
      },
    );
    upstream.on('error', () => {
      if (!res.headersSent)
        res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          message: 'Backend is unavailable. Start the demo API.',
        }),
      );
    });
    upstream.on('timeout', () => upstream.destroy());
    req.pipe(upstream);
    return;
  }
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405).end();
    return;
  }
  let file = resolve(root, '.' + path);
  if (
    file !== resolve(root) &&
    !file.startsWith(root.endsWith(sep) ? root : root + sep)
  ) {
    res.writeHead(404).end();
    return;
  }
  try {
    if (!(await stat(file)).isFile()) throw new Error('not a file');
  } catch {
    if (extname(path)) {
      res.writeHead(404).end();
      return;
    }
    file = resolve(root, 'index.html');
  }
  res.writeHead(200, {
    'Content-Type': mime[extname(file)] || 'application/octet-stream',
    'Cache-Control':
      file.endsWith('sw.js') ||
      file.endsWith('index.html') ||
      file.endsWith('.webmanifest')
        ? 'no-cache'
        : 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  if (req.method === 'HEAD') res.end();
  else
    createReadStream(file)
      .on('error', () => res.destroy())
      .pipe(res);
});
server.listen(
  Number(process.env.SHARE_PORT || 4173),
  process.env.SHARE_HOST || '0.0.0.0',
  () =>
    console.log(
      'Built PWA ready at http://127.0.0.1:4173. Share this port through HTTPS for mobile installation and Web Push.',
    ),
);
