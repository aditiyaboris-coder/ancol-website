const express = require('express');
const path = require('path');
const { getDb, queryAll, queryOne, run } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── HTML Routes ──
const pages = ['', 'tentang', 'daya-tarik', 'galeri', 'paket', 'info-kunjungan', 'kontak', 'buku-tamu'];
pages.forEach(p => {
  const route = p === '' ? '/' : `/${p}`;
  const file = p === '' ? 'index' : p;
  app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'public', `${file}.html`)));
});

// ── API: Buku Tamu ──
app.get('/api/buku-tamu', async (req, res) => {
  try {
    await getDb();
    const entries = queryAll('SELECT * FROM buku_tamu ORDER BY tanggal DESC');
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data buku tamu: ' + err.message });
  }
});

app.post('/api/buku-tamu', async (req, res) => {
  const { nama, email, asal_kota, pesan, rating } = req.body;
  if (!nama || !email || !asal_kota || !pesan)
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ success: false, message: 'Format email tidak valid' });
  try {
    await getDb();
    const now = new Date().toISOString();
    const result = run(
      'INSERT INTO buku_tamu (nama,email,asal_kota,pesan,rating,tanggal) VALUES (?,?,?,?,?,?)',
      [nama, email, asal_kota.trim(), pesan.trim(), rating || 5, now]
    );
    res.json({ success: true, message: 'Pesan berhasil disimpan!', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menyimpan: ' + err.message });
  }
});

// ── API: Paket ──
app.get('/api/paket', async (req, res) => {
  try {
    await getDb();
    const paket = queryAll('SELECT * FROM paket_wisata ORDER BY harga ASC');
    res.json({ success: true, data: paket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/paket/:id', async (req, res) => {
  try {
    await getDb();
    const paket = queryOne('SELECT * FROM paket_wisata WHERE id = ?', [req.params.id]);
    if (!paket) return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });
    res.json({ success: true, data: paket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── API: Booking ──
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
      return res.status(400).json({ success: false, message: `Maks. ${paket.kapasitas} orang untuk paket ini` });

    const total_bayar = paket.harga * jumlah_orang;
    const kode_booking = generateKode();
    const now = new Date().toISOString();

    run(
      'INSERT INTO booking (kode_booking,nama_pemesan,email,no_telepon,paket_id,jumlah_orang,tanggal_kunjungan,total_bayar,catatan,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [kode_booking, nama_pemesan, email, no_telepon, paket_id, jumlah_orang, tanggal_kunjungan, total_bayar, catatan||'', now]
    );

    res.json({
      success: true,
      message: 'Booking berhasil!',
      data: {
        kode_booking, nama_pemesan,
        paket: paket.nama, jumlah_orang,
        tanggal_kunjungan, total_bayar,
        rekening_transfer: { bank:'BCA', no_rekening:'1234567890', atas_nama:'PT Taman Impian Jaya Ancol', nominal: total_bayar }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Start ──
async function start() {
  await getDb();
  app.listen(PORT, () => {
    console.log(`\n🌊 Server Ancol berjalan di http://localhost:${PORT}`);
    console.log(`📦 Database SQLite siap`);
    console.log(`🚀 Ctrl+C untuk stop\n`);
  });
}
start();
