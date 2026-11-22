#!/usr/bin/env python3
"""Gabungkan beban trafo gardu induk (lembar ' TOTAL TRAFO ' laporan PLN UID Jabar, April 2022)
ke data tertanam di pantau_hdv_depo_gardu.html.

Pakai:  python3 -I tools/gabung_beban_gi.py beban_GI.xlsx

Yang dihitung per gardu induk (GI), dari semua trafonya di berkas:
  cap  = jumlah kapasitas trafo (MVA)
  ps   = beban tertinggi siang, tertimbang kapasitas (%)   pm = idem malam
  rs   = beban rata-rata siang (%)                          rm = idem malam
  ld   = beban puncak GI = max(ps, pm)
  tmax = beban puncak trafo yang paling padat (%)           n80 = jumlah trafo berbeban puncak >= 80%
Kode GI di berkas (BDUTR, CGRLG, ...) dicocokkan ke GI di peta lewat tabel PETA di bawah.
Kode yang tidak yakin cocok TIDAK dipetakan; trafo milik pelanggan (PT ...) dianonimkan sebagai 'KTT'.
"""
import sys, json, re, collections, warnings
import openpyxl
warnings.simplefilter('ignore')
HTML = 'pantau_hdv_depo_gardu.html'
# kode di berkas -> (nama GI di peta, tegangan di peta atau None)
PETA = {
 'ARJWN':('Arjawinangun','70/20'),'NARJW':('Arjawinangun Baru',None),'BBKAN':('Babakan',None),'BDSLN':('Bandung Selatan',None),'BDTMR':('Bandung Timur',None),
 'BDUTR':('Bandung Utara',None),'BGBRU':('Bogor Baru',None),'BGKTA':('Bogor Kota',None),'BNJAR':('Banjar',None),'CAMIS':('Ciamis',None),
 'CBATU':('Cibatu',None),'CBBAT':('Cibabat',None),'CBBRU':('Cibabat Baru',None),'CBDRU':('Cibadak Baru',None),'CBREM':('Cibeureum Baru',None),'CGRLG':('Cigereleng',None),
 'CIAWI':('Ciawi',None),'CIBNG':('Cibinong',None),'CIKRG':('Cikarang',None),'CKDNG':('Cikedung',None),'CKPAY':('Cikumpay',None),'CKSKA':('Cikasungka',None),
 'CLGSI':('Cileungsi','70/20'),'CLNSI2':('Cileungsi','150/20'),'CNJUR':('Cianjur',None),'CRBRU':('Ciratabaru','150/20'),'DGPKR':('Dagopakar',None),'DLTMS':('Deltamas',None),
 'DWUAN':('Dawuan',None),'FJSWA':('Fajar',None),'GARUT':('Garut',None),'GDBGE':('Gedebage',None),'GDMKR':('Gandamekar',None),'GDRIA':('Gandaria',None),'GNDUL':('Gandul',None),
 'HNDAH':('Harapan Indah',None),'HRGLS':('Haurgeulis',None),'IDMYU':('Indramayu','70/20'),'JBBKA':('Jababeka',None),'JTBRG':('Jatibarang',None),'JTNGN':('Jatirangon',None),
 'JUSIN':('Juishin',None),'KDBDK':('Kedungbadak',None),'KDPTN':('Kadipaten',None),'KMJNG':('Kamojang',None),'KRCAK':('Kracak',None),'KRCDG':('Kiaracondong',None),
 'KRNGL':('Karangnunggal',None),'KRPYG':('Kiarapayung',None),'KSBRU':('Kosambibaru',None),'KUNGN':('Kuningan',None),'LBSTU':('Lembursitu',None),'LEGOK':('Legok',None),
 'LGDAR':('Lagadar',None),'LIPPO':('Cikarang Lippo',None),'MDRCN':('Mandirancan',None),'MJLYA':('Majalaya',None),'MKRYA':('Margakarya',None),'MKSRI':('Mekarsari',None),
 'MLBNG':('Malangbong',None),'MLIGI':('Maligi',None),'NKDPT':('New Kadipaten',None),'NPCLR':('Poncol Baru II',None),'NTMBN':('New Tambun',None),'PBRAN':('Pabuaran',None),
 'PCBRU':('Poncol Baru',None),'PDKLP':('Pondok Kelapa',None),'PDLRU':('Padalarang Baru',None),'PGDRN':('Pangandaran',None),'PLTU PRTU':('PLTU Pelabuhan Ratu',None),
 'PMPEK':('Pameungpeuk',None),'PNSIA':('Panasia',None),'PNYGN':('Pinayungan',None),'PRKAN':('Parakan',None),'PRMYA':('Parungmulya',None),'PRURI':('Peruri',None),
 'PTUHA':('Patuha',None),'PWKTA':('Purwakarta',None),'RCKBA':('Rancakasumba',None),'RCKEK':('Rancaekek',None),'RDLOK':('Rengasdengklok',None),'RJPSI':('Rajapaksi',None),
 'SBANG':('Subang',None),'SKMDI':('Sukamandi',None),'SKTNI':('Sukatani','150/20'),'SMDNG':('Sumedang',None),'SMDRA':('Sumadra',None),'SMNRU':('Semen Baru',None),
 'SNTSA':('Santosa',None),'SNTUL':('Sentul',None),'SPONG':('Serpong',None),'SRAGI':('Sunyaragi',None),'TGHRG':('Tegalherang',None),
 'TGKSA':('Tiga Raksa',None),'TLJBE':('Telukjambe',None),'TMBUN':('Tambun',None),'TSBRU':('Tasikmalaya Baru',None),'TSMYA':('Tasikmalaya',None),'TTJBR':('Tata Jabar',None),
 'UBRNG':('Gardu Induk New Ujungberung-2',None),  # dikonfirmasi pemilik proyek: GI Ujungberung (5 trafo, 300 MVA) = entri ini di peta
}
# sengaja tidak dipetakan (GI tidak ada di peta, atau padanannya meragukan):
# BKASI, BNKOK, BRAGA, CMGIS, DPBR2, IDMRU, KTLPA, NUBRG, PRATU, RADEN, SSKAN
# BUNAR  (GI Bunar lama 2 x 30 MVA; di peta hanya ada "Bunar Baru" 120 MVA)
# SMRCN  (Summarecon Bekasi; di peta hanya ada Summarecon Serpong, Banten)
LUAR_JABAR = {'GDRIA': 'DKI Jakarta', 'GNDUL': 'DKI Jakarta', 'HNDAH': 'DKI Jakarta', 'JTNGN': 'DKI Jakarta', 'PDKLP': 'DKI Jakarta',
              'LEGOK': 'Banten', 'SPONG': 'Banten', 'TGKSA': 'Banten'}  # GI di perbatasan yang ikut memasok penyulang UID Jabar
