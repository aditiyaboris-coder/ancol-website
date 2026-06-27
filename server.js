const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const { getDb, queryAll, queryOne, run } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'ancol-admin-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

// ── Multer: gambar paket ──
const storagePaket = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `paket-${Date.now()}${path.extname(file.originalname)}`)
});
const uploadPaket = multer({ storage: storagePaket, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Multer: foto galeri ──
const storageFoto = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `foto-${Date.now()}-${Math.random().toString(36).slice(2,6)}${path.extname(file.originalname)}`)
});
const uploadFoto = multer({ storage: storageFoto, limits: { fileSize: 5 * 1024 * 1024 } });

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'ancol2024';

function requireAdmin(req, res, next) {
  if (req.session?.isAdmin) return next();
  res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
}

// ─────────────────────────────────────────
// HTML ROUTES
// ─────────────────────────────────────────
const pages = ['', 'tentang', 'daya-tarik', 'galeri', 'paket', 'info-kunjungan', 'kontak', 'buku-tamu'];
pages.forEach(p => {
  const route = p === '' ? '/' : `/${p}`;
  const file  = p === '' ? 'index' : p;
  app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'public', `${file}.html`)));
});

app.get('/admin', (req, res) => res.redirect('/admin/login'));
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html')));
app.get('/admin/dashboard', (req, res) => {
  if (!req.session?.isAdmin) return res.redirect('/admin/login');
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

// ─────────────────────────────────────────
// API: AUTH
// ─────────────────────────────────────────
app.post('/admin/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Username atau password salah' });
  }
});

