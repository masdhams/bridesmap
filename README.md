# Bridesmap Wedding Planner

*Plan with intention. Celebrate your story.*

Web app (PWA, mobile-first) sesuai `../PRD Wedding Planner App.md`. Desain UI: `../desain ui/Bridesmap — UI Concept.html` (17 layar: 15 mobile 390px + landing desktop) — token di `src/index.css`, komponen di `src/components/`. Beranda desktop sengaja dipertahankan; Beranda mobile ada di `src/pages/app/MobileHome.tsx`.

Penyesuaian dari desain agar sesuai PRD §7 & #31: pengingat **WhatsApp otomatis** di desain diganti pengingat Google Calendar/.ics, dan "Ingatkan via WhatsApp" diganti kirim tautan RSVP manual lewat WhatsApp pengguna sendiri. Tombol "Daftar dengan email / Google" di onboarding belum ada karena login belum dibangun.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # hasil di dist/
```

Stack: React 19 + Vite + TypeScript + Tailwind CSS v4, zustand (state), date-fns, lucide-react, qrcode.

## Peta halaman

| Rute | Isi | PRD |
|---|---|---|
| `/` | Landing: masalah, pembeda, fitur, harga, FAQ | #11 |
| `/alat/*` | Kalkulator alokasi budget per acara (logika sama dengan #39), dan checklist — tanpa akun. Cek tanggal (Hijriah + libur) ada di langkah detail halaman `/mulai` | #25 |
| `/mulai` | Onboarding: sambutan → detail (nama, tanggal, tamu, acara, budget) → **atur alokasi budget per acara** → undang pasangan → rencana siap. Rencana lengkap baru dibuat setelah alokasi dikonfirmasi | #12, #39 |
| `/app` | Dashboard: countdown, budget, pembayaran terdekat, checklist, Deep Talk | — |
| `/app/budget` | Budget per kategori + biaya tersembunyi, ekspor PDF | #1, #9, #26 |
| `/app/budget/alokasi` | Alokasi budget per acara → per kategori, persen ↔ Rupiah saling menghitung ulang, sisa "belum teralokasi" & peringatan melebihi budget | #39 |
| `/app/vendor` | Shortlist vendor, termin DP/pelunasan, bukti transfer, kalender H-7 | #4, #10 |
| `/app/tabungan` | Target tabungan & estimasi tercapai | #2 |
| `/app/checklist` | 43 tugas H-12 bulan → hari-H, Google Calendar / .ics | #3, #37 |
| `/app/administrasi` | Dokumen nikah, KTP, kontrak vendor (tautan atau foto, tersimpan di perangkat); terhubung ke Checklist: semua dokumen sebuah tugas "sudah ada" → tugas selesai otomatis | — |
| `/app/tamu` | Tamu, RSVP, impor CSV/.vcf, batas 100 (Gratis), Smart RSVP | #5, #28, #31 |
| `/app/tempat-duduk` | Daftar meja + denah seret-lepas (Lengkap) | #29, #30 |
| `/app/seserahan`, `/app/rundown` | Seserahan per pihak, rundown akad/resepsi | #6, #7, #27 |
| `/app/deep-talk`, `/app/surat`, `/app/honeymoon`, `/app/vision-board` | Fitur emosional | #22–24, #34 |
| `/app/undangan` | Editor undangan digital: pilih template (Sage, Noir, Red Retro), isi mempelai, acara (otomatis dari rundown atau atur sendiri), kutipan & love story, foto (dikompres otomatis, slot mengikuti template), rekening & alamat kado. Pratinjau langsung di samping (layar ≥1280px). Logika penyusunan isi di `src/lib/invitation.ts`, data di `invitation` pada store | #33 |
| `/u/:slug` | Undangan milik pasangan dengan template pilihan. Tautan personal `?to=Nama&g=idTamu` dikirim dari halaman Tamu (salin tautan / Kirim WA); RSVP memperbarui status & jumlah tamu, ucapan masuk ke `wishes`. Masih hanya di perangkat ini sampai backend tersambung | #33 |
| `/undangan/sage` | Undangan digital template "Sage": sampul amplop terbuka (tanpa animasi) berisi 2 foto mempelai, tanggal acara di kartu, dan inisial pengantin di segel; lalu isi undangan (mempelai, love story, acara, peta, hitung mundur, galeri, RSVP, ucapan, hadiah). `?to=Nama` untuk nama tamu, `&langsung` melewati amplop. Data contoh di `src/data/invitations.ts`, aset di `public/undangan/sage/`. RSVP & ucapan masih di `localStorage` | #33 |
| `/undangan/noir` | Undangan digital template "Noir": minimalis mewah hitam arang dengan sorot lampu, warna mengikuti referensi "Minimalist Luxury". Sampul foto penuh, potret berbingkai ganda, kartu acara kaca, amplop digital, formulir ucapan + RSVP jadi satu. Data contoh `NOIR_DEMO`; logika bersama semua template di `src/pages/invitations/shared.ts` | #33 |
| `/undangan/red-retro` | Undangan digital template "Red Retro" (rute lama `/undangan/kliping` dialihkan ke sini): scrapbook kliping koran merah bata & kertas krem, font Oswald/Caveat/PT Serif, sampul bergeser ke atas saat dibuka, blok muncul/membesar saat di-scroll, stiker bergoyang. Stiker foto potongan dibaca otomatis dari `src/assets/red-retro/` (daftar nama file di README folder itu); yang belum ada tidak ditampilkan. Data contoh `RED_RETRO_DEMO` | #33 |

## Belum tersambung (butuh keputusan/akun)

- **Google Calendar** — backend kecil di `server/` (Express + SQLite) untuk mengirim tugas sebagai pengingat. Butuh `server/.env` diisi lebih dulu; cara menjalankan dan menguji ada di [`server/README.md`](server/README.md). Perintah: `npm run dev:server`.
- **Backend & login** — data saat ini di `localStorage` (sinkron antar-tab). Kolaborasi 2 akun real-time (#8) butuh backend, mis. Supabase. Lapisan data ada di `src/lib/store.ts`.
- **Google Calendar OAuth** — saat ini pakai tautan "tambah event" + file .ics (tanpa OAuth).
- **Konten placeholder** — nama pembuat, email, testimoni: `src/data/content.ts` (`LEGAL`, `TESTIMONIALS`). Hari libur 2026–2027 perkiraan: `src/data/calendar.ts`.
- **MVP-2** belum dibangun: save-the-date & undangan digital (#33), Wedding Inbox + AI (#35).

## Alokasi budget per acara (PRD v1.6, #39)

Logika ada di `src/lib/allocation.ts` (fungsi murni, dipakai app dan kalkulator gratis); tabel default dari PRD di `src/data/content.ts` (`ALLOCATION_DEFAULTS`).

- **Asumsi yang belum ada di PRD:** pembagian awal total budget *antar acara* memakai bobot Lamaran 8 · Akad 17 · Resepsi 60 · Adat 15 (`EVENT_KINDS.weight`). PRD hanya menetapkan persentase kategori di dalam tiap acara.
- Biaya tersembunyi yang dicentang dari awal disisihkan lebih dulu dari total; sisanya dibagi ke acara. "Cadangan" kini kategori di setiap acara (sesuai #39), jadi dihapus dari daftar biaya tersembunyi agar tidak dobel.
- Mengubah budget acara menskalakan kategorinya (persentase tetap, dibulatkan Rp 1.000). Mengubah kategori tidak mengubah budget acara. Total tidak dipaksa 100%.
