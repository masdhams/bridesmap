# Server Bridesmap (Google Calendar)

Backend kecil (Node.js + Express + SQLite) untuk mengirim tugas ke Google Calendar. Berjalan di `http://localhost:3000`; frontend Vite (`http://localhost:5173`) memanggilnya lewat proxy `/api`.

> **Server baru bisa dijalankan setelah `server/.env` diisi.** Tanpa itu, `npm run dev:server` berhenti dengan pesan variabel mana yang masih kosong.

## Cara menjalankan

1. Salin `server/.env.example` menjadi `server/.env`, lalu isi:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: dari Google Cloud Console (langkah di bawah).
   - `GOOGLE_REDIRECT_URI`: biarkan `http://localhost:3000/auth/google/callback`.
   - `TOKEN_ENCRYPTION_KEY`: 32 byte acak, buat dengan
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
     Simpan baik-baik: kalau berubah, token yang sudah tersimpan tidak bisa dibaca dan kalender harus dihubungkan ulang.
2. Terminal 1: `npm run dev:server`
3. Terminal 2: `npm run dev`

### Membuat kredensial Google (sekali saja)

1. Di [Google Cloud Console](https://console.cloud.google.com/), buat project, lalu aktifkan **Google Calendar API**.
2. **OAuth consent screen**: tipe External, tambahkan akunmu sebagai **Test user**.
3. **Credentials → Create credentials → OAuth client ID**, tipe **Web application**. Pada *Authorized redirect URIs* isi persis `http://localhost:3000/auth/google/callback`.
4. Salin Client ID dan Client secret ke `server/.env`. Jangan menaruh file `client_secret_*.json` di dalam proyek ini kecuali sudah di-ignore (sudah ada di `.gitignore`).

## Langkah uji

1. Buka `http://localhost:5173/app/pengaturan`. Kartu **Google Calendar** menampilkan "Server kalender belum berjalan" bila server mati, dan tombol **Hubungkan** bila server hidup.
2. Klik **Hubungkan Google Calendar**, setujui izin. Kamu kembali ke Pengaturan dengan keterangan "terhubung". Di Google Calendar muncul kalender baru bernama **Bridesmap**.
3. Klik **Sinkronkan sekarang**. Tugas yang belum selesai muncul sebagai acara seharian dengan pengingat pukul 09.00. Sinkron kedua tanpa perubahan tidak membuat acara baru.
4. Centang satu tugas selesai, ubah tanggal hari-H, atau tambah tugas, lalu sinkron lagi. Acara diperbarui atau dihapus sesuai perubahan.
5. Klik **Putuskan**. Refresh token dihapus dari database. Acara yang sudah terkirim tetap ada di Google; hapus kalender "Bridesmap" di Google Calendar bila tidak diperlukan.

Cek lewat terminal (opsional):

```bash
curl http://localhost:3000/api/calendar/status
```

## Endpoint

| Metode | Path | Fungsi |
| --- | --- | --- |
| GET | `/api/calendar/connect` | Redirect ke Google OAuth (`calendar.app.created`, `access_type=offline`, `prompt=consent`) |
| GET | `/auth/google/callback` | Tukar kode jadi token, simpan refresh token terenkripsi, redirect ke `http://localhost:5173/app/pengaturan?kalender=…` |
| GET | `/api/calendar/status` | `{ connected }` |
| POST | `/api/calendar/sync` | Body `{ tasks: [{ id, title, dueDate, reminderDaysBefore }] }`; insert / patch / delete mengikuti daftar |
| DELETE | `/api/calendar/disconnect` | Hapus refresh token dan pemetaan acara |

## Catatan keamanan

- Refresh token dienkripsi AES-256-GCM dan tidak pernah dikirim ke frontend. Rahasia hanya dibaca dari `server/.env` saat runtime dan tidak dicatat di log.
- Scope `calendar.app.created`: aplikasi hanya bisa mengelola kalender yang ia buat sendiri. Kalender pribadimu tidak bisa dibaca atau diubah.
- Yang dikirim ke Google hanya judul tugas dan tanggal, tanpa nominal budget.
- Database `server/bridesmap.sqlite` dibuat otomatis dan sudah di-ignore git.
- Aplikasi belum punya login, jadi server hanya mendukung **satu** sambungan kalender dan hanya mendengarkan `127.0.0.1`. Sebelum dipasang di internet, tambahkan login dan HTTPS lebih dulu.
