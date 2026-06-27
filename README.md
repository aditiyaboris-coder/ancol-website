# 🌊 Website Wisata Pantai Ancol

Website wisata Pantai Ancol berbasis Node.js + Express + SQLite.  
Dibuat untuk tugas kuliah Pemrograman Web.

---

## 📁 Struktur Project

```
ancol-website/
├── server.js          ← Express server + semua API routes
├── database.js        ← Setup SQLite (sql.js)
├── package.json
├── railway.json       ← Konfigurasi deploy Railway
├── .gitignore
├── ancol.db           ← File database (auto-dibuat, JANGAN di-push ke GitHub)
└── public/
    ├── css/style.css
    ├── js/
    │   ├── main.js
    │   ├── paket.js
    │   └── buku-tamu.js
    ├── index.html
    ├── tentang.html
    ├── daya-tarik.html
    ├── galeri.html
    ├── paket.html
    ├── info-kunjungan.html
    ├── kontak.html
    └── buku-tamu.html
```

---

## 🚀 Cara Menjalankan Lokal

**Syarat:** Node.js sudah terinstall

```bash
# 1. Masuk ke folder project
cd ancol-website

# 2. Install dependencies
npm install

# 3. Jalankan server
node server.js

# 4. Buka browser
# http://localhost:3000
```

---

## 🌐 Deploy ke Railway (Online Gratis)

### Langkah 1 – Push ke GitHub
```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/USERNAME/ancol-website.git
git push -u origin main
```

### Langkah 2 – Deploy di Railway
1. Buka https://railway.app
2. Klik **"Start a New Project"**
3. Pilih **"Deploy from GitHub repo"**
4. Login dengan akun GitHub kamu
5. Pilih repo `ancol-website`
6. Railway otomatis detect Node.js dan deploy!
7. Setelah selesai, klik **"Generate Domain"**
8. Website kamu online dengan URL seperti: `ancol-website.up.railway.app`

---

## 🗄️ API Endpoints

### Buku Tamu
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/buku-tamu` | Ambil semua entri buku tamu |
| POST | `/api/buku-tamu` | Tambah entri baru |

**POST /api/buku-tamu body:**
```json
{
  "nama": "Budi Santoso",
  "email": "budi@email.com",
  "asal_kota": "Bandung",
  "pesan": "Ancol sangat indah!",
  "rating": 5
}
```

### Paket Wisata
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/paket` | Ambil semua paket |
| GET | `/api/paket/:id` | Ambil satu paket |

### Booking
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/booking` | Buat booking baru |

**POST /api/booking body:**
```json
{
  "nama_pemesan": "Siti Rahayu",
  "email": "siti@email.com",
  "no_telepon": "081234567890",
  "paket_id": 1,
  "jumlah_orang": 3,
  "tanggal_kunjungan": "2024-12-25",
  "catatan": "Mohon siapkan area duduk dekat pantai"
}
```

---

## 📋 Catatan Penting

- File `ancol.db` sudah ada di `.gitignore` — database tidak ikut ke GitHub (ini normal)
- Di Railway, database akan reset setiap kali redeploy (untuk database permanen, upgrade ke Railway Pro atau gunakan TiDB Cloud)
- Untuk tugas kuliah, ini sudah cukup karena data demo akan selalu ada via seed otomatis

---

*© 2024 Tugas Kuliah Pemrograman Web*
