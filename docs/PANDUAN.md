# LinkNyaMana — Panduan Lengkap

## Apa itu LinkNyaMana?

LinkNyaMana adalah **dashboard monitoring & manajemen website** yang dibuat untuk memantau ratusan domain secara otomatis. Sistem ini mengecek apakah website online/offline, melacak masa aktif domain, memantau progress setup WordPress, dan mengirim notifikasi saat domain akan expired.

### Tujuan Utama

1. **Monitoring Uptime** — Cek otomatis setiap 15 menit apakah semua website masih online
2. **Manajemen Domain** — Kelola ratusan domain dalam satu dashboard dengan kategori
3. **Tracking Expiry** — Pantau tanggal expired domain, terima notifikasi sebelum kadaluarsa
4. **WordPress Setup** — Lacak progress setup WordPress per domain dengan checklist 22 langkah
5. **Kolaborasi Tim** — Bagi akses per kategori domain ke masing-masing anggota tim

---

## Cara Login

1. Buka website LinkNyaMana di browser
2. Masukkan **Username** dan **Password** yang diberikan admin
3. Klik **Masuk**

> Jika lupa password, hubungi admin untuk reset password dari menu Manajemen User.

---

## Role & Hak Akses

Setiap user punya salah satu dari 3 role:

| Fitur | Admin | Editor | Viewer |
|-------|:-----:|:------:|:------:|
| Lihat domain yang di-assign | Ya | Ya | Ya |
| Klik domain untuk detail | Ya | Ya | Ya |
| WordPress checklist (centang tugas) | Ya | Ya | Tidak |
| Tambah/edit/hapus domain | Ya | Tidak | Tidak |
| Tambah/hapus kategori | Ya | Tidak | Tidak |
| Arsipkan domain | Ya | Tidak | Tidak |
| Edit tanggal registrasi/expired | Ya | Tidak | Tidak |
| Auto-fill WHOIS | Ya | Tidak | Tidak |
| Import/export CSV | Ya | Tidak | Tidak |
| Kirim notifikasi expiry | Ya | Tidak | Tidak |
| Manajemen user | Ya | Tidak | Tidak |
| Setting notifikasi (email/Telegram) | Ya | Tidak | Tidak |
| Ganti password sendiri | Ya | Ya | Ya |
| Dark mode | Ya | Ya | Ya |

**Admin** bisa mengakses semua domain. **Editor** hanya bisa mengakses domain dari kategori yang di-assign oleh admin.

---

## Dashboard Utama

Setelah login, kamu akan melihat:

### Sidebar (Kiri)

- **Semua Domain** — Tampilkan semua domain yang kamu punya akses
- **Daftar Kategori** — Klik kategori untuk filter (contoh: Ambulance, Rental Motor, Al Quran)
- **Arsip** — Lihat domain yang sudah diarsipkan
- **Kelola** (Admin) — Menu untuk tambah domain/kategori, import/export, report, notifikasi, user management
- **Footer** — Tombol ganti password, dark/light mode, logout

### Area Utama (Kanan)

- **Status Summary** — Jumlah domain total, online, offline, expiring
- **Search** — Ketik nama domain untuk cari (shortcut: tekan `/`)
- **Filter** — Filter berdasarkan status (online/offline) atau waktu expiry (7/14/30 hari)
- **Sort** — Urutkan domain berdasarkan status, tanggal expired, atau nama
- **Analytics** — Klik "Tampilkan Analytics" untuk lihat grafik uptime trend, progress per kategori, dan distribusi status
- **Domain Cards** — Kartu per domain menampilkan status, response time, progress bar, dan tanggal expired

---

## Cara Cek Status Domain

Status domain dicek **otomatis setiap 15 menit** oleh sistem (Cloudflare Cron). Kamu juga bisa:

1. **Refresh manual** — Klik tombol refresh di Status Summary (atau tekan `r`)
2. **Deep check** — Klik kartu domain untuk membuka detail, sistem otomatis melakukan deep check

### Arti Status

| Status | Warna | Artinya |
|--------|-------|---------|
| Online | Hijau | Website bisa diakses dan berjalan normal |
| Offline | Merah | Website tidak bisa diakses, suspended, expired, atau error |
| Checking | Kuning | Sedang dalam proses pengecekan |

### Response Time

Angka di kartu domain (contoh: `245ms`) menunjukkan kecepatan respon server:
- **Hijau (<500ms)** — Cepat
- **Kuning (500-2000ms)** — Agak lambat
- **Merah (>2000ms)** — Lambat

