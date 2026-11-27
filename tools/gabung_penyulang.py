"""Seragamkan data beban gardu induk ke satu format: beban puncak siang dan malam, tanpa tanggal.

1. Menambahkan beban puncak siang dan malam tiap penyulang 20 kV dari lembar per UP3 berkas
   "beban GI.xlsx" (Bandung, Bekasi, Bogor, ...) sebagai D.PY.
2. Menghapus keterangan bulan (D.HD). Deret beban harian (D.TD dan hs/hm di GI) tetap ada untuk GI
   yang memilikinya dan ditampilkan sebagai hari ke-1, ke-2, dst. tanpa tanggal.

Kolom D.PY: [kode GI, UP3, nomor trafo, nama penyulang, jenis (SKTM/SUTM), kemampuan hantar (A),
             beban siang (A), beban siang (%), beban malam (A), beban malam (%)]
Kolom lokasi tidak diambil karena memuat nama pelanggan.

Pakai:  python3 -I tools/gabung_penyulang.py "beban GI.xlsx"
"""
import json, re, sys
import openpyxl

HTML = 'pantau_hdv_depo_gardu.html'
UP3 = {'BDG': 'Bandung', 'BKS': 'Bekasi', 'BGR': 'Bogor', 'CJR': 'Cianjur', 'CKR': 'Cikarang', 'CMI': 'Cimahi', 'CRB': 'Cirebon',
       'DPK': 'Depok', 'GRT': 'Garut', 'GPI': 'Gunung Putri', 'IDM': 'Indramayu', 'KRW': 'Karawang', 'MJA': 'Majalaya',
       'PWK': 'Purwakarta', 'SKI': 'Sukabumi', 'SMD': 'Sumedang', 'TSK': 'Tasikmalaya'}


def angka(v):
    if isinstance(v, bool) or v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).replace(',', '.'))
    except ValueError:
        return None


def baca(xlsx):
    wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
    rows = []
    for ws in wb.worksheets:
        up = UP3.get(ws.title.strip())
        if not up:
            continue
        for r in ws.iter_rows(min_row=10, values_only=True):
            if not r or not isinstance(r[0], (int, float)) or not isinstance(r[1], str) or not r[1].strip():
                continue
            kode, trf, nama, jenis = r[1].strip().upper(), r[2], str(r[3] or '').strip(), str(r[4] or '').strip().upper()
            kha, sa, sp, ma, mp = angka(r[5]), angka(r[6]), angka(r[7]), angka(r[8]), angka(r[9])
            if not nama or kha is None or kha <= 0:
                continue
            if sp is None and sa is not None:
                sp = 100 * sa / kha
            if mp is None and ma is not None:
                mp = 100 * ma / kha
            t = angka(trf)
            rows.append([kode, up, int(t) if t is not None else None, nama, jenis if jenis in ('SKTM', 'SUTM') else jenis[:6],
                         round(kha), None if sa is None else round(sa), None if sp is None else round(sp, 1),
                         None if ma is None else round(ma), None if mp is None else round(mp, 1)])
    return rows


def main(xlsx):
    s = open(HTML, encoding='utf-8').read()
    m = re.search(r'(<script type="application/json" id="d-core">)(.*?)(</script>)', s, re.S)
    D = json.loads(m.group(2))
    PY = baca(xlsx)
    kode = {g[0] for g in D.get('GL', [])}
    D['PY'] = PY
    # Deret beban harian (D.TD, hs/hm di GI) tetap dipakai untuk peta panas harian, tanpa nama bulan.
    D.pop('HD', None)
    D['SRC'] = {**D.get('SRC', {}), 'npy': len(PY)}
    s = s[:m.start(2)] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[m.end(2):]
    open(HTML, 'w', encoding='utf-8').write(s)
    ada = sum(1 for p in PY if p[0] in kode)
    print(f'{len(PY)} penyulang dari {len({p[1] for p in PY})} UP3; {ada} terpasang ke GI yang punya data beban trafo.')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
