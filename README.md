# Pantau HDV Depo–Gardu

Dasbor pemantauan untuk pekerjaan survei truk berat (MDV/HDV) dan pemetaan depo–gardu induk. Tayang di https://hdvproject.vercel.app dan dikunci dengan kode akses.

## Isi situs

| Menu | Isi |
|---|---|
| Dasbor | Tiga angka utama yang bisa diklik untuk rinciannya (depo, gardu induk beserta trafonya, gardu distribusi), peta seluruh depo dan gardu induk berwarna menurut kecukupan kuota, ringkasan sebaran, daftar depo, serta detail tiap depo: profil dan jaringan, skenario truk listrik, rekomendasi, dan tombol **Mulai survei**. |
| Monitoring | Jadwal, progres per pool, lapor harian, gambaran depo–gardu, beban GI, statistik, daftar depo. |
| Survei | Daftar tugas menurut RFP, hasil survei (kesimpulan, kondisi operasi, analisis charging, proyeksi, daya per pool, statistik, unduh data) dan entri formulir F1–F3 dalam satu halaman. |

## Berkas

| Berkas | Fungsi |
|---|---|
| `pantau_hdv_depo_gardu.html` | Halaman utama: tampilan, peta, dan data depo–gardu yang tertanam. |
| `survei.js` | Entri formulir F1–F3 dan perhitungan Hasil survei. |
| `api/survey.js` | Penyimpanan entri survei di Vercel Blob. |
| `middleware.js` | Kunci situs dengan kode akses. |
| `tools/gabung_beban_gi.py` | Menggabungkan data beban GI (xlsx PLN) ke data yang tertanam di halaman. |
| `tools/pilih_depo_berdata.py` | Mengisi beban gardu distribusi yang kosong dari berkas Excel. Bisa juga membatasi tampilan ke depo yang datanya ada; `--semua` menampilkan lagi seluruh depo dan gardu induk (keadaan sekarang). |
| `beban GI.xlsx` | Data sumber: beban trafo gardu induk. Tidak ikut ter-deploy. |
| `Gardu_Beban_Lokasi_JABAR.xlsx` | Data sumber: beban dan lokasi gardu distribusi. Tidak ikut ter-deploy. |
| `tests/` | Uji otomatis. Tidak ikut ter-deploy. |

## Mulai survei dari kartu depo

Klik satu depo di peta, lalu tekan **Mulai survei** di kartu atau detailnya dan pilih slot pool (P1–P10). Formulir F1 pool itu langsung terisi dari data depo (nama, lokasi, koordinat, pola operasi, gardu induk terdekat), dan menu Survei ikut berubah: pool tercatat berjalan, daftar tugasnya muncul, dan kartu depo menampilkan kemajuan truk dan lembar diary. Di panel **Skenario** depo itu muncul kolom entri armada (MDV rigid, HDV rigid, HDV tractor + trailer, parkir malam) yang tersimpan ke F1; jumlah truk, jarak harian, dan waktu parkir skenario lalu diambil dari F1, F2, dan diary, dan sumber tiap angka ditulis di bawahnya. Depo yang belum disurvei memakai 50 truk sebagai angka awal dan menyebutnya begitu. Sambungan depo ↔ pool (`depo_id`) termasuk identitas rahasia: server hanya mengirimkannya ke pemegang PIN.

## Entri data

Tab pertama adalah **F3 · Diary harian** dan langsung bisa diisi. Truk yang belum terdaftar dipilih lewat “＋ Truk baru”: cukup pilih kelas MDV/HDV, truknya terdaftar di F2 saat lembar disimpan. Jam bisa diketik `0730` atau `07.30`; kolom “Dari” baris berikutnya terisi otomatis dari “Ke”, dan baris baru muncul sendiri.

Pool tidak terbatas pada P1–P10. Kotak **Pool** bisa dicari: pilih pool survei, pilih salah satu depo di peta (pool baru tersambung ke depo itu), atau ketik nama pool yang belum terdata. Pool baru diberi kode `N` + 4 huruf/angka acak (misalnya `NK3F9`) supaya dua perangkat yang bekerja luring tidak membuat kode yang sama; nama pool tetap rahasia bagi pengunjung tanpa PIN.

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
- Dasbor menampilkan seluruh depo (114) dan gardu induk (933). Data beban baru ada untuk 101 gardu induk (346 trafo) dan gardu distribusi di sekitar 25 depo; depo dan GI lainnya diberi kelas “Data beban menyusul” sampai datanya ditambahkan lewat `tools/gabung_beban_gi.py`.
- Warna kuota di peta memakai skenario 50 truk listrik per depo dan bersifat indikatif.
- Angka di panel Proyeksi memakai asumsi yang bisa diubah; nilai awalnya perkiraan umum, bukan angka resmi.