---

## WordPress Setup Checklist

Setiap domain memiliki checklist 22 langkah setup WordPress yang harus diselesaikan:

1. Klik kartu domain untuk buka detail
2. Scroll ke bawah ke bagian **WordPress Setup Checklist**
3. **Klik baris tugas** untuk menandai selesai (centang)
4. Progress tersimpan otomatis ke server
5. Progress bar di kartu domain akan update

### Kategori Tugas

| Kategori | Contoh |
|----------|--------|
| Pembersihan | Hapus post "Hello World", kosongkan trash |
| Struktur | Set Site Title, ubah Permalink |
| Plugins | Install Rank Math, Elementor, LiteSpeed Cache |
| Tampilan | Install tema, upload logo |
| Halaman | Buat homepage, kontak, privacy policy |
| SEO | Hubungkan Search Console, aktifkan sitemap |
| Content | Buat artikel pilar |
| Security | Setup auto-backup |

---

## Tanggal Domain (Registrasi & Expired)

### Otomatis (WHOIS/RDAP)

Sistem otomatis mengambil tanggal registrasi dan expired dari WHOIS setiap 7 hari. Domain yang didukung:
- `.com`, `.net`, `.org`, `.info`, `.io`, `.co`, `.me`, `.xyz`, `.dev`, `.app`, `.work`
- `.id`, `.web.id`, `.my.id`, `.sch.id`, `.co.id`, `.or.id`, `.ac.id`

### Manual

Admin bisa mengisi/mengubah tanggal secara manual:
1. Klik domain → buka detail
2. Isi field **Tanggal Registrasi** dan **Tanggal Expired**
3. Klik **Simpan Tanggal**

### Auto-fill WHOIS

1. Buka detail domain
2. Klik tombol **Auto-fill WHOIS**
3. Sistem akan query RDAP server dan mengisi tanggal otomatis

---

## Notifikasi Domain Expired

Sistem mengirim notifikasi saat domain akan expired:

### Email

1. Admin buka menu **Kelola → Notifikasi**
2. Tambahkan email penerima (bisa lebih dari satu)
3. Di Status Summary, klik **Check & Notify** untuk kirim notifikasi ke semua domain yang akan expired dalam 30 hari

Email berisi:
- Nama domain
- Tanggal expired
- Sisa hari
- Warna urgency (merah: <7 hari, kuning: <14 hari, biru: >14 hari)

### Telegram

