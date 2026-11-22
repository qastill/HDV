# Pantau HDV Depo–Gardu

Dasbor pemantauan untuk pekerjaan survei truk berat (MDV/HDV) dan pemetaan depo–gardu induk. Tayang di https://hdvproject.vercel.app dan dikunci dengan kode akses.

## Isi situs

| Menu | Isi |
|---|---|
| Dasbor | Empat angka utama yang bisa diklik untuk rinciannya (depo, gardu induk, trafo, gardu distribusi), peta depo dan gardu induk berwarna menurut kecukupan kuota, ringkasan sebaran, daftar depo, serta detail tiap depo: profil dan jaringan, skenario truk listrik, rekomendasi. |
| Monitoring | Jadwal, progres per pool, lapor harian, gambaran depo–gardu, beban GI, statistik, daftar depo. |
| Survei | Hasil survei (kesimpulan, kondisi operasi, analisis charging, proyeksi, daya per pool, statistik, unduh data) dan entri formulir F1–F3 dalam satu halaman. |

## Berkas

| Berkas | Fungsi |
|---|---|
| `pantau_hdv_depo_gardu.html` | Halaman utama: tampilan, peta, dan data depo–gardu yang tertanam. |
| `survei.js` | Entri formulir F1–F3 dan perhitungan Hasil survei. |
| `api/survey.js` | Penyimpanan entri survei di Vercel Blob. |
| `middleware.js` | Kunci situs dengan kode akses. |
| `tools/gabung_beban_gi.py` | Menggabungkan data beban GI (xlsx PLN) ke data yang tertanam di halaman. |
| `tools/pilih_depo_berdata.py` | Memilih depo dan gardu induk yang datanya ada, memasangkan depo ke GI berdata terdekat, dan mengisi beban gardu distribusi yang kosong. |
| `beban GI.xlsx` | Data sumber: beban trafo gardu induk. Tidak ikut ter-deploy. |
| `Gardu_Beban_Lokasi_JABAR.xlsx` | Data sumber: beban dan lokasi gardu distribusi. Tidak ikut ter-deploy. |
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
- Dasbor hanya menampilkan depo dan gardu induk yang tercakup data beban: 25 depo dan 101 gardu induk. Depo dan GI lain tetap tersimpan di data tertanam (`DPX`, `GIX`) dan muncul lagi bila data bebannya ditambahkan lalu `tools/pilih_depo_berdata.py` dijalankan ulang.
- Warna kuota di peta memakai skenario 50 truk listrik per depo dan bersifat indikatif.
- Angka di panel Proyeksi memakai asumsi yang bisa diubah; nilai awalnya perkiraan umum, bukan angka resmi.
