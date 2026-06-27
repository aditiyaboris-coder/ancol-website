// ── Load saat halaman dibuka ──
document.addEventListener('DOMContentLoaded', muatBukuTamu);

async function muatBukuTamu() {
  const container = document.getElementById('bukuTamuEntries');
  const totalEl = document.getElementById('totalEntri');
  container.innerHTML = '<div class="loading">Memuat entri buku tamu…</div>';
  try {
    const res = await fetch('/api/buku-tamu');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    const entries = json.data;
    totalEl.textContent = `${entries.length} kesan dari pengunjung`;

    if (entries.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:3rem;color:var(--gray-600);">
          <div style="font-size:3rem;margin-bottom:1rem;">📝</div>
          <p>Belum ada kesan. Jadilah yang pertama!</p>
        </div>`;
      return;
    }

    container.innerHTML = `<div class="entries-grid">${entries.map(e => `
      <div class="entry-card">
        <div class="entry-header">
          <div>
            <div class="entry-nama">${escapeHtml(e.nama)}</div>
            <div class="entry-kota">📍 ${escapeHtml(e.asal_kota)}</div>
          </div>
          <div class="entry-stars">${'★'.repeat(e.rating)}${'☆'.repeat(5 - e.rating)}</div>
        </div>
        <p class="entry-pesan">${escapeHtml(e.pesan)}</p>
        <div class="entry-tanggal">📅 ${formatTanggal(e.tanggal)}</div>
      </div>
    `).join('')}</div>`;

  } catch (err) {
    container.innerHTML = '<div class="alert alert-error show">Gagal memuat entri buku tamu.</div>';
  }
}

// ── Submit buku tamu ──
async function submitBukuTamu() {
  const alertEl = document.getElementById('alertBukuTamu');
  const btn = document.getElementById('btnSubmitTamu');

  const nama = document.getElementById('namaTamu').value.trim();
  const email = document.getElementById('emailTamu').value.trim();
  const asalKota = document.getElementById('asalKota').value.trim();
  const pesan = document.getElementById('pesanTamu').value.trim();
  const rating = document.querySelector('input[name="rating"]:checked')?.value || 5;

  if (!nama || !email || !asalKota || !pesan) {
    showAlert(alertEl, 'error', 'Harap isi semua field yang wajib diisi.');
    return;
  }
  if (pesan.length < 10) {
    showAlert(alertEl, 'error', 'Pesan terlalu pendek, minimal 10 karakter.');
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Mengirim...';

  try {
    const res = await fetch('/api/buku-tamu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, email, asal_kota: asalKota, pesan, rating: parseInt(rating) })
    });
    const json = await res.json();

    if (!json.success) {
      showAlert(alertEl, 'error', json.message);
      btn.disabled = false;
      btn.textContent = '✍️ Kirim Kesan';
      return;
    }

    showAlert(alertEl, 'success', '🎉 Terima kasih! Kesanmu telah disimpan.');
    document.getElementById('namaTamu').value = '';
    document.getElementById('emailTamu').value = '';
    document.getElementById('asalKota').value = '';
    document.getElementById('pesanTamu').value = '';

    btn.disabled = false;
    btn.textContent = '✍️ Kirim Kesan';

    // Reload entri
    setTimeout(muatBukuTamu, 500);

  } catch (err) {
    showAlert(alertEl, 'error', 'Terjadi kesalahan. Coba lagi.');
    btn.disabled = false;
    btn.textContent = '✍️ Kirim Kesan';
  }
}

// ── Escape HTML untuk keamanan ──
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
