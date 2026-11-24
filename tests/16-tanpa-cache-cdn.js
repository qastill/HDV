// CDN Vercel tidak memasukkan header x-pin ke kunci cache. Bila GET publik boleh disimpan CDN,
// admin yang mengirim PIN ikut menerima salinan publik (auth:false, kolom rahasia hilang, data basi).
// Jadi setiap jawaban GET /api/survey harus no-store, dengan atau tanpa PIN.
const os = require('os'), path = require('path');
process.env.SURVEY_LOCAL_FILE = path.join(os.tmpdir(), 'hdv-uji-16-' + process.pid + '.json');
process.env.SURVEY_PIN = 'uji-1234';
const api = require('../api/survey.js');
let f = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) f = 1; };
const panggil = (headers) => new Promise((done) => {
  const h = {};
  const res = { setHeader: (k, v) => { h[k.toLowerCase()] = v; }, status(s) { this.s = s; return this; }, json(b) { done({ s: this.s, h, b }); } };
  api({ method: 'GET', headers }, res);
});
(async () => {
  const pub = await panggil({}), adm = await panggil({ 'x-pin': 'uji-1234' });
  ok(pub.s === 200 && /no-store/.test(pub.h['cache-control']) && !/public|s-maxage/.test(pub.h['cache-control']), 'GET tanpa PIN tidak disimpan CDN');
  ok(adm.s === 200 && adm.b.auth === true && /no-store/.test(adm.h['cache-control']), 'GET dengan PIN: auth dan no-store');
  require('fs').rmSync(process.env.SURVEY_LOCAL_FILE, { force: true });
  process.exit(f);
})();