num = lambda v: float(v) if isinstance(v, (int, float)) else 0.0
r1 = lambda v: None if v is None else round(v, 1)

def baca(xlsx):
    ws = openpyxl.load_workbook(xlsx, data_only=True, read_only=True)[' TOTAL TRAFO ']
    T = []
    for i, r in enumerate(ws.iter_rows(values_only=True), 1):
        if i < 15 or not isinstance(r[0], (int, float)) or not r[2]: continue
        T.append(dict(up3=str(r[1]).strip().title(), gi=str(r[2]).strip().upper(), trf=str(r[3]).strip(), mva=num(r[4]), kv=str(r[5]).strip(),
                      ps=num(r[8]), rs=num(r[10]), pm=num(r[12]), rm=num(r[14])))
    return T

def main(xlsx):
    T = baca(xlsx)
    s = open(HTML, encoding='utf-8').read()
    m = re.search(r'(<script type="application/json" id="d-core">)(.*?)(</script>)', s, re.S)
    D = json.loads(m.group(2))
    by = collections.defaultdict(list)
    for t in T: by[t['gi']].append(t)
    for g in D['GI']:
        for k in ('ld', 'ldmax', 'cap', 'ps', 'pm', 'rs', 'rm', 'tmax', 'n80', 'ntr', 'kode', 'up3', 'par'): g.pop(k, None)
    GL, TR, pakai = [], [], 0
    for kode, v in sorted(by.items()):
        cap = sum(t['mva'] for t in v); w = lambda f: sum(t['mva'] * t[f] for t in v) / cap if cap else 0
        a = dict(cap=round(cap, 1), ps=r1(w('ps')), pm=r1(w('pm')), rs=r1(w('rs')), rm=r1(w('rm')), ntr=len(v),
                 tmax=r1(max(max(t['ps'], t['pm']) for t in v)), n80=sum(1 for t in v if max(t['ps'], t['pm']) >= 80))
        a['ld'] = max(a['ps'], a['pm'])
        ktt = kode.startswith('PT')
        gid = None
        if kode in PETA:
            nama, teg = PETA[kode]
            prov = LUAR_JABAR.get(kode, 'Jawa Barat')
            cocok = [g for g in D['GI'] if g['n'] == nama and g['pr'] == prov and (g['v'] == teg if teg else g['v'].endswith('/20'))]
            if not cocok: sys.exit(f'GI peta tidak ditemukan untuk {kode}: {nama} {teg} {prov}')
            # beban berkas hanya sebagian trafo GI itu (GI perbatasan): tandai agar tidak dibaca sebagai beban seluruh GI
            a['par'] = 1 if (cocok[0].get('mva') and cap < 0.75 * cocok[0]['mva']) else 0
            for g in cocok:
                g.update(a); g['ldmax'] = a['tmax']; g['kode'] = kode; g['up3'] = v[0]['up3']
            gid = cocok[0]['id']; pakai += 1
        GL.append(['KTT' if ktt else kode, v[0]['up3'], a['ntr'], a['cap'], a['ps'], a['pm'], a['tmax'], a['n80'], gid])
        a.pop('par', None)
        for t in v:
            TR.append(['KTT' if ktt else kode, v[0]['up3'], t['mva']] + [round(t[f], 2) for f in ('ps', 'pm', 'rs', 'rm')])
    D['GL'], D['TR'] = GL, TR
    D['SRC'] = dict(beban='Beban trafo gardu induk, PLN UID Jawa Barat, April 2022', ntr=len(T), ngi=len(by), peta=pakai)
    idx = {g['id']: g for g in D['GI']}
    sebelum = sum(1 for d in D['DP'] if d.get('gi_ld') is not None)
    for d in D['DP']:
        g = idx.get(d['gi_id'], {})
        d['gi_ld'] = g.get('ld'); d['gi_ldmax'] = g.get('tmax')
    sesudah = sum(1 for d in D['DP'] if d.get('gi_ld') is not None)
    out = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
    assert '</script' not in out.lower()
    s = s[:m.start(2)] + out + s[m.end(2):]
    open(HTML, 'w', encoding='utf-8').write(s)
    print(f'trafo {len(T)} | kode GI {len(by)} | dipetakan ke peta {pakai} | GI peta berbeban {sum(1 for g in D["GI"] if g.get("ld") is not None)}')
    print(f'depo dengan data beban GI: {sebelum} -> {sesudah} dari {len(D["DP"])}')
    print('depo per provinsi (dengan data / semua):', {p: f"{sum(1 for d in D['DP'] if d['provinsi']==p and d['gi_ld'] is not None)}/{sum(1 for d in D['DP'] if d['provinsi']==p)}" for p in ('Jawa Barat', 'DKI Jakarta', 'Banten')})
    print('depo Jabar tanpa data:', [(d['id'], d['gi_n']) for d in D['DP'] if d['provinsi'] == 'Jawa Barat' and d['gi_ld'] is None])
    print('GI sebagian trafo:', [g['n'] for g in D['GI'] if g.get('par')])
    beda = [(k, PETA[k][0], a[3], idx[a[8]].get('mva')) for a in GL for k in [a[0]] if a[8] and idx[a[8]].get('mva') and abs(a[3] - idx[a[8]]['mva']) > 1]
    print('kapasitas berkas != kapasitas peta:', len(beda), beda[:12])
    tak = sorted(k for k in by if k not in PETA and not k.startswith('PT'))
    print('kode GI umum yang tidak dipetakan:', tak)

if __name__ == '__main__':
    main(sys.argv[1])
