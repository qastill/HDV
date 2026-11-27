"""Kota/kabupaten tiap gardu induk yang punya beban harian (D.TD), dari lembar GARDU INDUK berkas
"DATA GI DAN TRAFO.xlsx" (kolom CITY), sebagai D.GK = {id GI: kota}. Dipakai untuk saringan wilayah
pada tab Beban real time. Nama GI dicocokkan dengan cara yang sama seperti tools/gabung_beban_dki.py.

Pakai:  python3 -I tools/kota_gi.py "DATA GI DAN TRAFO.xlsx"
"""
import json, re, sys
import openpyxl

HTML = 'pantau_hdv_depo_gardu.html'
ALIAS = {'GI CIRACAS': 'Gandaria 2 / Ciracas', 'GI CIREUNDEU': 'Pondok Indah 2 / Cirendeu', 'GI GROGOL BARU': 'Grogol 2', 'GI BINTARO BARU': 'Bintaro 2/ Pondok Aren'}


def norm(n):
    n = str(n or '').lower().strip()
    n = re.sub(r'^gi\s+', '', n)
    n = re.sub(r'\bii\b', '2', n).replace('iii', '3')
    return re.sub(r'[^a-z0-9]+', ' ', n).strip()


def rapi(k):
    k = re.sub(r'^(kota|kab\.?|kabupaten)\s+', '', str(k or '').strip(), flags=re.I)
    return {'Bks': 'Bekasi', 'Adm. Kep. Seribu': 'Kepulauan Seribu'}.get(k, k)


def main(xlsx):
    s = open(HTML, encoding='utf-8').read()
    m = re.search(r'(<script type="application/json" id="d-core">)(.*?)(</script>)', s, re.S)
    D = json.loads(m.group(2))
    wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
    g = list(wb['GARDU INDUK'].iter_rows(values_only=True))
    ix = {h: i for i, h in enumerate(g[0]) if h}
    kota = {}
    for r in g[1:]:
        d = r[ix['DESCRIPTION']]
        if d and r[ix['CITY']]:
            d = d.strip().upper()
            for n in {norm(d), norm(ALIAS.get(d, d))}:
                kota.setdefault(n, rapi(r[ix['CITY']]))
    GI = {x['id']: x for x in D['GI']}
    GK, miss = {}, set()
    for t in D.get('TD', []):
        if t[0] in GK:
            continue
        n = norm(t[1])
        k = kota.get(n) or next((v for a, v in kota.items() if a.startswith(n) or n.startswith(a)), None)
        if k:
            GK[t[0]] = k
        else:
            miss.add(t[1])
    D['GK'] = GK
    s = s[:m.start(2)] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[m.end(2):]
    open(HTML, 'w', encoding='utf-8').write(s)
    from collections import Counter
    print(f'{len(GK)} GI berkota; belum cocok: {sorted(miss)}')
    print(Counter(GK.values()).most_common())


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
