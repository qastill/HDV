"""Profil beban 15 menit trafo gardu induk dari rekaman meter (berkas "combined.xlsx", lembar MergedData),
disambungkan ke gardu induk di peta sebagai D.AMR. Tanggal tidak disimpan; hanya jam.

Kode gardu di berkas meter tidak selalu sama dengan kode di data beban trafo (D.GL) atau peta (D.GI).
Urutan pencocokan: (1) kode sama dengan D.GL dan GL itu punya GI di peta, (2) kode sama dengan
D.GI[].kode, (3) tabel PETA di bawah (dicocokkan lewat nama gardu induk).

D.AMR = {"t": ["11:15", ..., "01:15"],
         "m": [[kode meter, gi_id atau null, nama GI, trafo, kode GL atau null,
                indeks beban tiap 15 menit (% dari puncak trafo itu sendiri, null = kosong),
                tegangan sisi 20 kV tiap 15 menit (kV, null bila tidak wajar),
                faktor daya rata-rata], ...]}
Nilai kW meter masih di sisi sekunder (rasio CT/PT tidak ada di berkas), jadi yang disimpan hanya
bentuk profil relatif terhadap puncaknya sendiri, bukan MW.

Meter dibuang bila: titik terisi < 80% dari jumlah titik, semua nol, atau nilainya tidak berubah (macet).

Pakai:  python3 -I tools/gabung_amr.py combined.xlsx
"""
import json, re, sys
import openpyxl

HTML = 'pantau_hdv_depo_gardu.html'
# kode meter -> (gi_id atau None, nama GI, kode GL atau None) untuk kode yang tidak sama dengan D.GL/D.GI
PETA = {
    'ARJRU': ('GI-JMB-0141', 'Arjawinangun Baru', 'NARJW'),
    'BJGDE': ('GI-JMB-0151', 'Bojong Gede', None),
    'BNRRU': ('GI-JMB-0153', 'Bunar Baru', None),
    'CIAMS': ('GI-JMB-0155', 'Ciamis', None),
    'CIKRNG': ('GI-JMB-0172', 'Cikarang', 'CIKRG'),
    'CKLPO': ('GI-JMB-0173', 'Cikarang Lippo', 'LIPPO'),
    'CKMPY': ('GI-JMB-0176', 'Cikumpay', None),
    'CLNSI': ('GI-JMB-0177', 'Cileungsi', 'CLNSI2'),
    'JSHIN': ('GI-JMB-0198', 'Juishin', None),
    'KDPRU': ('GI-JMB-0223', 'New Kadipaten', None),
    'MGKYA': ('GI-JMB-0220', 'Margakarya', None),
    'NPCOL': ('GI-JMB-0240', 'Poncol Baru II', 'NPCLR'),
    'PNGDRAN': ('GI-JMB-0231', 'Pangandaran', None),
    'PNYNG': ('GI-JMB-0236', 'Pinayungan', None),
    'PTUHA': ('GI-JMB-0234', 'Patuha', None),
    'RKSBT': ('GI-JMB-0121', 'Rangkasbitung Baru', None),
    'TASIK': ('GI-JMB-0265', 'Tasikmalaya', 'TSMYA'),
    # gardu induk yang belum ada di peta: ditampilkan tanpa titik peta
    'BKASI': (None, 'Bekasi', 'BKASI'),
    'BRAGA': (None, 'Braga', 'BRAGA'),
    'DPKRU': (None, 'Depok Baru', 'DPBR2'),
    'KTLPA': (None, 'Katulampa', 'KTLPA'),
}


def angka(v):
    if isinstance(v, bool) or v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).replace(',', '.'))
    except ValueError:
        return None


def main(xlsx):
    s = open(HTML, encoding='utf-8').read()
    m = re.search(r'(<script type="application/json" id="d-core">)(.*?)(</script>)', s, re.S)
    D = json.loads(m.group(2))
    GL = {g[0]: g for g in D.get('GL', [])}
    GI = {g['id']: g for g in D['GI']}
    GK = {}
    for g in D['GI']:
        if g.get('kode') and g.get('ps') is not None:
            GK.setdefault(g['kode'], g['id'])
    for g in D['GI']:
        if g.get('kode'):
            GK.setdefault(g['kode'], g['id'])

    wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
    it = wb['MergedData'].iter_rows(values_only=True)
    h = next(it)
    ix = {}
    for i, k in enumerate(h):
        if k and k not in ix:
            ix[k] = i
    meter = {}
    for r in it:
        k, trf, t = str(r[ix['Gardu']] or '').strip().upper(), str(r[ix['Penyulang']] or '').strip(), str(r[ix['Time']] or '')
        if not k or len(t) < 16:
            continue
        a = meter.setdefault((k, trf, r[ix['Meter']]), {})
        a[t] = (angka(r[ix['KW']]), angka(r[ix['VR kV']]), angka(r[ix['VS kV']]), angka(r[ix['VT kV']]), angka(r[ix['PF']]))

    # deret waktu bersama: stempel yang dipakai sebagian besar meter, urut
    hit = {}
    for a in meter.values():
        for t in a:
            hit[t] = hit.get(t, 0) + 1
    T = sorted(t for t, n in hit.items() if n >= len(meter) / 2)
    keluar, M = [], []
    for (k, trf, _), a in sorted(meter.items()):
        kw = [a.get(t, (None,) * 5)[0] for t in T]
        kw = [v if v is not None and v > 0 else None for v in kw]
        ok = [v for v in kw if v is not None]
        if len(ok) < 0.8 * len(T) or max(ok) == min(ok):
            keluar.append(f'{k} {trf}')
            continue
        if k in GL and GL[k][8]:
            gi, kgl = GL[k][8], k
        elif k in PETA:
            gi, _, kgl = PETA[k]
        elif k in GK:
            gi, kgl = GK[k], k if k in GL else None
        else:
            gi, kgl = None, k if k in GL else None
        if not kgl and gi and GI[gi].get('kode') in GL:
            kgl = GI[gi]['kode']
        nama = GI[gi]['n'] if gi else (PETA[k][1] if k in PETA else k)
        p = max(ok)
        idx = [None if v is None else round(100 * v / p) for v in kw]

        def kv(t):
            x = [v for v in a.get(t, (None,) * 5)[1:4] if v is not None]
            v = sum(x) / len(x) if x else None
            return round(v, 2) if v is not None and 10 < v < 30 else None
        tg = [kv(t) for t in T]
        if sum(v is not None for v in tg) < 0.8 * len(T):
            tg = None
        pf = [abs(a[t][4]) for t in T if t in a and a[t][4] is not None and 0 < abs(a[t][4]) <= 1]
        M.append([k, gi, nama, trf.title().replace('_Sel', ' Sel'), kgl, idx, tg, round(sum(pf) / len(pf), 3) if pf else None])
    D['AMR'] = {'t': [t[11:16] for t in T], 'm': M}
    s = s[:m.start(2)] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[m.end(2):]
    open(HTML, 'w', encoding='utf-8').write(s)
    gi = {x[1] for x in M if x[1]}
    print(f'{len(M)} trafo dari {len({x[0] for x in M})} gardu induk; {len(gi)} GI di peta; {len(T)} titik 15 menit '
          f'({T[0][11:16]}–{T[-1][11:16]}).')
    print('Tanpa titik peta:', sorted({x[0] for x in M if not x[1]}))
    print('Dibuang:', keluar)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
