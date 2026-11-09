# Panduan Menjalankan BumperCraft Studio Secara Lokal

Aplikasi ini dapat dijalankan 100% di komputer/laptop Anda (Localhost) dengan tetap terhubung ke internet untuk memanfaatkan fitur AI Gemini dan font online.

---

## Persyaratan Awal (Prasyarat)

1. **Komputer Terhubung ke Internet**: Agar library, font Google, dan API Gemini dapat diakses.
2. **Node.js Terpasang (Versi 18 ke atas)**:
   - Jika belum punya, download gratis di [https://nodejs.org](https://nodejs.org) (Pilih versi **LTS**).
   - Jalankan instalasinya sampai selesai (klik Next-Next hingga Finish).

---

## Langkah 1: Download & Ekstrak File Proyek

1. Di pojok kanan atas layar Google AI Studio Build ini, klik tombol **Download / Export Code** (ikon download atau titik tiga $\rightarrow$ Export to Zip).
2. Simpan file zip di komputer Anda (misalnya di folder `D:\BumperCraftStudio` atau `C:\BumperCraftStudio`).
3. Ekstrak file zip tersebut (Klik kanan $\rightarrow$ *Extract All* / Ekstrak di sini).

---

## Langkah 2: Cara Paling Mudah (1-Klik untuk Windows)

Jika Anda menggunakan Windows:
- Cukup **klik dua kali** file `jalankan_studio.bat`.
- Script otomatis akan mengecek Node.js, menginstall modul, membuka browser ke `http://localhost:3000`, dan menyalakan server!

---

## Langkah 3: Cara Manual Lewat Terminal / Command Prompt

Jika ingin menjalankan secara manual atau menggunakan MacOS / Linux:

1. Buka **Command Prompt (CMD)** atau **Terminal**.
2. Masuk ke folder proyek, misalnya:
   ```bash
   cd D:\BumperCraftStudio
   ```
3. Install dependensi (hanya perlu sekali di awal):
   ```bash
   npm install
   ```
4. Salin file environment:
   ```bash
   cp .env.example .env
   ```
   *(Di Windows CMD gunakan: `copy .env.example .env`)*
5. Jalankan server lokal:
   ```bash
   npm run dev
   ```
6. Buka browser (Chrome, Edge, Firefox) dan ketik alamat:
   ```text
   http://localhost:3000
   ```

---

## Langkah 4: Cara Mengakses dari HP / Laptop Lain di Jaringan Wi-Fi yang Sama

Server sudah dikonfigurasi untuk mendengarkan alamat `0.0.0.0`, sehingga Anda dan tim Anda di satu kantor/rumah dapat mengaksesnya langsung dari smartphone, tablet, atau laptop lain:

1. Cari tahu IP komputer Anda:
   - **Windows**: Buka CMD $\rightarrow$ ketik `ipconfig` $\rightarrow$ lihat **IPv4 Address** (contoh: `192.168.1.15`).
   - **Mac/Linux**: Buka Terminal $\rightarrow$ ketik `ifconfig` atau cek di menu Network Settings.
2. Di HP atau laptop lain yang tersambung ke Wi-Fi yang sama, buka browser dan masukkan:
   ```text
   http://192.168.1.15:3000
   ```
   *(Ganti `192.168.1.15` dengan alamat IP komputer server Anda)*.

---

## Langkah 5: Mengaktifkan Fitur AI Slogan (Opsional)

Jika ingin menggunakan fitur **"Ide Slogan AI"**:
1. Buka file `.env` dengan Notepad.
2. Masukkan API Key Gemini Anda di baris:
   ```env
   GEMINI_API_KEY="AIzaSy..."
   ```
   *(Dapatkan API Key gratis di [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey))*.
3. Simpan file `.env`.

---

## Penyimpanan Pengaturan untuk Pekerjaan Berulang

Setiap perubahan desain, pilihan mode, dan bagian pengaturan yang sedang dibuka disimpan otomatis di browser pada komputer ini. Saat membuka kembali `http://localhost:3000` dengan browser dan profil yang sama, pekerjaan terakhir akan dipulihkan.

- Tombol **Reset** mengembalikan pengaturan awal dan menggantikan pekerjaan yang tersimpan.
- Pengaturan hanya tersedia pada browser/profil yang sama; gunakan tombol ekspor untuk menyimpan hasil ke file.
- Font daring memerlukan koneksi internet. Jika font gagal dimuat, pratinjau dapat memakai font pengganti.
- Jika file `.bat` dijalankan lagi ketika Studio sudah aktif di port 3000, file akan membuka Studio yang sedang berjalan alih-alih membuat server kedua. Jika port dipakai aplikasi lain, tutup aplikasi itu terlebih dahulu sebelum mencoba lagi.
