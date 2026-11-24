#!/usr/bin/env python3
"""Gabungkan data gardu induk, trafo, dan beban harian trafo PLN Distribusi Jakarta
(berkas "DATA GI DAN TRAFO.xlsx") ke data tertanam di pantau_hdv_depo_gardu.html.

Pakai:  python3 -I tools/gabung_beban_dki.py "DATA GI DAN TRAFO.xlsx"

Lembar yang dibaca:
  GARDU INDUK    lokasi GI (nama, kota, provinsi, koordinat)
  Trafo GI       daftar trafo per GI (jenis DAYA/PS, kapasitas MVA, status)
  Beban Bulanan  arus beban puncak tiap trafo per hari, siang dan malam (A), dan arus maksimum trafo (A)

Beban trafo (%) = arus beban / arus maksimum trafo x 100. Nilai 0 dianggap tidak tercatat;
nilai > 120% yang lebih dari dua kali median trafo itu dianggap salah catat dan tidak dipakai.
Per trafo: ps/pm = beban tertinggi siang/malam sebulan, rs/rm = rata-rata, h80 = jumlah hari >= 80%.
Per GI: sama seperti tools/gabung_beban_gi.py (rata-rata tertimbang kapasitas dari puncak tiap trafo),
ditambah profil harian GI (beban tertimbang kapasitas per hari, siang dan malam).
GI yang juga ada di data beban sebelumnya (trafo lain yang memasok wilayah lain) digabung trafonya.
GI di berkas yang belum ada di peta ditambahkan dengan koordinat dari berkas.
Depo yang GI terdekatnya belum punya data beban dipasangkan ke GI 20 kV terdekat yang punya data,
bila jaraknya paling jauh 3 km lebih jauh daripada GI terdekatnya.
Aman dijalankan ulang: data dari berkas ini dihapus dulu sebelum digabung lagi.
"""
import sys, json, re, math, collections, warnings
import openpyxl
warnings.simplefilter('ignore')
HTML = 'pantau_hdv_depo_gardu.html'
UNIT = 'DKI Jakarta'
TAMBAH_KM = 3.0
# nama di berkas -> nama GI di peta, untuk GI yang sama dengan ejaan/penomoran berbeda (dicek dari nama dan letaknya).
# Koordinat GI CIRACAS di berkas sama dengan GI Cipinang, jadi dicocokkan lewat namanya.
ALIAS = {'GI CIRACAS': 'Gandaria 2 / Ciracas', 'GI CIREUNDEU': 'Pondok Indah 2 / Cirendeu', 'GI GROGOL BARU': 'Grogol 2', 'GI BINTARO BARU': 'Bintaro 2/ Pondok Aren'}
PROV = {'Daerah Khusus Ibukota Jakarta': 'DKI Jakarta', 'Jawa Barat': 'Jawa Barat', 'Banten': 'Banten'}


def hav(a, b, c, d):
    r = math.pi / 180
    x = math.sin((c - a) * r / 2) ** 2 + math.cos(a * r) * math.cos(c * r) * math.sin((d - b) * r / 2) ** 2
    return 12742 * math.asin(math.sqrt(x))


def fnum(v):
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).replace(',', '.'))
    except (TypeError, ValueError):
        return None


def norm(n):
    n = str(n or '').lower().strip()
    n = re.sub(r'^gi\s+', '', n)
    n = re.sub(r'\bii\b', '2', n).replace('iii', '3')
    return re.sub(r'[^a-z0-9]+', ' ', n).strip()


def judul(n):
    return ' '.join(w if w in ('PIK', 'CSW', 'PLTD', 'II', 'III') else w.capitalize() for w in re.sub(r'^GI\s+', '', str(n).strip()).split())


