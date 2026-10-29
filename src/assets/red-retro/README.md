# Stiker template undangan "Red Retro"

Taruh gambar di folder ini dengan nama persis seperti di bawah. Template otomatis menampilkannya;
file yang belum ada tidak ditampilkan (bagian yang punya pengganti CSS memakai penggantinya).

Gaya umum: ilustrasi/foto vintage realistis, warna agak pudar seperti cetakan lama, latar **transparan**
(PNG/WebP). Simpan sudah dikompres (WebP kualitas ±80–85).

## Sudah terpasang

| File | Isi |
|---|---|
| `kiss.webp` | Bekas lipstik merah, stiker die-cut bertepi krem |
| `cassette.webp` | Kaset pita "High Fidelity", stiker die-cut |
| `roller-skate.webp` | Sepatu roda putih bergaris merah, stiker die-cut |
| `taxi.webp` | Taksi kuning klasik, stiker die-cut |
| `street-lamp.webp` | Tiang lampu jalan klasik, stiker die-cut |
| `telephone.webp` | Telepon putar merah, stiker die-cut |
| `love-letter.webp` | Amplop surat cinta berisi hati, di sudut buku "Untuk Kamu" |
| `mug.webp` | Cangkir kotak-kotak merah, Kisah Kami |
| `stamp-romance.webp` | Prangko "Romance", Acara |
| `instant-camera.webp` | Kamera instan merah, Galeri |
| `envelope-cream.webp` | Amplop krem berhati, RSVP |
| `envelope-red.webp` | Amplop merah berhati, Tanda Kasih |
| `roses.webp` | Mawar merah berpita, Penutup |
| `red-book.webp` | Buku merah "The Next Chapter", Save the Date |
| `memo-clip.webp` | Kertas memo dijepit klip merah, kalender Save the Date (dimuat langsung) |
| `gingham-hearts.webp` | Dua hati kotak-kotak, Acara |
| `old-book.webp` | Buku tua terbuka dengan polaroid di halaman kanan (bagian "Untuk Kamu"); foto pasangan ditaruh di jendela polaroid, halaman kiri dibiarkan kosong. Dimuat langsung oleh komponen buku |
| `tear-up-1..3.webp`, `tear-down-1..2.webp` | Kertas sobek merah untuk pergantian bagian (PNG asli, hanya dipotong). *up* = tepi sobek di atas (masuk ke bagian merah), *down* = tepi sobek di bawah (masuk ke bagian krem). Latar bagian merah disamakan dengan median merah badan kertas ini: `#992215` (rata, tanpa tekstur); tepi badan kertas yang setengah transparan sudah dipotong |
| `cover-notebook.webp` + `cover-tape.webp` | Komposisi sampul (buku kraft, kertas kusut, sobekan koran) dan selotipnya sebagai lapisan atas foto. Dimuat langsung oleh sampul, bukan lewat daftar stiker |

**Aturan:** setiap stiker hanya dipakai **satu kali** di seluruh undangan. Kertas kusut dan sobekan koran sudah ada di gambar sampul, jadi tidak dipakai lagi di bagian lain.

Hindari stiker bermerek atau berkarakter berhak cipta (logo minuman, sepatu bermerek, tokoh kartun, kartu permainan bermerek)
karena template ini dipakai banyak pasangan.

## Spesifikasi untuk penggantian

Bagian di bawah ini dipertahankan sebagai acuan bila kedua gambar kertas ingin diganti.

### `crumpled-paper.webp` — lembar kertas kusut (bukan bola)
- **Bentuk:** satu lembar kertas HVS putih tulang yang pernah diremas lalu dibuka lagi, **datar**, berlipat-lipat halus.
- **Orientasi & rasio:** potret ±3:4, misalnya 600×800 px.
- **Tepi:** tepi kertas asli (sedikit tidak rata), **tanpa** bingkai stiker krem/putih.
- **Warna:** putih keabuan dengan bayangan lipatan abu lembut; tanpa tulisan.
- **Dipakai di:** belakang buku catatan kraft di sampul dan di Save the Date, sedikit miring, menyembul di sisi kanan.

### `newspaper-strip.webp` — pita koran selebar layar
- **Bentuk:** potongan koran panjang mendatar yang mengisi **penuh** dari kiri ke kanan (tepi kiri dan kanan lurus terpotong rapi).
- **Rasio:** ±5:1, misalnya 1500×300 px.
- **Tepi:** hanya tepi **atas** yang sobek bergerigi; tepi bawah lurus. **Tanpa** bingkai stiker.
- **Isi:** halaman koran lama berwarna sepia/abu dengan banyak kolom teks kecil; boleh satu judul pendek di tengah, sebaiknya tanpa teks bahasa lain yang mencolok.
- **Dipakai di:** dasar sampul (paling bawah), menggantikan tiruan koran dari CSS.
