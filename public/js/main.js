// ── Navbar toggle ──
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ── Alert helper ──
function showAlert(el, type, message) {
  el.className = `alert alert-${type} show`;
  el.textContent = message;
  if (type === 'success') {
    setTimeout(() => { el.classList.remove('show'); }, 5000);
  }
}

// ── Format Rupiah ──
function formatRupiah(angka) {
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
}

// ── Format tanggal ──
function formatTanggal(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Tutup modal saat klik overlay ──
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('modalBooking');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) tutupModal();
    });
  }
});
