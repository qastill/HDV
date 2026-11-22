# Pantau HDV Depo–Gardu

Dasbor pemantauan untuk pekerjaan survei truk berat (MDV/HDV) dan pemetaan depo–gardu induk. Tayang di https://hdvproject.vercel.app dan dikunci dengan kode akses.

## Isi situs

| Menu | Isi |
|---|---|
| Dasbor | Fakta dan progres: jumlah depo, gardu induk, cakupan data, kemajuan survei. Tidak memuat kesimpulan. |
| Peta | Depo (bulat) dan gardu induk (kotak) berwarna menurut kecukupan kuota GI, daftar depo yang bisa dicari. |
| Detail pool | Profil usaha, kondisi jaringan, skenario truk listrik, dan rekomendasi untuk satu depo. |
| Monitoring | Jadwal, progres per pool, lapor harian, gambaran depo–gardu, beban GI, statistik, daftar depo. |
| Hasil survei | Kesimpulan, kondisi operasi, analisis charging, proyeksi, daya per pool, statistik, unduh data. Dihitung dari entri F1–F3. |
| Entri data | Formulir F1–F3 untuk admin lapangan. |

## Berkas

| Berkas | Fungsi |
|---|---|
| `pantau_hdv_depo_gardu.html` | Halaman utama: tampilan, peta, dan data depo–gardu yang tertanam. |
| `survei.js` | Entri formulir F1–F3 dan perhitungan Hasil survei. |
| `api/survey.js` | Penyimpanan entri survei di Vercel Blob. |
| `middleware.js` | Kunci situs dengan kode akses. |
| `tools/gabung_beban_gi.py` | Menggabungkan data beban GI (xlsx PLN) ke data yang tertanam di halaman. |
| `beban GI.xlsx` | Data sumber: beban trafo gardu induk, PLN UID Jawa Barat, April 2022. Tidak ikut ter-deploy. |
| `Gardu_Beban_Lokasi_JABAR.xlsx` | Data sumber: beban dan lokasi gardu distribusi Jawa Barat. Tidak ikut ter-deploy. |
| `tests/` | Uji otomatis. Tidak ikut ter-deploy. |

## Pengaturan di Vercel

| Variabel | Fungsi | Bawaan |
|---|---|---|
| `SITE_CODE` | Kode akses situs | `1234` |
| `SURVEY_PIN` | PIN admin untuk mengunggah entri | `1234` |
| `BLOB_READ_WRITE_TOKEN` | Terisi otomatis saat gudang Vercel Blob disambungkan ke proyek | – |

Selama gudang Blob belum disambungkan, entri survei hanya tersimpan di perangkat yang mengisinya.

## Menjalankan uji

Perlu Node 18+ dan Playwright dengan Chromium.

```bash
npm install
```

```bash
bash tests/semua.sh
```

Uji kunci situs terhadap produksi:

```bash
bash tests/kunci-situs.sh
```

## Batasan data

- Kedua berkas Excel adalah data mentah PLN yang lebih rinci daripada yang ditampilkan dasbor. Berkasnya dikecualikan dari deploy lewat `.vercelignore`.
- Beban gardu induk hanya dari PLN UID Jawa Barat, April 2022. Depo di luar cakupan itu belum bisa dinilai.
- Warna kuota di peta memakai skenario 50 truk listrik per depo dan bersifat indikatif.
- Angka di panel Proyeksi memakai asumsi yang bisa diubah; nilai awalnya perkiraan umum, bukan angka resmi.