1. Buat bot Telegram via [@BotFather](https://t.me/BotFather):
   - Ketik `/newbot` di BotFather
   - Beri nama bot
   - Catat **Bot Token** yang diberikan
2. Buat group/channel Telegram, invite bot
3. Dapatkan **Chat ID** (kirim pesan ke bot, buka `https://api.telegram.org/bot<TOKEN>/getUpdates`)
4. Di LinkNyaMana, buka **Kelola → Notifikasi**
5. Isi Bot Token dan Chat ID
6. Klik **Simpan**, lalu **Test** untuk coba kirim pesan

### Downtime Alert

Jika domain berubah dari online ke offline, sistem otomatis mengirim alert ke email dan Telegram (jika dikonfigurasi). Ada cooldown 1 jam agar tidak spam.

### Escalation

Jika domain offline selama lebih dari **2 jam berturut-turut**, sistem mengirim notifikasi eskalasi ke semua channel.

---

## Manajemen Domain (Admin)

### Tambah Domain

1. Buka **Kelola → Domain**
2. Isi nama, URL, pilih kategori
3. Klik **Simpan**

### Edit Domain

1. Klik ikon pensil di kartu domain
2. Ubah nama, URL, atau kategori
3. Klik **Simpan**

### Hapus Domain

1. Klik ikon tempat sampah di kartu domain
2. Konfirmasi "Hapus domain ini?" → klik OK
3. Domain terhapus dari database

### Arsipkan Domain

1. Klik ikon arsip di kartu domain
2. Domain dipindahkan ke tab **Arsip**
3. Untuk mengembalikan, buka Arsip dan klik ikon arsip lagi

### Import Domain (CSV)

1. Buka **Kelola → Import / Export**
2. Klik **Pilih File CSV**
3. Format CSV harus punya kolom: `name`, `url`, `category_name`
4. Preview data, lalu klik **Import**

Contoh CSV:
```
name,url,category_name
contohweb.com,https://contohweb.com,Ambulance
testweb.id,https://testweb.id,Pendidikan
```

### Export Domain (CSV)

1. Buka **Kelola → Import / Export**
2. Klik **Export CSV**
3. File akan terdownload berisi semua domain + tanggal

---

## Manajemen Kategori (Admin)

### Tambah Kategori

1. Buka **Kelola → Kategori**
2. Isi nama dan emoji ikon (opsional)
3. Klik **Simpan**

### Hapus Kategori

1. Di sidebar, klik ikon tempat sampah di sebelah nama kategori
2. Konfirmasi penghapusan
3. **Catatan:** Kategori yang masih memiliki domain tidak bisa dihapus. Pindahkan atau hapus domain dulu.

---

## Manajemen User (Admin)

### Tambah User

1. Buka **Kelola → User**
2. Klik **Tambah User**
3. Isi Username, Nama Tampilan, Password, dan pilih Role
4. Klik **Simpan**

### Ubah Role

1. Buka Manajemen User
2. Di sebelah nama user, ubah dropdown role (Admin/Editor/Viewer)
3. Perubahan langsung tersimpan

### Assign Kategori ke User

1. Buka Manajemen User → tab **Assign Kategori**
2. Pilih user dari dropdown
3. Centang kategori yang ingin di-assign
4. User tersebut hanya bisa melihat domain dari kategori yang dicentang

### Hapus User

1. Klik ikon tempat sampah di sebelah user
2. Konfirmasi penghapusan

---

## Ganti Password

Semua user bisa ganti password sendiri:

1. Klik ikon kunci di footer sidebar
2. Masukkan **Password Lama**
3. Masukkan **Password Baru** (minimal 6 karakter)
4. Masukkan **Konfirmasi Password Baru**
5. Klik **Simpan**

> Setelah ganti password, semua sesi login di perangkat lain otomatis logout.

---

## Dark Mode

1. Klik ikon bulan/matahari di footer sidebar
2. Tema berubah antara Light dan Dark
3. Pilihan disimpan dan tetap aktif saat login berikutnya

---

## Progress Report

Lihat ringkasan progress setup WordPress semua domain:

1. Buka **Kelola → Progress Report**
2. Lihat:
   - Total domain aktif
   - Berapa domain yang sudah 100% selesai
   - Rata-rata progress keseluruhan
   - Tabel detail per domain
3. Klik **Export CSV** untuk download report

---

## Analytics (Admin)

Klik **Tampilkan Analytics** di area utama untuk melihat:

1. **Uptime Trend (30 hari)** — Grafik garis persentase uptime harian
2. **Progress per Kategori** — Grafik bar jumlah domain vs yang sudah selesai setup
3. **Status Domain** — Grafik donut distribusi online/offline

---

## Keyboard Shortcuts

| Shortcut | Fungsi |
|----------|--------|
| `/` | Focus ke search bar |
| `r` | Refresh status semua domain |
| `Esc` | Tutup dialog / bersihkan search |

---

## Troubleshooting

### Domain ditampilkan offline padahal sebenarnya online

- Coba klik domain untuk **deep check** (cek ulang langsung)
- Beberapa website memblokir request otomatis — ini false positive
- Website dengan proteksi Cloudflare/CAPTCHA mungkin terdeteksi offline

### WHOIS auto-fill gagal

- Tidak semua registrar mengizinkan query RDAP
- Domain dengan privacy protection mungkin tidak mengembalikan tanggal
- Coba isi tanggal secara manual

### Notifikasi tidak terkirim

- Pastikan email penerima sudah ditambahkan di Setting Notifikasi
- Untuk Telegram, pastikan bot sudah di-invite ke group/channel
- Cek apakah Chat ID sudah benar

### Halaman loading terus

- Refresh browser (Ctrl+F5)
- Coba logout dan login ulang
- Bersihkan cache browser

---

## Informasi Teknis

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Astro + React + Tailwind CSS |
| Backend | Cloudflare Workers (serverless) |
| Database | Neon PostgreSQL (serverless) |
| Email | Resend API |
| Telegram | Telegram Bot API |
| WHOIS | RDAP (direct registry queries) |
| Charts | Recharts |
| Cron | Cloudflare Cron Triggers (setiap 15 menit) |

---

*Dokumentasi ini untuk LinkNyaMana v1.0 — Domain Monitoring & Management Dashboard*
