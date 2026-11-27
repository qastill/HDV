"""Ringkasan gardu distribusi 20 kV per gardu induk (sampai level gardu distribusi), dari berkas
"Gardu_Beban_Lokasi_JABAR.xlsx" lembar DATA_GARDU, sebagai D.GDA. Hanya GI yang punya data gardu
distribusi yang mendapat ringkasan; GI lain tidak dibuatkan rincian.

D.GDA[kode GI] = [jumlah gardu, gardu berdata beban, kapasitas total (kVA),
                  overload >=100%, waspada 80-100%, normal 30-80%, rendah <30%,
                  rata-rata beban siang (%), rata-rata beban malam (%), gardu lebih padat malam,
                  [[kode gardu, kapasitas kVA, beban siang %, beban malam %], ...10 terpadat]]
Nama lengkap, alamat, dan daerah pasok gardu tidak diambil karena dapat memuat nama pelanggan.

Pakai:  python3 -I tools/gabung_gardu_gi.py Gardu_Beban_Lokasi_JABAR.xlsx
"""
import json, re, sys
import openpyxl

HTML = 'pantau_hdv_depo_gardu.html'


def num(v):
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
    kode = {g[0] for g in D.get('GL', [])}
    wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
    it = wb['DATA_GARDU'].iter_rows(values_only=True)
    ix = {k: i for i, k in enumerate(next(it))}
    agg = {}
    for r in it:
        k = str(r[ix['GI_KODE']] or '').strip().upper()
        if k not in kode:
            continue
        a = agg.setdefault(k, {'n': 0, 'nd': 0, 'kva': 0.0, 'kat': [0, 0, 0, 0], 's': [], 'm': [], 'mlb': 0, 'top': []})
        a['n'] += 1
        kva = num(r[ix['KAPASITAS_KVA']])
        if kva and 0 < kva <= 5000:
            a['kva'] += kva
        sp, mp, pk = num(r[ix['PERSEN_BEBAN_SIANG']]), num(r[ix['PERSEN_BEBAN_MALAM']]), num(r[ix['PERSEN_BEBAN']])
        if pk is None or pk < 0 or pk > 300 or not kva:
            continue
        a['nd'] += 1
        a['kat'][0 if pk >= 100 else 1 if pk >= 80 else 2 if pk >= 30 else 3] += 1
        if sp is not None and 0 <= sp <= 300:
            a['s'].append(sp)
        if mp is not None and 0 <= mp <= 300:
            a['m'].append(mp)
        if sp is not None and mp is not None and mp > sp:
            a['mlb'] += 1
        a['top'].append([str(r[ix['NAMA_GARDU']] or '').strip()[:12], round(kva), None if sp is None else round(sp, 1), None if mp is None else round(mp, 1), pk])
    rata = lambda v: round(sum(v) / len(v), 1) if v else None
    GDA = {}
    for k, a in agg.items():
        if not a['nd']:
            continue
        top = [t[:4] for t in sorted(a['top'], key=lambda t: -t[4])[:10]]
        GDA[k] = [a['n'], a['nd'], round(a['kva']), *a['kat'], rata(a['s']), rata(a['m']), a['mlb'], top]
    D['GDA'] = GDA
    s = s[:m.start(2)] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[m.end(2):]
    open(HTML, 'w', encoding='utf-8').write(s)
    print(f'{len(GDA)} gardu induk punya ringkasan gardu distribusi; {sum(v[0] for v in GDA.values())} gardu, '
          f'{sum(v[1] for v in GDA.values())} berdata beban.')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
