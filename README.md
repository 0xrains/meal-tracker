# 🍜 Catatan Makan (Meal Tracker)

Aplikasi pencatat pengeluaran makan harian sederhana, modern, dan responsif dengan fitur akumulasi rollover saldo, pilihan sumber dana, grafik rekap mingguan/bulanan, pengaturan target anggaran dinamis, serta dukungan mode terang/gelap.

---

## ✨ Fitur Utama

- **🔒 Autentikasi Email & Password (Multi-User)**: Setiap pengguna memiliki akun dan data pribadinya masing-masing yang terisolasi 100% secara aman via Supabase Auth & RLS.
- **💰 Anggaran & Akumulasi Rollover**: Saldo sisa kemarin otomatis ditambahkan ke jatah hari ini (atau dipotong jika kemarin boros).
- **⚙️ Target Anggaran Dinamis**: Pengguna dapat mengubah target jatah anggaran harian secara fleksibel dan tersimpan di database.
- **💳 Pilihan Sumber Dana**: Catat sumber dana transaksi (Dompet, ShopeePay, Seabank, Gopay, Dana, BRI) atau tambahkan sumber dana baru secara manual.
- **📊 Ringkasan 7 Hari & Rekap Bulanan**: Visualisasi grafik pengeluaran dan evaluasi persentase hemat vs boros bulanan.
- **🌓 Mode Terang & Gelap (Light/Dark Mode)**: Tampilan kontras tinggi yang nyaman di mata dengan penyimpanan preferensi otomatis.
- **⚡ Error Handling & Validasi Kuat**: Penanganan kesalahan jaringan/database secara aman dengan *optimistic rollback* dan notifikasi toast.

---

## 🚀 Panduan Memulai

### 1. Clone Repository & Install Dependency
```bash
git clone <URL_REPOSITORY_ANDA>
cd MealTrackerMain
npm install
```

### 2. Konfigurasi Environment Variable
Buat file `.env.local` di root direktori project:
```env
VITE_SUPABASE_URL=https://<YOUR-PROJECT-ID>.supabase.co
VITE_SUPABASE_ANON_KEY=<YOUR-SUPABASE-ANON-KEY>
```

### 3. Setup Database Supabase
1. Buka **SQL Editor** di dashboard Supabase kamu, lalu salin dan jalankan seluruh isi script dari file **[`supabase_schema.sql`](./supabase_schema.sql)**.
2. Pastikan fitur **Email Auth** aktif di dashboard Supabase (**Authentication -> Providers -> Email**). *(Opsional: nonaktifkan "Confirm email" di Auth Settings jika ingin user langsung login setelah registrasi tanpa perlu klik link verifikasi email).*

Script database tersebut akan secara otomatis membuat:
- Tabel `transactions` (data riwayat pengeluaran per user)
- Tabel `funding_sources` (master data sumber dana per user)
- Tabel `app_settings` (konfigurasi target anggaran per user)
- PostgreSQL Trigger untuk mengisikan data bawaan otomatis saat user baru mendaftar
- Kebijakan keamanan Row Level Security (RLS) `auth.uid() = user_id`

### 4. Jalankan Aplikasi
```bash
npm run dev
```
Buka browser di `http://localhost:5173`. Masuk dengan akun kamu atau daftar akun baru.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Lucide Icons
- **Chart**: Recharts
- **Database / Backend**: Supabase
- **Notification**: React Hot Toast
- **Form Handling**: React Hook Form
