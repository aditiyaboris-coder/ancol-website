// ── State ──
let semuaPaket = [];
let paketDipilih = null;

const PAKET_ICONS = ['🏖️', '⭐', '💑', '🎒', '🏄', '🌙'];

// ── Load paket saat halaman dibuka ──
document.addEventListener('DOMContentLoaded', muatPaket);

async function muatPaket() {
  const container = document.getElementById('paketContainer');
  const alert = document.getElementById('alertPaket');
  try {
    const res = await fetch('/api/paket');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    semuaPaket = json.data;
    renderPaket(semuaPaket);
  } catch (err) {
    container.innerHTML = '';
    showAlert(alert, 'error', 'Gagal memuat paket wisata. Coba refresh halaman.');
  }
}

function renderPaket(paketList) {
  const container = document.getElementById('paketContainer');
  if (paketList.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--gray-600);">Tidak ada paket tersedia.</p>';
    return;
  }
  container.innerHTML = paketList.map((p, i) => {
    const fasilitasList = p.fasilitas.split(',').map(f =>
      `<li>${f.trim()}</li>`
    ).join('');
    const icon = PAKET_ICONS[i % PAKET_ICONS.length];
    return `
    <div class="paket-card">
      <div class="paket-card-header">
        <div class="paket-icon">${icon}</div>
        <h3>${p.nama}</h3>
        <div class="durasi">⏱ ${p.durasi}</div>
        <div class="paket-harga">
          <span class="amount">${formatRupiah(p.harga)}</span>
          <span class="per">/ orang</span>
        </div>
      </div>
      <div class="paket-card-body">
        <p class="paket-desc">${p.deskripsi}</p>
        <ul class="fasilitas-list">${fasilitasList}</ul>
        <div class="paket-kapasitas">👥 Maks. ${p.kapasitas} orang per booking</div>
      </div>
      <div class="paket-card-footer">
        <button class="btn btn-primary btn-full" onclick="bukaModalBooking(${p.id})">
          🎫 Pesan Sekarang
        </button>
      </div>
    </div>`;
  }).join('');
}

// ── Modal Booking ──
function bukaModalBooking(paketId) {
  paketDipilih = semuaPaket.find(p => p.id === paketId);
  if (!paketDipilih) return;

  // Reset form
  document.getElementById('namaPemesan').value = '';
  document.getElementById('emailPemesan').value = '';
  document.getElementById('telpPemesan').value = '';
  document.getElementById('jumlahOrang').value = 1;
  document.getElementById('catatanBooking').value = '';
  document.getElementById('hasilKonfirmasi').classList.add('hidden');
  document.getElementById('formBookingContainer').classList.remove('hidden');
  document.getElementById('alertBooking').classList.remove('show');

  // Set min date = besok
  const besok = new Date();
  besok.setDate(besok.getDate() + 1);
  document.getElementById('tanggalKunjungan').min = besok.toISOString().split('T')[0];
  document.getElementById('tanggalKunjungan').value = '';

  // Info paket di modal
  document.getElementById('modalPaketInfo').innerHTML = `
    <div style="font-weight:700;color:var(--teal-deep);margin-bottom:0.25rem;">${paketDipilih.nama}</div>
    <div style="font-size:0.85rem;color:var(--gray-600);">
      ⏱ ${paketDipilih.durasi} &nbsp;|&nbsp; 
      👥 Maks. ${paketDipilih.kapasitas} orang &nbsp;|&nbsp; 
      <strong>${formatRupiah(paketDipilih.harga)} / orang</strong>
    </div>
  `;

  hitungTotal();
  document.getElementById('modalBooking').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function tutupModal() {
  document.getElementById('modalBooking').classList.remove('active');
  document.body.style.overflow = '';
}

function hitungTotal() {
  if (!paketDipilih) return;
  const jumlah = parseInt(document.getElementById('jumlahOrang').value) || 1;
  const total = paketDipilih.harga * jumlah;
  document.getElementById('totalBayarDisplay').textContent = formatRupiah(total);
}

// ── Submit booking ──
async function submitBooking() {
  const alertEl = document.getElementById('alertBooking');
  const nama = document.getElementById('namaPemesan').value.trim();
  const email = document.getElementById('emailPemesan').value.trim();
  const telp = document.getElementById('telpPemesan').value.trim();
  const jumlah = parseInt(document.getElementById('jumlahOrang').value);
  const tanggal = document.getElementById('tanggalKunjungan').value;
  const catatan = document.getElementById('catatanBooking').value.trim();

  if (!nama || !email || !telp || !tanggal) {
    showAlert(alertEl, 'error', 'Harap isi semua field yang wajib diisi.');
    return;
  }
  if (jumlah < 1) {
    showAlert(alertEl, 'error', 'Jumlah orang minimal 1.');
    return;
  }

  const btn = document.querySelector('.modal .btn-primary');
  btn.disabled = true;
  btn.textContent = '⏳ Memproses...';

  try {
    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama_pemesan: nama,
        email,
        no_telepon: telp,
        paket_id: paketDipilih.id,
        jumlah_orang: jumlah,
        tanggal_kunjungan: tanggal,
        catatan
      })
    });
    const json = await res.json();

    if (!json.success) {
      showAlert(alertEl, 'error', json.message);
      btn.disabled = false;
      btn.textContent = '✅ Konfirmasi Booking';
      return;
    }

    // Tampilkan konfirmasi
    const d = json.data;
    document.getElementById('formBookingContainer').classList.add('hidden');
    document.getElementById('hasilKonfirmasi').innerHTML = `
      <div class="konfirmasi-box">
        <div style="font-size:2.5rem;margin-bottom:0.5rem;">🎉</div>
        <h3 style="font-family:var(--font-display);font-size:1.4rem;margin-bottom:0.25rem;">Booking Berhasil!</h3>
        <p style="opacity:0.8;font-size:0.875rem;">Simpan kode booking ini sebagai bukti</p>
        <div class="kode">${d.kode_booking}</div>
        <div class="transfer-info">
          <div class="row"><span>Nama Pemesan</span><span style="font-weight:600;">${d.nama_pemesan}</span></div>
          <div class="row"><span>Paket</span><span style="font-weight:600;">${d.paket}</span></div>
          <div class="row"><span>Jumlah Orang</span><span style="font-weight:600;">${d.jumlah_orang} orang</span></div>
          <div class="row"><span>Tanggal Kunjungan</span><span style="font-weight:600;">${formatTanggal(d.tanggal_kunjungan)}</span></div>
          <div class="row"><span>Bank</span><span style="font-weight:600;">${d.rekening_transfer.bank}</span></div>
          <div class="row"><span>No. Rekening</span><span style="font-weight:600;">${d.rekening_transfer.no_rekening}</span></div>
          <div class="row"><span>Atas Nama</span><span style="font-weight:600;">${d.rekening_transfer.atas_nama}</span></div>
          <div class="row"><span class="total">Total Transfer</span><span class="total">${formatRupiah(d.total_bayar)}</span></div>
        </div>
        <button class="btn btn-outline" style="margin-top:1.5rem;border-color:rgba(255,255,255,0.5);" onclick="tutupModal()">Tutup</button>
      </div>
    `;
    document.getElementById('hasilKonfirmasi').classList.remove('hidden');

  } catch (err) {
    showAlert(alertEl, 'error', 'Terjadi kesalahan. Coba lagi.');
    btn.disabled = false;
    btn.textContent = '✅ Konfirmasi Booking';
  }
}
