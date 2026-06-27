const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'ancol.db');

let db = null;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS buku_tamu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      email TEXT NOT NULL,
      asal_kota TEXT NOT NULL,
      pesan TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      tanggal DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS paket_wisata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      deskripsi TEXT NOT NULL,
      harga INTEGER NOT NULL,
      fasilitas TEXT NOT NULL,
      durasi TEXT NOT NULL,
      kapasitas INTEGER NOT NULL,
      gambar TEXT DEFAULT 'paket-default.jpg'
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS booking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kode_booking TEXT UNIQUE NOT NULL,
      nama_pemesan TEXT NOT NULL,
      email TEXT NOT NULL,
      no_telepon TEXT NOT NULL,
      paket_id INTEGER NOT NULL,
      jumlah_orang INTEGER NOT NULL,
      tanggal_kunjungan TEXT NOT NULL,
      total_bayar INTEGER NOT NULL,
      status TEXT DEFAULT 'menunggu',
      catatan TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed paket
  const res = db.exec('SELECT COUNT(*) as count FROM paket_wisata');
  const count = res[0]?.values[0][0] || 0;
  if (count === 0) {
    const paketList = [
      ['Paket Keluarga Basic', 'Paket wisata keluarga dengan akses pantai dan area piknik. Cocok untuk liburan santai bersama keluarga tercinta menikmati keindahan Pantai Ancol.', 150000, 'Tiket masuk kawasan,Akses pantai,Area piknik,Parkir gratis,Toilet umum', '1 Hari (07.00 – 18.00)', 10, 'paket-basic.jpg'],
      ['Paket Keluarga Premium', 'Paket premium dengan akses Dufan dan Sea World. Pengalaman seru tak terlupakan untuk seluruh anggota keluarga dengan berbagai wahana menarik.', 450000, 'Tiket masuk kawasan,Akses Dufan,Akses Sea World,Makan siang,Parkir gratis,Pemandu wisata', '1 Hari (08.00 – 20.00)', 8, 'paket-premium.jpg'],
      ['Paket Romantis Couple', 'Paket spesial untuk pasangan dengan sunset dinner di tepi pantai. Ciptakan kenangan indah bersama orang tersayang di pesisir Jakarta.', 350000, 'Tiket masuk kawasan,Sunset dinner for 2,Dekorasi meja,Foto profesional,Akses beach area VIP', '1 Hari (14.00 – 21.00)', 2, 'paket-couple.jpg'],
      ['Paket Rombongan Sekolah', 'Paket edukasi wisata untuk siswa sekolah. Belajar sambil bermain di lingkungan alam Ancol dengan pendampingan pemandu berpengalaman.', 95000, 'Tiket masuk kawasan,Akses Sea World,Edukasi lingkungan laut,Makan siang,Pemandu wisata,Dokumentasi', '1 Hari (08.00 – 16.00)', 50, 'paket-sekolah.jpg'],
      ['Paket Petualangan Extreme', 'Paket untuk pencinta adrenalin! Nikmati semua wahana extreme di Dufan dan olahraga air. Tantang dirimu di wahana paling seru se-Jakarta.', 550000, 'Tiket masuk kawasan,All access Dufan,Jetski 30 menit,Banana boat,Makan siang & dinner,Merchandise Ancol', '1 Hari (08.00 – 21.00)', 6, 'paket-extreme.jpg'],
      ['Paket Weekend Getaway', 'Paket menginap 2 hari 1 malam di resort Ancol. Rasakan sensasi menginap di tepi pantai Jakarta dengan fasilitas bintang tiga.', 1200000, 'Menginap 1 malam di resort,Sarapan & makan malam,Akses kolam renang,Akses pantai private,Late check-out,Antar jemput bandara', '2 Hari 1 Malam', 4, 'paket-resort.jpg']
    ];
    for (const p of paketList) {
      db.run('INSERT INTO paket_wisata (nama,deskripsi,harga,fasilitas,durasi,kapasitas,gambar) VALUES (?,?,?,?,?,?,?)', p);
    }
    console.log('✅ Paket wisata berhasil di-seed');
  }

  saveDb();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Helper: run query dan return rows sebagai array of objects
function queryAll(sql, params = []) {
  const res = db.exec(sql, params);
  if (!res.length) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

function run(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.run(params);
  stmt.free();
  const lastId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0];
  saveDb();
  return { lastInsertRowid: lastId };
}

module.exports = { getDb, queryAll, queryOne, run, saveDb };
