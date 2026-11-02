# Draft Teks: Dari Masuk sampai Rencana Siap

Dokumen ini berisi semua teks yang tampil dari halaman **Masuk** sampai layar **Rencana siap**, sebelum pengguna masuk ke Beranda (`/app`). Urutannya mengikuti alur yang dilalui pengguna. Setiap bagian diberi keterangan singkat.

Catatan:
- Teks di dalam kurung siku `[ ]` berubah otomatis (nama, tanggal, angka).
- Nilai default seperti tanggal dan budget ditentukan aplikasi.

---

## Alur singkat

1. **Masuk** (`/masuk`): login atau daftar akun
2. **Sambutan** (`/mulai`, langkah 0)
3. **Detail pernikahan** (langkah 1)
4. **Alokasi budget** (langkah 2)
5. **Undang pasangan** (langkah 3)
6. **Menyusun rencana** (layar jeda)
7. **Rencana siap** (langkah 4), lalu masuk ke Beranda

---

## 1. Masuk

**Keterangan:** halaman login dan pendaftaran. Pengguna yang belum punya akun bisa mendaftar dari halaman yang sama.

### Bagian atas
- Logo: **Bridesmap**

### Judul dan penjelasan
- Mode masuk, judul: **Masuk ke rencana kalian**
- Mode daftar, judul: **Mulai rencana kalian**
- Penjelasan: Rencana kalian tersimpan di akun ini dan bisa dibuka dari perangkat mana pun.

### Form
- Label: **Email**
- Label: **Kata sandi**
- Petunjuk kata sandi (hanya mode daftar): Minimal 6 karakter.

### Tombol dan tautan
- Tombol utama: **Masuk** (mode masuk) atau **Daftar** (mode daftar)
- Tombol saat diproses: Memproses…
- Teks sebelum tautan: Belum punya akun? (mode masuk) atau Sudah punya akun? (mode daftar)
- Tautan: **Daftar** (mode masuk) atau **Masuk** (mode daftar)

### Pesan
- Email atau kata sandi salah: Email atau kata sandi salah.
- Email sudah terdaftar: Email ini sudah terdaftar. Coba masuk.
- Kata sandi kurang dari 6 karakter: Kata sandi minimal 6 karakter.
- Gagal lainnya: Gagal, coba lagi sebentar lagi.
- Setelah daftar, perlu konfirmasi email: Cek email kamu untuk konfirmasi, lalu kembali ke halaman ini untuk masuk.

---

## 2. Sambutan (langkah 0)

**Keterangan:** layar pembuka onboarding. Menjelaskan apa saja yang bisa dilakukan, cara mulainya, lalu tombol untuk memulai.

### Header
- Logo: **Bridesmap**
- Judul: Satu rencana, *untuk berdua.*
- Penjelasan: Dari budget dan vendor sampai undangan digital, semuanya ada di satu tempat.

### Jika pengguna sudah punya rencana
- Peringatan: Kalian sudah punya rencana untuk **[Nama A] & [Nama B]**. Membuat rencana baru akan menggantinya.

### Yang bisa kalian lakukan
Judul: **Yang bisa kalian lakukan**

| Fitur | Keterangan |
|---|---|
| Budget per acara | Bagi budget ke akad, resepsi, dan adat, lengkap dengan biaya tersembunyi. |
| Vendor & pembayaran | Catat DP, termin, dan pelunasan lengkap dengan bukti transfer. |
| Checklist 12 bulan | Tugas dari H-12 bulan sampai hari-H, bisa dikirim ke kalender. |
| Tamu & RSVP | Impor daftar tamu, kirim undangan per orang, pantau konfirmasinya. |
| Undangan digital | Pilih desain, isi dengan foto dan cerita kalian, lalu bagikan. |
| Momen berdua | Deep talk harian, surat untuk nanti, dan vision board bersama. |

### Cara mulainya
Judul: **Cara mulainya**

1. **Isi detail pernikahan**: Nama, tanggal, kota, budget, dan perkiraan jumlah tamu.
2. **Atur alokasi budget**: Tentukan porsi budget untuk tiap acara. Bisa diubah kapan saja.
3. **Undang pasangan**: Kirim tautan ke pasangan supaya kalian bisa mengatur rencana bersama.

### Tombol
- Tombol utama: **Mulai rencana kita**
- Keterangan kecil: Gratis. Butuh sekitar dua menit.
- Jika sudah punya rencana: **Buka rencana yang ada**

---

## 3. Detail pernikahan (langkah 1)

**Keterangan:** isian data dasar pernikahan. Tiga langkah ditampilkan sebagai garis progres di atas (1/3).

### Navigasi langkah
- Tombol kembali (aria): Kembali
- Penanda: 1/3

### Judul
- Eyebrow: **Detail pernikahan**
- Judul: Ceritakan tentang *hari kalian.*

### Nama
- Label: **Namamu** (placeholder: Rani)
- Label: **Nama pasangan** (placeholder: Dimas)

