// Penyimpanan bersama entri formulir survei F1–F3.
// GET  /api/survey           → semua entri; kolom identitas F1 disembunyikan kecuali PIN benar
// POST /api/survey {recs:[]} → gabungkan entri (yang lebih baru menang); wajib PIN
// Satu dokumen JSON di Vercel Blob privat. Tulis memakai ETag agar dua admin tidak saling menimpa.
const crypto = require('crypto');
const fs = require('fs');

const KEY = `survei/${process.env.VERCEL_ENV || 'lokal'}/data.json`;
// PIN admin. Bawaan dipilih pemilik proyek; ganti lewat variabel lingkungan SURVEY_PIN tanpa mengubah kode.
const PIN = process.env.SURVEY_PIN || '1234';
const PRIV_F1 = ['perusahaan', 'nama_pool', 'alamat', 'lat', 'lon', 'narasumber', 'hp', 'depo_id']; // rahasia per F1 bagian E
const MAX_REC = 24 * 1024, MAX_BATCH = 600, TTL = 30000;
// Pool: P1–P10 (rencana) atau N + 4 huruf/angka (pool yang dibuat di lapangan).
const POOL = '(?:P(?:[1-9]|10)|N[2-9A-HJ-NP-Z]{4})';
// cfg:pool = daftar pool yang menjadi target survei (5–15 pool), diatur dari Tracker.
const ID = { f1: new RegExp(`^${POOL}$`), f2: new RegExp(`^${POOL}-\\d{3}$`), f3: new RegExp(`^${POOL}-\\d{3}:[1-7]$`), cfg: /^pool$/ };
const empty = () => ({ v: 1, recs: {} });
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
let mem = null; // { doc, etag, at }

const fileStore = (file) => ({
  async read() {
    if (!fs.existsSync(file)) return { doc: empty(), etag: null };
    const t = fs.readFileSync(file, 'utf8');
    return { doc: JSON.parse(t), etag: sha(t).toString('hex') };
  },
  async write(doc, etag) {
    const cur = fs.existsSync(file) ? sha(fs.readFileSync(file, 'utf8')).toString('hex') : null;
    if (cur !== (etag || null)) throw Object.assign(new Error('conflict'), { conflict: true });
    const t = JSON.stringify(doc);
    fs.writeFileSync(file, t);
    return sha(t).toString('hex');
  },
});

const blobStore = () => ({
  async read() {
    const { get } = require('@vercel/blob');
    const r = await get(KEY, { access: 'private', useCache: false });
    if (!r) return { doc: empty(), etag: null };
    if (r.statusCode !== 200) throw new Error('blob status ' + r.statusCode);
    return { doc: JSON.parse(await new Response(r.stream).text()), etag: r.blob.etag };
  },
  async write(doc, etag) {
    const { put } = require('@vercel/blob');
    const opt = { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json' };
    if (etag) opt.ifMatch = etag;
    try {
      return (await put(KEY, JSON.stringify(doc), opt)).etag;
    } catch (e) {
      if (e && (e.name === 'BlobPreconditionFailedError' || /precondition/i.test(e.message || ''))) e.conflict = true;
      throw e;
    }
  },
});

const store = process.env.SURVEY_LOCAL_FILE ? fileStore(process.env.SURVEY_LOCAL_FILE) : blobStore();
// Penyimpanan aktif bila gudang Vercel Blob sudah disambungkan ke proyek (atau berkas lokal saat pengembangan).
const READY = !!(process.env.SURVEY_LOCAL_FILE || process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const NOT_READY = 'Penyimpanan server belum diaktifkan (gudang Vercel Blob belum disambungkan ke proyek).';

async function load(fresh) {
  if (!fresh && mem && Date.now() - mem.at < TTL) return mem;
  const r = await store.read();
  if (!r.doc || typeof r.doc.recs !== 'object') throw new Error('dokumen survei rusak');
  mem = { doc: r.doc, etag: r.etag, at: Date.now() };
  return mem;
}

function isAuth(req) {
  const pin = PIN, got = req.headers['x-pin'];
  return !!pin && !!got && crypto.timingSafeEqual(sha(got), sha(pin));
}

function publicView(recs) {
  const out = {};
  for (const [k, r] of Object.entries(recs)) {
    if (!r.data) { out[k] = r; continue; }
    const d = { ...r.data };
    delete d.enum;
    if (r.k === 'f1') PRIV_F1.forEach((f) => delete d[f]);
    out[k] = { ...r, data: d };
  }
  return out;
}

function clean(rec, now) {
  if (!rec || typeof rec !== 'object' || !ID[rec.k] || typeof rec.id !== 'string' || !ID[rec.k].test(rec.id)) return null;
  const pool = rec.id.split(/[-:]/)[0];
  if (rec.data !== null && (typeof rec.data !== 'object' || Array.isArray(rec.data))) return null;
  if (JSON.stringify(rec.data).length > MAX_REC) return null;
  const ts = Math.min(Number(rec.ts) || now, now);
  return { k: rec.k, pool, id: rec.id, ts, data: rec.data };
}

module.exports = async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const auth = isAuth(req);
    if (req.method === 'GET') {
      const admin = req.headers['x-pin'] !== undefined;
      // Jangan pernah disimpan CDN: kunci cache Vercel mengabaikan x-pin, jadi salinan publik akan tersaji ke admin.
      res.setHeader('Cache-Control', 'private, no-store');
      if (!READY) return res.status(200).json({ ok: true, ready: false, pin: !!PIN, auth: false, n: 0, at: Date.now(), recs: {}, error: NOT_READY });
      if (admin && !auth) return res.status(401).json({ ok: false, error: PIN ? 'PIN salah' : 'PIN belum diatur di server' });
      const m = await load(false);
      return res.status(200).json({ ok: true, ready: true, auth, n: Object.keys(m.doc.recs).length, at: Date.now(), recs: auth ? m.doc.recs : publicView(m.doc.recs) });
    }
    if (req.method === 'POST') {
      res.setHeader('Cache-Control', 'no-store');
      if (!READY) return res.status(503).json({ ok: false, ready: false, error: NOT_READY });
      if (!PIN) return res.status(503).json({ ok: false, error: 'PIN belum diatur di server' });
      if (!auth) return res.status(401).json({ ok: false, error: 'PIN salah' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      if (!Array.isArray(body.recs) || body.recs.length > MAX_BATCH) return res.status(400).json({ ok: false, error: 'format entri tidak dikenali' });
      const now = Date.now(), inc = body.recs.map((r) => clean(r, now));
      if (inc.some((r) => !r)) return res.status(400).json({ ok: false, error: 'ada entri dengan kode atau isi yang tidak sah' });
      for (let i = 0; i < 6; i++) {
        const m = await load(true), recs = { ...m.doc.recs };
        let n = 0;
        inc.forEach((r) => { const key = r.k + ':' + r.id, c = recs[key]; if (!c || r.ts >= c.ts) { recs[key] = r; n++; } });
        const doc = { v: 1, at: now, recs };
        try {
          const etag = await store.write(doc, m.etag);
          mem = { doc, etag, at: Date.now() };
          return res.status(200).json({ ok: true, merged: n, n: Object.keys(recs).length, at: now });
        } catch (e) {
          if (!e.conflict) throw e;
          await new Promise((r) => setTimeout(r, 60 + Math.random() * 240 * (i + 1)));
        }
      }
      return res.status(409).json({ ok: false, error: 'server sedang sibuk, coba unggah lagi' });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'metode tidak didukung' });
  } catch (e) {
    console.error('survey api', e);
    return res.status(500).json({ ok: false, error: 'galat server' });
  }
};