def baca(xlsx):
    wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
    g = list(wb['GARDU INDUK'].iter_rows(values_only=True))
    ix = {h: i for i, h in enumerate(g[0]) if h}
    lok = {}
    for r in g[1:]:
        if not r[ix['DESCRIPTION']]:
            continue
        lok[r[ix['DESCRIPTION']].strip().upper()] = dict(lat=fnum(r[ix['LATITUDEY']]), lon=fnum(r[ix['LONGITUDEX']]),
                                                         pr=PROV.get(r[ix['PROVINCE']], r[ix['PROVINCE']]), kota=r[ix['CITY']])
    tf = {}
    for r in list(wb['Trafo GI'].iter_rows(values_only=True))[1:]:
        if r[1]:
            tf[r[1]] = dict(jenis=r[5], mva=fnum(r[6]) or 0, status=r[8])
    B = list(wb['Beban Bulanan'].iter_rows(values_only=True))
    bulan = next((str(c).split(':', 1)[1].strip() for r in B[:8] for c in r if c and 'BULAN' in str(c)), '')
    T = []
    for r in B:
        if not isinstance(r[0], (int, float)) or not r[1]:
            continue
        imax = fnum(r[4])
        if not imax:
            continue
        si, ma = [], []
        for d in range(31):
            a, b = fnum(r[5 + 2 * d]), fnum(r[6 + 2 * d])
            si.append(round(100 * a / imax) if a else None)
            ma.append(round(100 * b / imax) if b else None)
        if not any(v is not None for v in si + ma):
            continue
        t = tf.get(r[2], {})
        mva = t.get('mva') or round(math.sqrt(3) * 20 * imax / 1000, 1)
        # salah catat: nilai > 120% yang lebih dari 2x median trafo itu (mis. 7230 A di antara ~1200 A) tidak dipakai
        md = sorted(v for v in si + ma if v is not None)[len([v for v in si + ma if v is not None]) // 2]
        for arr, lbl in ((si, 'siang'), (ma, 'malam')):
            for i, v in enumerate(arr):
                if v is not None and v > 120 and v > 2 * md:
                    print(f'  ~ {r[1]} {r[3]} tgl {i + 1} {lbl}: {v}% (median {md}%) dianggap salah catat')
                    arr[i] = None
        T.append(dict(gi=r[1].strip().upper(), id=r[2], trf=str(r[3]).strip().title(), mva=mva, si=si, ma=ma))
    hari = max((i + 1 for t in T for i in range(31) if t['si'][i] is not None or t['ma'][i] is not None), default=0)
    for t in T:
        t['si'], t['ma'] = t['si'][:hari], t['ma'][:hari]
        s = [v for v in t['si'] if v is not None]; m = [v for v in t['ma'] if v is not None]
        t.update(ps=max(s, default=0), pm=max(m, default=0), rs=round(sum(s) / len(s), 1) if s else 0, rm=round(sum(m) / len(m), 1) if m else 0,
                 h80=sum(1 for a, b in zip(t['si'], t['ma']) if max(a or 0, b or 0) >= 80))
    return lok, T, bulan, hari


def main(xlsx):
    lok, T, bulan, hari = baca(xlsx)
    s = open(HTML, encoding='utf-8').read()
    m = re.search(r'(<script type="application/json" id="d-core">)(.*?)(</script>)', s, re.S)
    D = json.loads(m.group(2))
    # bersihkan hasil gabungan sebelumnya dari berkas ini
    D['GI'] = [g for g in D['GI'] if not g['id'].startswith('GI-DKI-')]
    D['GL'] = [x for x in D['GL'] if x[1] != UNIT]
    D['TR'] = [x for x in D['TR'] if x[1] != UNIT]
    D.pop('TD', None); D.pop('HD', None)
    for g in D['GI']:
        for k in ('hs', 'hm', 'h80', 'sm'):
            g.pop(k, None)
    gl_gid = {x[0]: x[8] for x in D['GL']}

    # cocokkan nama GI berkas ke GI 20 kV di peta
    def cocok(nama):
        n, L = norm(nama), lok.get(nama)
        if nama in ALIAS:
            return next(g for g in D['GI'] if g['n'] == ALIAS[nama] and g['v'].endswith('/20'))
        kand = [g for g in D['GI'] if g['v'].endswith('/20') and (norm(g['n']) == n or n in [norm(p) for p in g['n'].split('/')])]
        if L and L['lat'] and kand:
            kand.sort(key=lambda g: hav(L['lat'], L['lon'], g['lat'], g['lon']))
            if hav(L['lat'], L['lon'], kand[0]['lat'], kand[0]['lon']) > 8:
                print(f'  ! {nama}: nama cocok dengan {kand[0]["n"]} tetapi berjarak {hav(L["lat"], L["lon"], kand[0]["lat"], kand[0]["lon"]):.1f} km, tidak dipakai')
                return None
        return kand[0] if kand else None

    by = collections.defaultdict(list)
    for t in T:
        by[t['gi']].append(t)
    baru, pakai, dobel = 0, 0, []
    gid_of = {}
    for nama, v in sorted(by.items()):
        g = cocok(nama)
        if g is None and nama in lok and lok[nama]['lat']:
            baru += 1
            L = lok[nama]
            g = dict(id=f'GI-DKI-{baru:03d}', n=judul(nama), v='150/20', mva=round(sum(t['mva'] for t in v), 1), tr=len(v), pr=L['pr'], sy='Jamali', lon=L['lon'], lat=L['lat'])
            D['GI'].append(g)
        if g is None:
            print(f'  - {nama}: tidak ada di peta dan tanpa koordinat, hanya masuk tabel trafo')
        else:
            if g['id'] in gid_of.values():
                dobel.append((nama, g['n']))
            gid_of[nama] = g['id']; pakai += 1
        gid = g['id'] if g else None
        cap = sum(t['mva'] for t in v)
        w = lambda f: round(sum(t['mva'] * t[f] for t in v) / cap, 1) if cap else 0
        D['GL'].append([norm(nama).upper(), UNIT, len(v), round(cap, 1), w('ps'), w('pm'), max(max(t['ps'], t['pm']) for t in v), sum(1 for t in v if max(t['ps'], t['pm']) >= 80), gid])
        for t in v:
            D['TR'].append([norm(nama).upper(), UNIT, t['mva'], t['ps'], t['pm'], t['rs'], t['rm']])
    # beban harian per trafo: [id GI peta, nama GI, trafo, MVA, hari >=80%, siang[], malam[]]
    D['TD'] = [[gid_of.get(t['gi']), judul(t['gi']), t['trf'], t['mva'], t['h80'], t['si'], t['ma']] for t in T]
    D['HD'] = dict(bulan=bulan.title(), hari=hari, sumber='Beban trafo gardu induk, PLN Distribusi Jakarta')

    # hitung ulang ringkasan tiap GI dari semua trafonya (data lama + berkas ini)
    tr_gi = collections.defaultdict(list)
    for x in D['TR']:
        gid = gl_gid.get(x[0]) if x[1] != UNIT else None
        if x[1] == UNIT:
            gid = next((gid_of[k] for k in gid_of if norm(k).upper() == x[0]), None)
        if gid:
            tr_gi[gid].append(x)
    idx = {g['id']: g for g in D['GI']}
    for gid, v in tr_gi.items():
        g = idx[gid]
        if not any(x[1] == UNIT for x in v):
            continue
        cap = sum(x[2] for x in v)
        w = lambda i: round(sum(x[2] * x[i] for x in v) / cap, 1) if cap else 0
        g.update(cap=round(cap, 1), ps=w(3), pm=w(4), rs=w(5), rm=w(6), ntr=len(v), tmax=round(max(max(x[3], x[4]) for x in v), 1),
                 n80=sum(1 for x in v if max(x[3], x[4]) >= 80), par=0)
        g['ld'] = max(g['ps'], g['pm']); g['ldmax'] = g['tmax']
        if 'kode' not in g:
            g['kode'] = norm(g['n']).upper()[:12]
        g['up3'] = g.get('up3') or UNIT
        # profil harian GI: beban tertimbang kapasitas tiap hari (siang, malam) dan jumlah hari GI >= 80%
        tt = [t for t in T if gid_of.get(t['gi']) == gid]
        cp = sum(t['mva'] for t in tt)
        def prof(f):
            out = []
            for d in range(hari):
                a = [(t['mva'], t[f][d]) for t in tt if t[f][d] is not None]
                c = sum(x[0] for x in a)
                out.append(round(sum(x[0] * x[1] for x in a) / c) if c >= 0.5 * cp else None)
            return out
        g['hs'], g['hm'] = prof('si'), prof('ma')
        g['h80'] = sum(1 for a, b in zip(g['hs'], g['hm']) if max(a or 0, b or 0) >= 80)
        g['sm'] = len(tt)

    # depo: GI terdekat tanpa data → GI 20 kV berdata terdekat bila tidak jauh lebih jauh
    berdata = [g for g in D['GI'] if g.get('ld') is not None and g['v'].endswith('/20')]
    pindah = []
    for d in D['DP']:
        g0 = idx.get(d['gi_id'], {})
        if g0.get('ld') is not None:
            continue
        km, g = min(((hav(d['lat'], d['lon'], g['lat'], g['lon']), g) for g in berdata), key=lambda x: x[0])
        if km <= d['gi_km'] + TAMBAH_KM:
            pindah.append((d['id'], d['gi_n'], round(d['gi_km'], 1), g['n'], round(km, 1)))
            d.update(gi_id=g['id'], gi_n=g['n'], gi_km=round(km, 2), gi_v=g['v'], gi_mva=g.get('mva'), gi_lat=g['lat'], gi_lon=g['lon'])
    for d in D['DP']:
        g = idx.get(d['gi_id'], {})
        d['gi_ld'] = g.get('ld'); d['gi_ldmax'] = g.get('tmax')

    D['SRC'] = dict(beban='Beban trafo gardu induk PLN', ntr=len(D['TR']), ngi=len(D['GL']), peta=sum(1 for g in D['GI'] if g.get('ld') is not None))
    out = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
    assert '</script' not in out.lower()
    open(HTML, 'w', encoding='utf-8').write(s[:m.start(2)] + out + s[m.end(2):])
    print(f'bulan {bulan} · {hari} hari berdata · trafo berbeban {len(T)} · GI di berkas {len(by)} · dipetakan {pakai} (baru di peta {baru})')
    print('GI sama dipakai dua nama:', dobel)
    print(f'GI di peta dengan data beban: {sum(1 for g in D["GI"] if g.get("ld") is not None)} · dengan profil harian: {sum(1 for g in D["GI"] if g.get("hs"))}')
    print(f'depo dipindah ke GI berdata ({len(pindah)}):', pindah)
    print('depo dengan data beban GI:', sum(1 for d in D['DP'] if d['gi_ld'] is not None), '/', len(D['DP']))
    print('per provinsi:', {p: f"{sum(1 for d in D['DP'] if d['provinsi']==p and d['gi_ld'] is not None)}/{sum(1 for d in D['DP'] if d['provinsi']==p)}" for p in sorted(set(d['provinsi'] for d in D['DP']))})


if __name__ == '__main__':
    main(sys.argv[1])