app.post('/admin/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ─────────────────────────────────────────
// API: BUKU TAMU
// ─────────────────────────────────────────
app.get('/api/buku-tamu', async (req, res) => {
  try {
    await getDb();
    res.json({ success: true, data: queryAll('SELECT * FROM buku_tamu ORDER BY tanggal DESC') });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/buku-tamu', async (req, res) => {
  const { nama, email, asal_kota, pesan, rating } = req.body;
  if (!nama || !email || !asal_kota || !pesan)
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ success: false, message: 'Format email tidak valid' });
  try {
    await getDb();
    const result = run(
      'INSERT INTO buku_tamu (nama,email,asal_kota,pesan,rating,tanggal) VALUES (?,?,?,?,?,?)',
      [nama, email, asal_kota.trim(), pesan.trim(), rating||5, new Date().toISOString()]
    );
    res.json({ success: true, message: 'Pesan berhasil disimpan!', id: result.lastInsertRowid });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/admin/api/buku-tamu/:id', requireAdmin, async (req, res) => {
  try {
    await getDb();
    run('DELETE FROM buku_tamu WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─────────────────────────────────────────
// API: PAKET WISATA
// ─────────────────────────────────────────
app.get('/api/paket', async (req, res) => {
  try {
    await getDb();
    res.json({ success: true, data: queryAll('SELECT * FROM paket_wisata ORDER BY harga ASC') });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/paket/:id', async (req, res) => {
  try {
    await getDb();
    const paket = queryOne('SELECT * FROM paket_wisata WHERE id = ?', [req.params.id]);
    if (!paket) return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });
    res.json({ success: true, data: paket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/admin/api/paket/:id', requireAdmin, uploadPaket.single('gambar'), async (req, res) => {
  const { nama, deskripsi, harga, kapasitas, durasi, fasilitas } = req.body;
  if (!nama || !harga || !kapasitas)
    return res.status(400).json({ success: false, message: 'Field wajib tidak boleh kosong' });
  try {
    await getDb();
    const existing = queryOne('SELECT * FROM paket_wisata WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });
    const gambar = req.file ? req.file.filename : existing.gambar;
    run('UPDATE paket_wisata SET nama=?,deskripsi=?,harga=?,kapasitas=?,durasi=?,fasilitas=?,gambar=? WHERE id=?',
      [nama, deskripsi, parseInt(harga), parseInt(kapasitas), durasi, fasilitas, gambar, req.params.id]);
    res.json({ success: true, message: 'Paket berhasil diperbarui' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─────────────────────────────────────────
// API: GALERI FOTO
// ─────────────────────────────────────────
app.get('/api/galeri/foto', async (req, res) => {
  try {
    await getDb();
    res.json({ success: true, data: queryAll('SELECT * FROM galeri_foto ORDER BY urutan ASC, created_at DESC') });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/admin/api/galeri/foto', requireAdmin, uploadFoto.single('foto'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'File foto wajib diupload' });
  const { judul, keterangan } = req.body;
  if (!judul) return res.status(400).json({ success: false, message: 'Judul wajib diisi' });
  try {
    await getDb();
    const result = run(
      'INSERT INTO galeri_foto (judul, filename, keterangan, created_at) VALUES (?,?,?,?)',
      [judul, req.file.filename, keterangan||'', new Date().toISOString()]
    );
    res.json({ success: true, message: 'Foto berhasil diupload', id: result.lastInsertRowid });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/admin/api/galeri/foto/:id', requireAdmin, async (req, res) => {
  try {
    await getDb();
    const foto = queryOne('SELECT * FROM galeri_foto WHERE id = ?', [req.params.id]);
    if (foto) {
      // Hapus file fisik
      const filePath = path.join(__dirname, 'public', 'uploads', foto.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      run('DELETE FROM galeri_foto WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─────────────────────────────────────────
// API: GALERI VIDEO
// ─────────────────────────────────────────
app.get('/api/galeri/video', async (req, res) => {
  try {
    await getDb();
    res.json({ success: true, data: queryAll('SELECT * FROM galeri_video ORDER BY urutan ASC, created_at DESC') });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/admin/api/galeri/video', requireAdmin, async (req, res) => {
  const { judul, youtube_url, keterangan } = req.body;
  if (!judul || !youtube_url) return res.status(400).json({ success: false, message: 'Judul dan URL wajib diisi' });
  if (!youtube_url.includes('youtube') && !youtube_url.includes('youtu.be'))
    return res.status(400).json({ success: false, message: 'URL harus berupa link YouTube' });
  try {
    await getDb();
    const result = run(
      'INSERT INTO galeri_video (judul, youtube_url, keterangan, created_at) VALUES (?,?,?,?)',
      [judul, youtube_url, keterangan||'', new Date().toISOString()]
    );
    res.json({ success: true, message: 'Video berhasil ditambahkan', id: result.lastInsertRowid });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/admin/api/galeri/video/:id', requireAdmin, async (req, res) => {
  try {
    await getDb();
    run('DELETE FROM galeri_video WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─────────────────────────────────────────
// API: BOOKING
// ─────────────────────────────────────────
function generateKode() {
  return `ANCOL-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
}

app.post('/api/booking', async (req, res) => {
  const { nama_pemesan, email, no_telepon, paket_id, jumlah_orang, tanggal_kunjungan, catatan } = req.body;
  if (!nama_pemesan || !email || !no_telepon || !paket_id || !jumlah_orang || !tanggal_kunjungan)
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
  const today = new Date(); today.setHours(0,0,0,0);
  if (new Date(tanggal_kunjungan) <= today)
    return res.status(400).json({ success: false, message: 'Tanggal kunjungan minimal besok' });
  try {
    await getDb();
    const paket = queryOne('SELECT * FROM paket_wisata WHERE id = ?', [paket_id]);
    if (!paket) return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });
    if (jumlah_orang > paket.kapasitas)
      return res.status(400).json({ success: false, message: `Maks. ${paket.kapasitas} orang` });
    const total_bayar = paket.harga * jumlah_orang;
    const kode_booking = generateKode();
    run('INSERT INTO booking (kode_booking,nama_pemesan,email,no_telepon,paket_id,jumlah_orang,tanggal_kunjungan,total_bayar,catatan,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [kode_booking, nama_pemesan, email, no_telepon, paket_id, jumlah_orang, tanggal_kunjungan, total_bayar, catatan||'', new Date().toISOString()]);
    res.json({ success: true, message: 'Booking berhasil!', data: {
      kode_booking, nama_pemesan, paket: paket.nama, jumlah_orang, tanggal_kunjungan, total_bayar,
      rekening_transfer: { bank:'BCA', no_rekening:'1234567890', atas_nama:'PT Taman Impian Jaya Ancol', nominal: total_bayar }
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/admin/api/booking', requireAdmin, async (req, res) => {
  try {
    await getDb();
    res.json({ success: true, data: queryAll(`
      SELECT b.*, p.nama as nama_paket FROM booking b
      JOIN paket_wisata p ON b.paket_id = p.id ORDER BY b.created_at DESC`) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─────────────────────────────────────────
// START
// ─────────────────────────────────────────
async function start() {
  await getDb();
  app.listen(PORT, () => {
    console.log(`\n🌊 Server: http://localhost:${PORT}`);
    console.log(`🔐 Admin:  http://localhost:${PORT}/admin`);
    console.log(`   Login: admin / ancol2024\n`);
  });
}
start();
