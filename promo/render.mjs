// Render video promo (promo/video.html) menjadi MP4 1080×1920, 30 fps.
//
//   node promo/render.mjs                          → promo/hasil/promo.mp4
//   node promo/render.mjs --keluaran=promo/hasil/promo-v2.mp4
//   node promo/render.mjs --cuplik=1,5,12.5        → gambar diam di detik tsb (cek cepat tanpa render penuh)
//
// Butuh Node 22+, Google Chrome/Edge, dan ffmpeg. Kalau tidak terdeteksi otomatis, atur lewat
// variabel lingkungan CHROME dan FFMPEG (lihat PANDUAN.md bagian "Video promo").
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { once } from 'node:events';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  return m ? [m[1], m[2] ?? true] : [a, true];
}));
const FPS = Number(arg.fps || 30);
const KELUARAN = path.resolve(AKAR, String(arg.keluaran || 'promo/hasil/promo.mp4'));
const CUPLIK = arg.cuplik ? String(arg.cuplik).split(',').map(Number).filter((n) => n >= 0).sort((a, b) => a - b) : null;

const CHROME = process.env.CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => existsSync(p));
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
if (!CHROME) { console.error('Chrome tidak ditemukan. Atur variabel CHROME ke lokasi chrome.exe.'); process.exit(1); }

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Server statis lokal (hanya 127.0.0.1) ----------
const TIPE = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://lokal').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(AKAR, p);
    if (!file.startsWith(AKAR + path.sep)) { res.writeHead(403).end(); return; }
    const isi = await readFile(file);
    res.writeHead(200, { 'Content-Type': TIPE[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(isi);
  } catch { res.writeHead(404).end(); }
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const URL_HALAMAN = `http://127.0.0.1:${server.address().port}/promo/video.html?render=1`;

// ---------- Chrome headless + DevTools Protocol ----------
const PORT_CDP = 9300 + Math.floor(Math.random() * 600);
const PROFIL = path.join(os.tmpdir(), `promo-chrome-${process.pid}`);
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT_CDP}`, `--user-data-dir=${PROFIL}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
  '--force-device-scale-factor=1', '--window-size=1080,1920',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
  'about:blank',
], { stdio: 'ignore' });

let wsUrl = null;
for (let i = 0; i < 100 && !wsUrl; i++) {
  try {
    const daftar = await (await fetch(`http://127.0.0.1:${PORT_CDP}/json/list`)).json();
    wsUrl = daftar.find((x) => x.type === 'page')?.webSocketDebuggerUrl;
  } catch { /* Chrome belum siap */ }
  if (!wsUrl) await tidur(200);
}
if (!wsUrl) { console.error('Tidak bisa terhubung ke Chrome.'); chrome.kill(); process.exit(1); }

const ws = new WebSocket(wsUrl);
let nomor = 0;
const menunggu = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && menunggu.has(m.id)) {
    const { res, rej } = menunggu.get(m.id);
    menunggu.delete(m.id);
    if (m.error) rej(new Error(m.error.message)); else res(m.result);
  }
};
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
const kirim = (method, params = {}) => new Promise((res, rej) => {
  const id = ++nomor;
  menunggu.set(id, { res, rej });
  ws.send(JSON.stringify({ id, method, params }));
});
async function nilai(ekspresi) {
  const r = await kirim('Runtime.evaluate', { expression: ekspresi, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function jepret() {
  const r = await kirim('Page.captureScreenshot', { format: 'jpeg', quality: 94 });
  return Buffer.from(r.data, 'base64');
}

async function selesai(kode = 0) {
  try { ws.close(); } catch { /* abaikan */ }
  chrome.kill();
  server.close();
  await tidur(500);
  await rm(PROFIL, { recursive: true, force: true }).catch(() => {});
  process.exit(kode);
}

try {
  await kirim('Page.enable');
  await kirim('Runtime.enable');
  await kirim('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
  await kirim('Page.navigate', { url: URL_HALAMAN });
  const batas = Date.now() + 90000;
  while (!(await nilai('window.siap === true').catch(() => false))) {
    if (Date.now() > batas) throw new Error('Halaman video tidak siap dalam 90 detik (cek koneksi internet untuk foto & font).');
    await tidur(300);
  }
  const DURASI = await nilai('window.DURASI');
  await mkdir(path.dirname(KELUARAN), { recursive: true });

  if (CUPLIK) {
    // Jalan maju 15 langkah per detik tanpa merekam, jepret hanya di detik yang diminta.
    const waktu = new Set(CUPLIK);
    for (let t = 0; t < Math.max(...CUPLIK); t += 1 / 15) waktu.add(Math.round(t * 1000) / 1000);
    for (const t of [...waktu].sort((a, b) => a - b)) {
      await nilai(`seek(${t})`);
      if (CUPLIK.includes(t)) {
        const file = path.join(path.dirname(KELUARAN), `cuplik-${t.toFixed(2)}.jpg`);
        await writeFile(file, await jepret());
        console.log('cuplik', file);
      }
    }
    await selesai(0);
  }

  const total = Math.round(DURASI * FPS);
  const ff = spawn(FFMPEG, [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-map', '0:v', '-map', '1:a', '-shortest',
    // Ubah ke rentang warna video standar (bt709, tv) agar warna sama di Instagram, TikTok, dan WhatsApp.
    '-vf', 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p',
    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-level', '4.1',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', KELUARAN,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffSelesai = once(ff, 'close');
  const mulai = Date.now();
  for (let f = 0; f < total; f++) {
    await nilai(`seek(${f / FPS})`);
    const gambar = await jepret();
    if (!ff.stdin.write(gambar)) await once(ff.stdin, 'drain');
    if (f % 60 === 0) console.log(`frame ${f}/${total} (${Math.round((Date.now() - mulai) / 1000)} dtk)`);
  }
  ff.stdin.end();
  const [kode] = await ffSelesai;
  if (kode !== 0) throw new Error('ffmpeg gagal (kode ' + kode + ')');
  console.log('SELESAI:', KELUARAN);
  await selesai(0);
} catch (e) {
  console.error('GAGAL:', e.message);
  await selesai(1);
}
