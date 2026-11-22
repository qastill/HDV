#!/usr/bin/env python3
"""Data dulu, baru depo: tampilkan hanya depo dan gardu induk yang datanya ada.

Pakai:  python3 -I tools/pilih_depo_berdata.py Gardu_Beban_Lokasi_JABAR.xlsx
        python3 -I tools/pilih_depo_berdata.py --semua      (tampilkan lagi semua depo dan gardu induk)

Yang dilakukan pada data tertanam di pantau_hdv_depo_gardu.html:
  1. Gardu induk (GI) yang punya data beban tetap di `GI`; sisanya dipindah ke `GIX` (tidak ditampilkan).
  2. Depo yang berada di wilayah data gardu distribusi tetap di `DP`; sisanya dipindah ke `DPX`.
  3. Tiap depo di `DP` dipasangkan ke GI berdata yang paling dekat.
  4. Depo yang gardu distribusi terdekatnya tidak punya ukuran beban diberi gardu berbeban terdekat dari berkas Excel.
Aman dijalankan ulang: `DPX` dan `GIX` digabung kembali sebelum dipilih lagi.
"""
import sys, json, re, math, warnings

HTML = 'pantau_hdv_depo_gardu.html'
RADIUS_M = 3000


def hav(a, b, c, d):
    r = math.pi / 180
    x = math.sin((c - a) * r / 2) ** 2 + math.cos(a * r) * math.cos(c * r) * math.sin((d - b) * r / 2) ** 2
    return 12742 * math.asin(math.sqrt(x))


def num(v):
    return v if isinstance(v, (int, float)) else None


def gardu_berbeban(xlsx, depo):
    """Untuk tiap depo di `depo`, cari gardu distribusi terdekat yang koordinatnya sah dan punya persen beban."""
    import openpyxl
    warnings.simplefilter('ignore')
    wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
    it = wb['DATA_GARDU'].iter_rows(values_only=True)
    ix = {h: i for i, h in enumerate(next(it))}
    best = {d['id']: None for d in depo}
    for r in it:
        la, lo = num(r[ix['LATITUDE']]), num(r[ix['LONGITUDE']])
        if la is None or lo is None or r[ix['STATUS_KOORDINAT']] != 'VALID':
            continue
        flag = str(r[ix['FLAG_ANOMALI']] or '')
        if 'KOORDINAT' in flag or 'KAPASITAS' in flag:
            continue
        if num(r[ix['PERSEN_BEBAN']]) is None or num(r[ix['KAPASITAS_KVA']]) is None:
            continue
        for d in depo:
            if abs(la - d['lat']) > 0.03 or abs(lo - d['lon']) > 0.03:
                continue
            m = hav(d['lat'], d['lon'], la, lo) * 1000
            if m <= RADIUS_M and (best[d['id']] is None or m < best[d['id']][0]):
                best[d['id']] = (m, {k: r[i] for k, i in ix.items()})
    wb.close()
    return best


def main():
    s = open(HTML, encoding='utf-8').read()
    m = re.search(r'(<script type="application/json" id="d-core">)(.*?)(</script>)', s, re.S)
    D = json.loads(m.group(2))
    gi = D['GI'] + D.get('GIX', [])
    dp = D['DP'] + D.get('DPX', [])
    if '--semua' in sys.argv:
        # Semua depo dan gardu induk ditampilkan lagi; pengisian yang sudah dilakukan pada depo berdata tetap dipakai.
        D['GI'], D['DP'] = sorted(gi, key=lambda g: g['id']), sorted(dp, key=lambda d: d['id'])
        D.pop('GIX', None); D.pop('DPX', None)
        out = json.dumps(D, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
        open(HTML, 'w', encoding='utf-8').write(s[:m.start(2)] + out + s[m.end(2):])
        print(f"Semua ditampilkan: {len(D['GI'])} gardu induk, {len(D['DP'])} depo")
        return
    D['GI'] = [g for g in gi if g.get('ld') is not None]
    D['GIX'] = [g for g in gi if g.get('ld') is None]
    D['DP'] = sorted([d for d in dp if d.get('gd_nama')], key=lambda d: d['id'])
    D['DPX'] = sorted([d for d in dp if not d.get('gd_nama')], key=lambda d: d['id'])

    for d in D['DP']:
        km, g = min(((hav(d['lat'], d['lon'], g['lat'], g['lon']), g) for g in D['GI']), key=lambda x: x[0])
        if d.get('gi_id') != g['id']:
            print(f"  {d['id']}: GI {d.get('gi_n')} -> {g['n']} ({km:.1f} km)")
        d.update(gi_id=g['id'], gi_n=g['n'], gi_km=round(km, 2), gi_v=g.get('v'), gi_mva=g.get('mva'), gi_lat=g['lat'], gi_lon=g['lon'])

    kosong = [d for d in D['DP'] if d.get('gd_beban_pct') is None]
    if kosong:
        if len(sys.argv) < 2:
            sys.exit('Ada depo tanpa beban gardu; beri berkas Gardu_Beban_Lokasi_JABAR.xlsx sebagai argumen.')
        hasil = gardu_berbeban(sys.argv[1], kosong)
        for d in kosong:
            if not hasil[d['id']]:
                print(f"  {d['id']}: tidak ada gardu berbeban dalam {RADIUS_M} m")
                continue
            jarak, r = hasil[d['id']]
            siang, malam, daya = num(r['GI_PERSEN_SIANG']), num(r['GI_PERSEN_MALAM']), num(r['GI_DAYA_MVA'])
            print(f"  {d['id']}: gardu {d.get('gd_nama')} -> {r['NAMA_GARDU']} ({jarak:.0f} m, {r['PERSEN_BEBAN']:.1f}%)")
            d.update(gd_nama=str(r['NAMA_GARDU']), gd_kode=str(r['KODE_GARDU']), gd_jarak_m=round(jarak), gd_kva=r['KAPASITAS_KVA'],
                     gd_beban_pct=round(r['PERSEN_BEBAN'], 1), gd_kategori=r['KATEGORI_BEBAN'],
                     penyulang=r['PENYULANG'] or '', gi_nama=r['GARDU_INDUK'] or '', gi_trafo_mva=daya,
                     gi_siang_pct=round(siang, 1) if siang is not None else None, gi_malam_pct=round(malam, 1) if malam is not None else None,
                     gi_sisa_mva=round(daya * (1 - max(siang, malam or 0) / 100), 1) if daya and siang is not None else None,
                     gd_lat=r['LATITUDE'], gd_lon=r['LONGITUDE'])

    out = json.dumps(D, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    open(HTML, 'w', encoding='utf-8').write(s[:m.start(2)] + out + s[m.end(2):])
    lengkap = sum(1 for d in D['DP'] if d.get('gd_beban_pct') is not None)
    print(f"GI ditampilkan {len(D['GI'])} (disisihkan {len(D['GIX'])}); depo ditampilkan {len(D['DP'])} (disisihkan {len(D['DPX'])}); beban gardu terisi {lengkap}/{len(D['DP'])}")


if __name__ == '__main__':
    main()
