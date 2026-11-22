// Kunci situs: berjalan di server Vercel sebelum halaman, berkas, atau API apa pun dikirim.
// Tanpa kode yang benar, pengunjung hanya menerima halaman masuk; data depo dan beban GI tidak ikut terkirim.
// Ganti kode tanpa mengubah berkas ini: isi variabel lingkungan SITE_CODE di Vercel.
import { next } from '@vercel/functions';

const KODE = process.env.SITE_CODE || '1234';
const NAMA = 'hdv_akses';
const UMUR = 60 * 60 * 24 * 14; // 14 hari
const JEDA = 900; // jeda tiap kode salah, memperlambat tebak-tebakan

async function tanda(kode) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('pantau-hdv:' + kode));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const aman = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tujuan = (v) => (typeof v === 'string' && /^\/(?!\/)[^\s\\]*$/.test(v) && !v.startsWith('/masuk') && !v.startsWith('/keluar') ? v : '/');

function halaman(pesan, ke) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Pantau HDV · Masuk</title>
<style>*{box-sizing:border-box}html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#13212e;color:#13212e;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:16px}
form{background:#fff;border-radius:14px;padding:26px 24px;width:100%;max-width:340px;box-shadow:0 10px 40px #0006}h1{font-size:19px;margin:0 0 2px}p{margin:0 0 16px;color:#5c6b7a;font-size:13.5px}
label{display:block;font-size:12.5px;color:#5c6b7a;margin-bottom:4px}input{width:100%;font:inherit;font-size:18px;letter-spacing:.2em;padding:10px 12px;border:1px solid #c3ccd6;border-radius:8px}
input:focus-visible,button:focus-visible{outline:2px solid #0e6f73;outline-offset:2px}button{width:100%;margin-top:12px;padding:11px;border:0;border-radius:8px;background:#0e6f73;color:#fff;font:inherit;font-weight:600;cursor:pointer}
.e{margin:10px 0 0;color:#c23b2e;font-size:13px;min-height:19px}</style></head><body>
<form method="post" action="/masuk"><h1>Pantau HDV Depo–Gardu</h1><p>Halaman ini untuk tim. Masukkan kode akses.</p>
<input type="hidden" name="ke" value="${aman(ke)}"><label for="kode">Kode akses</label><input id="kode" name="kode" type="password" inputmode="numeric" autocomplete="current-password" autofocus required>
<button type="submit">Masuk</button><p class="e" role="alert">${aman(pesan)}</p></form></body></html>`;
}
const html = (isi, status) => new Response(isi, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });

export default async function middleware(request) {
  const url = new URL(request.url);
  const sah = await tanda(KODE);
  const kue = (request.headers.get('cookie') || '').split(/;\s*/).find((c) => c.startsWith(NAMA + '='));
  const masuk = !!kue && kue.slice(NAMA.length + 1) === sah;

  if (url.pathname === '/keluar') {
    return new Response(null, { status: 303, headers: { location: '/', 'set-cookie': `${NAMA}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`, 'cache-control': 'no-store' } });
  }
  if (url.pathname === '/masuk') {
    if (request.method !== 'POST') return masuk ? Response.redirect(new URL('/', url), 303) : html(halaman('', '/'), 401);
    const f = await request.formData().catch(() => null);
    const ke = tujuan(f && f.get('ke'));
    if (f && String(f.get('kode') || '').trim() === KODE) {
      return new Response(null, { status: 303, headers: { location: ke, 'set-cookie': `${NAMA}=${sah}; Path=/; Max-Age=${UMUR}; HttpOnly; Secure; SameSite=Lax`, 'cache-control': 'no-store' } });
    }
    await new Promise((r) => setTimeout(r, JEDA));
    return html(halaman('Kode salah. Coba lagi.', ke), 401);
  }
  if (masuk) return next();
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ ok: false, error: 'Perlu kode akses situs.' }), { status: 401, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  }
  return html(halaman('', tujuan(url.pathname + url.search)), 401);
}