### Tanggal
- Label jika tanggal pasti: **Tanggal hari-H**
- Label jika perkiraan bulan: **Perkiraan bulan**
- Centang: Belum pasti, pakai perkiraan bulan saja
- Keterangan tanggal: [hari, tanggal] · [jumlah] hari lagi · **cek Hijriah & libur** (tautan)

### Jumlah tamu
- Judul: **Perkiraan jumlah tamu**
- Pilihan: <100 · 100–300 · 300–500 · 500+

### Acara yang direncanakan
- Judul: **Acara yang direncanakan**
- Pilihan dan keterangan:
  - **Lamaran**: Acara lebih kecil, katering paling besar
  - **Akad nikah**: Termasuk administrasi & izin
  - **Resepsi**: Acara terbesar
  - **Acara adat**: Siraman, midodareni, sangjit, dll.
- Keterangan: Budget otomatis dibagi per acara dan per kategori. Angkanya estimasi dan bisa kalian ubah (persen atau Rupiah).

### Budget
- Label: **Total budget**
- Keterangan: Belum yakin? Isi perkiraan dulu, bisa diubah kapan saja.

### Tombol
- **Lanjut**

---

### Jendela: Cek tanggal

**Keterangan:** pemeriksa tanggal yang terbuka dari langkah 1. Menampilkan tanggal Hijriah, hari libur, dan catatan musim nikah.

- Judul: **Cek tanggal**
- Penjelasan: Lihat tanggal Hijriah, hari libur nasional, dan pertimbangan musim nikah. Keputusan tanggal tetap milik kalian dan keluarga.
- Tombol navigasi (aria): Bulan sebelumnya, Bulan berikutnya
- Hari dalam minggu: Sen, Sel, Rab, Kam, Jum, Sab, Min
- Keterangan kalender:
  - Akhir pekan
  - Libur nasional
  - Ramadan
  - Angka kecil = tanggal Hijriah
- Tombol: **Batal**, **Pakai tanggal ini**
- Catatan kaki: Tanggal Hijriah dihitung dengan kalender Umm al-Qura dan bisa berbeda ±1 hari dari penetapan resmi. Hari libur mengikuti perkiraan SKB 3 Menteri.

**Catatan untuk tanggal yang dipilih:**
- Libur nasional: Libur nasional: [nama libur]. Tamu luar kota terbantu, tapi harga vendor & venue biasanya lebih tinggi.
- Akhir pekan: Akhir pekan — tamu lebih mudah datang. Venue cepat penuh, booking lebih awal.
- Bulan Ramadan: Bulan Ramadan — jarang dipilih untuk resepsi; katering & jam acara perlu menyesuaikan.
- Bulan Syawal: Bulan Syawal — musim nikah. Vendor cepat penuh dan harga cenderung naik.
- Bulan Dzulhijjah: Bulan Dzulhijjah — banyak pasangan memilih bulan ini; booking lebih awal.
- Bulan Muharram: Bulan Muharram (Suro) — sebagian keluarga Jawa menghindari menikah di bulan ini. Diskusikan dengan keluarga.
- Hari kerja biasa (jika tidak ada catatan): Hari kerja biasa. Harga vendor cenderung lebih fleksibel, tapi tamu mungkin perlu cuti.

---

## 4. Alokasi budget (langkah 2)

**Keterangan:** budget dibagi ke tiap acara, lalu tiap acara dibagi ke kategorinya. Pengguna bisa mengubah angka dalam persen atau Rupiah.

### Navigasi langkah
- Tombol kembali (aria): Kembali
- Penanda: 2/3

### Judul
- Eyebrow: **Alokasi budget**
- Judul: Atur pembagian *budget kalian.*
- Penjelasan: Kami bagi [total budget] ke [jumlah] acara dan tiap kategorinya. Angka ini estimasi awal. Ubah dalam persen atau Rupiah, dan bisa diubah lagi kapan saja.

### Editor total
- Label: **Total budget**
- Penanda: **Estimasi awal**
- Keterangan: Setelah selesai mengetik, semua acara & kategori ikut menyesuaikan dengan persentase yang sama.

### Ringkasan
- Label: Pembagian budget per acara (aria)
- Baris hidden cost: **Hidden cost** · [jumlah] · [persen]% dari total
- Tombol info hidden cost (aria): Apa itu hidden cost?
- Penjelasan hidden cost: Biaya yang sering terlupa tapi hampir selalu muncul, seperti [daftar biaya]. Kami sisihkan sebagian budget dari awal supaya tidak jadi kejutan di akhir. Pos-posnya bisa kalian pilih dan ubah sendiri.
- Status sisa budget:
  - Belum teralokasi: [jumlah]
  - Semua budget sudah teralokasi
  - Alokasi melebihi budget [jumlah] (peringatan)

