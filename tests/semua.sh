#!/usr/bin/env bash
# Menjalankan semua uji halaman terhadap server lokal (port 8765). Perlu Node 18+ dan Playwright dengan Chromium.
# Pakai: bash tests/semua.sh
cd "$(dirname "$0")" || exit 1
gagal=0
mulai(){ pkill -f 'node server.js' 2>/dev/null; rm -f .data.json; env "$@" node server.js >/dev/null 2>&1 & until curl -s -o /dev/null http://localhost:8765/; do :; done; }
uji(){ local nama=$1; shift; local out; out=$(env "$@" node "$nama" 2>&1); local kode=$?; printf '%-28s %3s lolos, %s gagal\n' "$nama ${*}" "$(grep -c '^PASS' <<<"$out")" "$(grep -c '^FAIL' <<<"$out")"; [ $kode -eq 0 ] || { gagal=1; grep '^FAIL' <<<"$out" || tail -5 <<<"$out"; }; }
node middleware.mjs >/dev/null 2>&1 && echo "middleware.mjs                lolos" || { echo "middleware.mjs                GAGAL"; gagal=1; }
mulai X=1                                   # server bersih: keadaan tanpa entri
for t in 10-kata 09-kuota 08-menu-hasil 07-dasbor 01-dasar 02-peta 03-detail 06-satu-layar; do uji $t.js X=1; done
uji 04-entri.js X=1                         # alur entri F1–F3 (mengisi data)
mulai X=1; node isi-contoh.js >/dev/null 2>&1 # data contoh 54 truk × 7 hari
uji 07-dasbor.js SEED=1
uji 05-tanpa-penyimpanan.js X=1             # menyalakan ulang server sendiri (mode tanpa penyimpanan)
pkill -f 'node server.js' 2>/dev/null; rm -f .data.json
[ $gagal -eq 0 ] && echo "SEMUA LOLOS" || echo "ADA YANG GAGAL"
exit $gagal
