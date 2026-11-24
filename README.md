# Pantau HDV Depo–Gardu

Dasbor pemantauan untuk pekerjaan survei truk berat (MDV/HDV) dan pemetaan depo–gardu induk. Tayang di https://hdvproject.vercel.app dan dikunci dengan kode akses.

## Isi situs

Satu halaman penuh dengan satu baris menu di atas (tanpa sub-menu). Tiap menu adalah satu halaman yang isinya bertumpuk; tiap angka hanya tampil di satu tempat.

| Menu | Isi |
|---|---|
| 🏭 Depo (halaman pertama) | Angka **114 depo** (klik → daftar depo layar penuh: kolom **▶ Mulai survei** di kiri, tombol **ℹ️ Detail** di tiap depo, filter lokasi/pola operasi/jenis usaha/bidang), peta dengan legenda berisi ringkasan tampilan peta, dan panel Ringkasan berisi diagram lingkar jarak ke GI, pola operasi, dan jenis usaha (klik irisan → daftar depo kelompok itu). Klik depo → popup dan kartu depo padat dengan **▶ Mulai survei** dan **ℹ️ Detail depo**. **Detail depo** punya dua menu: **Profil depo & kelistrikan** (profil usaha, gardu distribusi, penyulang, GI, beban harian) dan **Analisa** (skenario truk listrik, dampak ke jaringan, kesimpulan, rekomendasi). |
| ⚡ Grid | Selalu dibuka di halaman utama: angka gardu induk/trafo/gardu distribusi (klik → rinciannya), kesiapan sambungan A/B/C beserta artinya dan jarak ke GI, beban gardu distribusi terdekat, depo per provinsi dan kabupaten/kota (lengkap), beban gardu induk termasuk beban harian, statistik. Setiap angka, cincin, batang, dan irisan bisa diklik untuk membuka daftar depo di baliknya. |
| 💡 Rekomendasi | Satu layar: ringkasan skenario (jumlah depo, kebutuhan daya, energi per hari, porsi kapasitas GI), delapan kartu analisis bergambar (jarak dan kapasitas, ketersediaan data beban, pembebanan trafo, konsentrasi beban, alternatif GI, hasil penilaian skenario, profil beban malam, frekuensi beban puncak) yang masing-masing memuat angka kunci, grafik, temuan, dan rekomendasi serta bisa diklik untuk melihat deponya, dan delapan gardu induk tumpuan utama. |
| 🧭 Monitoring survei | Satu layar dengan pilihan menu: **🎯 Tracker survei** (halaman depan: batang menuju target truk × 7 hari, pool per pola operasi, kelas dan jenis truk, kemajuan tiap pool, 10 ketentuan RFP termasuk cakupan 8 komoditas utama dan 3 operator logistik besar; pool target bisa ditambah ✚ atau dikeluarkan ✓ dengan total 5–15 pool, bawaan 10 pool rencana, dan target 50 truk per pool ikut menyesuaikan), Jadwal & progres, Tugas per pool, **Hasil survei** (kesimpulan, kondisi operasi, charging, proyeksi, daya per pool, statistik), Lapor harian, Unduh data. **▶ Mulai survei** selalu khusus depo yang diklik: depo yang belum punya pool langsung dibuatkan pool sendiri dan formulir F1-nya dibuka (terisi dari data depo); depo yang sudah berjalan dibuka lagi. Formulir tampil sendiri dengan tombol **← Monitoring survei**. |

## Berkas

| Berkas | Fungsi |
|---|---|
| `pantau_hdv_depo_gardu.html` | Halaman utama: tampilan, peta, dan data depo–gardu yang tertanam. |
| `survei.js` | Entri formulir F1–F3 dan perhitungan Hasil survei. |
| `api/survey.js` | Penyimpanan entri survei di Vercel Blob. |
| `middleware.js` | Kunci situs dengan kode akses. |
| `tools/gabung_beban_gi.py` | Menggabungkan data beban GI (xlsx PLN) ke data yang tertanam di halaman. |
| `tools/gabung_beban_dki.py` | Menggabungkan data GI, trafo, dan beban harian trafo PLN Distribusi Jakarta (`DATA GI DAN TRAFO.xlsx`) ke data yang tertanam di halaman. Aman dijalankan ulang. |
| `tools/pilih_depo_berdata.py` | Mengisi beban gardu distribusi yang kosong dari berkas Excel. Bisa juga membatasi tampilan ke depo yang datanya ada; `--semua` menampilkan lagi seluruh depo dan gardu induk (keadaan sekarang). |
| `unduh.js` | Unduhan keluaran: peta depo & gardu (.shp dalam .zip, GeoJSON), satu berkas Excel banyak lembar, dan formulir kertas F1–F3. Tanpa pustaka luar. |
| `tests/` | Uji otomatis. Tidak ikut ter-deploy. |

## Mulai survei dari daftar depo