### Daftar acara
Setiap acara punya tombol buka dan bisa diatur:
- Label: **Budget [nama acara]**
- Keterangan: Persentase terhadap total budget. Kategori di bawah ikut menyesuaikan.
- Label: **Per kategori**
- Keterangan kategori (status): Semua budget acara teralokasi / Belum teralokasi di acara ini / Kategori melebihi budget acara
- Keterangan total kategori: Total kategori: [persen]% dari budget acara
- Tombol: **Kembalikan ke default**
- Tombol: **Hapus acara** (konfirmasi)
- Peringatan jika masih ada vendor: "[nama acara]" masih punya vendor. Pindahkan atau hapus vendornya dulu.

### Kategori default
Daftar kategori yang muncul di tiap acara:
- Venue
- Katering
- Dekor & bunga
- MUA & busana
- Dokumentasi
- Undangan & cetak
- Transportasi & akomodasi keluarga
- Administrasi & izin
- Hiburan & lainnya
- Cadangan

### Jendela: Budget per acara
- Judul: **Budget [nama acara]**
- Keterangan: Persentase dihitung dari total budget [jumlah]. Kategori di dalam acara ikut menyesuaikan dengan persentase tetap.
- Tombol: **Selesai**

### Tambah acara
- Tombol: **Tambah acara**
- Judul form: **Tambah acara**
- Label: **Jenis acara**
- Label: **Nama acara (opsional)**. Petunjuk untuk acara adat: mis. Siraman, Midodareni, Sangjit
- Keterangan: Budget awalnya diambil dari yang belum teralokasi, dengan persentase default [jenis acara].
- Tombol: **Batal**, **Tambah**

### Tombol lanjut
- Peringatan (jika melebihi budget): Alokasi melebihi budget [jumlah]. Boleh lanjut, tapi sebaiknya disesuaikan.
- Tombol: **Buat rencana**

---

## 5. Undang pasangan (langkah 3)

**Keterangan:** layar untuk mengundang pasangan lewat WhatsApp. Pesan dikirim dari WhatsApp pengguna sendiri.

### Navigasi langkah
- Penanda: 3/3

### Judul
- Eyebrow: **Undang pasangan**
- Judul: Rencanakan *berdua.*
- Penjelasan: [Nama pasangan] bisa ikut mengisi budget, checklist, dan tamu di rencana yang sama.

### Form
- Label: **Nomor WhatsApp [Nama pasangan]**
- Awalan: +62
- Placeholder: 812 3456 7890

### Preview pesan
- Judul kecil: Preview pesan
- Isi pesan (otomatis): Hai [Nama pasangan]! Aku sudah mulai rencana pernikahan kita di Bridesmap. Yuk gabung supaya kita bisa atur bareng: [tautan undangan]

### Keterangan
- Pesan dikirim dari WhatsApp-mu sendiri. Sinkronisasi dua akun aktif setelah login tersedia.

### Tombol
- **Kirim lewat WhatsApp**
- **Salin tautan** (setelah disalin: **Tersalin**)
- **Nanti saja**

---

## 6. Menyusun rencana (layar jeda)

**Keterangan:** layar animasi singkat setelah undangan. Setiap bagian rencana "disusun" satu per satu sebelum ringkasan muncul.

### Judul
- Menyusun rencana *kalian berdua…*

### Empat bagian yang disusun
1. **Profil pernikahan**: Mencatat tanggal [tanggal] di [kota].
2. **Alokasi budget**: Membagi [total budget] ke [jumlah] acara dan kategorinya.
3. **Checklist & timeline**: Menyusun [jumlah] tugas dari H-12 bulan sampai hari-H.
4. **Ruang berdua**: Menyiapkan deep talk, surat untuk nanti, dan vision board.

### Status
- Persentase tiap bagian (contoh: 45%)
- Saat selesai: Selesai. Rencana kalian sudah siap.

---

## 7. Rencana siap (langkah 4)

**Keterangan:** ringkasan terakhir. Setelah tombol ditekan, pengguna masuk ke Beranda.

### Judul
- Eyebrow: **Rencana kalian siap**
- Angka besar: [jumlah] hari
- Judul: hari lagi, *[Nama A] & [Nama B].*

### Ringkasan (poin bertanda centang)
1. [jumlah] tugas sudah disusun per fase, mulai dari minggu ini
2. Budget [total] sudah dibagi ke [jumlah] acara dan tiap kategorinya (estimasi, bisa kalian ubah)
3. [jumlah tercentang] dari [jumlah total] hidden cost sudah masuk budget, sisanya siap kalian cek
4. Salah satu dari dua kondisi:
   - Jika undangan sudah dikirim: Undangan untuk [Nama pasangan] terkirim, menunggu dia bergabung
   - Jika belum: Undang [Nama pasangan] kapan saja dari Pengaturan

### Tombol dan catatan
- Tombol: **Buka rencana kami**
- Catatan kecil: Semua bisa diubah nanti dari Pengaturan

---

## Teks yang dipakai di banyak tempat

- Tombol kembali (aria): Kembali
- Tombol batal dan simpan: Batal, Simpan
- Tombol hapus: Hapus
- Penanda hari: [jumlah] hari lagi
- Label budget: Budget, Total budget, Estimasi awal
