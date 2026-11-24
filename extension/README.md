# ⚡ Social Stream Scraper - Browser Extension (Manifest V3)

Ekstensi browser universal untuk menangkap (*intercept*) data payload secara otomatis dari web media sosial langsung dari sisi client (browser), tanpa memerlukan F12 Developer Tools atau salin-tempel skrip manual di Console.

---

## 🚀 Fitur Utama
1. **Menu Grid Multi-Platform:**
   - **X (Twitter)** [Aktif & Siap Pakai]
   - **Instagram, TikTok, YouTube, Reddit, Facebook** [Siap dikembangkan untuk ekspansi masa depan]
2. **Auto-Capture XHR/Fetch:**
   - Secara otomatis mencegat request `SearchTimeline` Twitter saat Anda scrolling feed pencarian.
3. **Live Monitor & Counter:**
   - Menghitung jumlah responses (chunk) dan estimasi tweet yang terkumpul secara real-time.
4. **Stop & Direct Save:**
   - Satu klik tombol **"Stop & Simpan JSON"** langsung mengunduh file `.json` bersih ke folder Downloads komputer Anda.
5. **Obsidian Precision Theme:**
   - Tampilan popup gelap modern yang selaras dengan web dashboard.

---

## 📦 Cara Memasang di Browser (Chrome / Edge / Brave)

1. Buka browser Chromium favorit Anda (Google Chrome, Microsoft Edge, atau Brave).
2. Masuk ke halaman pengelolaan ekstensi:
   * **Chrome / Brave:** Ketik `chrome://extensions` di address bar lalu tekan Enter.
   * **Edge:** Ketik `edge://extensions` di address bar lalu tekan Enter.
3. Di pojok kanan atas, aktifkan tombol **Developer mode** (Mode Pengembang).
4. Klik tombol **Load unpacked** (Muat yang belum dibongkar) di pojok kiri atas.
5. Pilih folder:
   ```
   d:\Skripsi dan Metopen\Metopen Ngulang\Scraping Dataset\extension
   ```
6. Selesai! Ikon petir **Social Stream Scraper** akan muncul di toolbar browser Anda. Sematkan (pin) agar mudah diakses.

---

## 🎯 Cara Penggunaan
1. Buka halaman pencarian topik di Twitter: `https://x.com/search?q=topik_anda&f=live`.
2. Klik ikon ekstensi **Social Stream Scraper**.
3. Pastikan platform terpilih adalah **X / Twitter**.
4. Klik **Mulai Capture** (status berubah menjadi `STREAMING`).
5. Scroll feed Twitter ke bawah secara santai agar tweet-tweet baru termuat. Indikator di popup akan bertambah secara real-time.
6. Jika sudah cukup, klik **Stop & Simpan JSON**. File `twitter_bulk_X_responses.json` akan otomatis terunduh.
7. Buka Web Dashboard Anda dan tarik berkas JSON tersebut ke kotak dropzone untuk langsung memvisualisasikan dan mengekspornya ke CSV!