Buka rincian depo (klik angka depo di Dasbor), lalu tekan **Mulai survei** di kolom paling kiri dan pilih slot pool (P1–P10) atau pool baru. Formulir F1 pool itu langsung terisi dari data depo (nama, lokasi, koordinat, pola operasi, gardu induk terdekat), dan menu Survei ikut berubah: pool tercatat berjalan, daftar tugasnya muncul, dan kartu depo menampilkan kemajuan truk dan lembar diary. Di panel **Skenario** depo itu muncul kolom entri armada (MDV rigid, HDV rigid, HDV tractor + trailer, parkir malam) yang tersimpan ke F1; jumlah truk, jarak harian, dan waktu parkir skenario lalu diambil dari F1, F2, dan diary, dan sumber tiap angka ditulis di bawahnya. Depo yang belum disurvei memakai 50 truk sebagai angka awal dan menyebutnya begitu. Sambungan depo ↔ pool (`depo_id`) termasuk identitas rahasia: server hanya mengirimkannya ke pemegang PIN.

## Entri data

Entri data berurutan dalam satu pool: **1 Data pool → 2 Data truk → 3 Diary 7 hari**. Tiap langkah berwarna (hijau selesai, kuning sebagian, abu belum) dan langkah berikutnya diberi label **Isi ini dulu**. Semua langkah tetap bisa dibuka kapan saja.

- **Data pool (F1)** dibagi lima bagian yang bisa dilipat, masing-masing dengan hitungan isian. "Simpan, lanjut ke data truk" membuka langkah 2.
- **Data truk (F2)**: daftar truk pool ada di kiri, tiap truk dengan tujuh kotak hari berwarna. "＋ Truk baru" membuka formulir truk; yang wajib hanya kelas. "Simpan, lanjut isi diary" membuka diary truk itu.
- **Diary 7 hari (F3)**: hari dipilih dengan tombol 1–7. Jam bisa diketik `0730`; "Dari" baris berikutnya terisi dari "Ke"; baris baru muncul sendiri. "Simpan, lanjut" berpindah ke hari berikutnya, lalu ke truk berikutnya yang diary-nya belum lengkap.

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
- Dasbor menampilkan seluruh depo (114) dan gardu induk (939). Data beban ada untuk 172 gardu induk (566 trafo), termasuk beban harian 220 trafo di 76 GI Jakarta dan sekitarnya selama 23 hari November 2026; 62 depo (seluruh 36 depo DKI) sudah punya beban GI. Depo dan GI lainnya diberi kelas “Data beban menyusul”.
- Beban harian trafo (%) = arus beban ÷ arus maksimum trafo. Dua nilai di berkas sumber yang jelas salah ketik (GI CSW, 417% dan 158% di antara nilai ±70%) tidak dipakai; `tools/gabung_beban_dki.py` mencetak nilai yang dibuang.
- Enam GI di berkas belum ada di peta (Cawang Baru, JGC, Karet Baru, Ketapang, Mampang Lama, Sunter) dan ditambahkan dengan koordinat dari berkas. Empat GI dicocokkan lewat nama lain di peta (Ciracas, Cireundeu, Grogol Baru, Bintaro Baru); koordinat GI Ciracas di berkas sama dengan GI Cipinang.
- Warna kuota di peta memakai skenario 50 truk listrik per depo dan bersifat indikatif.
- Angka di panel Proyeksi memakai asumsi yang bisa diubah; nilai awalnya perkiraan umum, bukan angka resmi.

## Data sumber PLN

Berkas Excel sumber (`DATA GI DAN TRAFO.xlsx`, `beban GI.xlsx`, `Gardu_Beban_Lokasi_JABAR.xlsx`) **tidak lagi disimpan di repo** dan diabaikan lewat `.gitignore`. Simpan di luar repo dan beri jalurnya saat menjalankan skrip di `tools/`. Berkas itu masih ada di riwayat commit lama, dan data hasil olahannya tetap tertanam di halaman (di belakang kunci kode situs). Selama repo ini publik, data tersebut tetap bisa dibaca orang lain; jadikan repo **private** untuk menutupnya.

## Unduhan (menu Monitoring survei → Unduh data)

| Unduhan | Isi |
|---|---|
| Excel (.xlsx) | 13 lembar: diary harian, perjalanan, truk, pool, statistik survei (semua / kelas truk / pola operasi / pool), depo, statistik depo, gardu induk, trafo GI, gardu distribusi terdekat, sebaran gardu distribusi, kamus data. |
| Shapefile (.zip) | 5 lapisan WGS84: `depo`, `gardu_induk`, `gardu_distribusi_terdekat`, `gardu_distribusi_sebaran`, `transmisi`, masing-masing .shp/.shx/.dbf/.prj/.cpg, plus `BACA_SAYA.txt` berisi arti tiap atribut. |
| GeoJSON (.zip) | Lima lapisan yang sama. |
| Formulir cetak | F1 profil pool, F2 daftar truk, F3 diary harian (mendatar) untuk dicetak atau disimpan sebagai PDF. |
| CSV | Diary harian, perjalanan, truk, pool, kamus data, statistik. |
