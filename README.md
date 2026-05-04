# Twitter Scraping Dataset Pipeline

Proyek ini menyediakan alur kerja (pipeline) lengkap untuk melakukan scraping data dari Twitter (X) menggunakan metode intercept XHR di browser, lalu mengekstraksi, menggabungkan, dan mengonversi data tersebut menjadi format CSV yang siap digunakan untuk analisis data (misalnya untuk keperluan skripsi atau penelitian).

## 🚀 Fitur Utama
1. **Auto-Capture JSON:** Skrip JavaScript untuk mencegat dan menyimpan *response* JSON langsung dari web Twitter tanpa memerlukan API berbayar.
2. **Ekstraksi Data (`extract_bulk.py`):** Mengambil detail tweet penting (seperti teks, username, tanggal, likes, retweets, views, dan URL) dari response mentah Twitter.
3. **Penggabungan & Deduplikasi (`combine_json.py`):** Menggabungkan beberapa file JSON hasil ekstraksi dan secara otomatis menghapus tweet yang duplikat berdasarkan ID Tweet.
4. **Konversi ke CSV (`json_to_csv.py`):** Mengubah data JSON yang sudah bersih menjadi format CSV agar mudah diolah di Excel, Pandas, SPSS, atau *tools* analisis lainnya.

## 📋 Persyaratan
- Web Browser (Chrome/Edge/Firefox) untuk menjalankan skrip capture di tab Console.
- Python 3.x terinstal di sistem komputer Anda.

---

## 📖 Panduan Penggunaan (Tutorial)

### Langkah 1: Mengambil Data dari Twitter (Auto-Capture)
Buka browser, cari topik yang ingin Anda *scrape* di halaman pencarian Twitter, lalu buka **Developer Tools** (Tekan `F12` atau klik kanan -> Inspect) dan masuk ke tab **Console**. Paste dan jalankan (*Enter*) kode JavaScript berikut:

```javascript
let responseCount = 0;
let allResponses = [];

// Fungsi untuk save manual
window.saveTwitterData = function() {
    if (allResponses.length === 0) {
        console.log('❌ Tidak ada data untuk disimpan!');
        return;
    }
    
    const blob = new Blob([JSON.stringify(allResponses, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twitter_bulk_${responseCount}_responses.json`;
    a.click();
    console.log(`💾 Saved ${responseCount} responses!`);
};

// Fungsi untuk stop capture
window.stopCapture = function() {
    console.log('🛑 Capture stopped!');
    console.log(`📊 Total responses captured: ${responseCount}`);
    window.saveTwitterData();
};

// Intercept XMLHttpRequest
(function() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        return originalOpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function() {
        this.addEventListener('load', function() {
            if (this._url && this._url.includes('SearchTimeline') && this.status === 200) {
                try {
                    const data = JSON.parse(this.responseText);
                    responseCount++;
                    allResponses.push(data);
                    console.log(`✅ Response #${responseCount} captured!`);
                } catch (e) {}
            }
        });
        return originalSend.apply(this, arguments);
    };
})();

console.log('🎯 Auto-capture started!');
console.log('📋 Commands:');
console.log('  - saveTwitterData()  → Save data sekarang');
console.log('  - stopCapture()      → Stop dan save data');
console.log('  - responseCount      → Lihat jumlah responses');
```
Setelah kode dijalankan, **scroll halaman Twitter ke bawah** secara manual untuk memuat tweet-tweet baru. Skrip akan secara otomatis menangkap datanya.
Gunakan perintah berikut di *Console* untuk menyimpan datanya:
- Ketik `saveTwitterData()` dan Enter -> Menyimpan data yang sudah terkumpul saat ini.
- Ketik `stopCapture()` dan Enter -> Menghentikan capture dan menyimpan data keseluruhan.

### Langkah 2: Ekstraksi Data Tweet
Setelah file JSON mentah berhasil diunduh, ekstrak data tweet-nya dengan `extract_bulk.py`. Buka terminal (CMD/PowerShell/Bash) di folder project ini lalu jalankan:

```bash
# Untuk mengekstrak satu file spesifik:
python extract_bulk.py [nama_file.json]

# Untuk mengekstrak seluruh file yang ada di dalam sebuah folder:
python extract_bulk.py [nama_folder]/
```
*File keluaran (output) akan tersimpan dengan akhiran `_extracted.json`.*

### Langkah 3: Menggabungkan dan Menghapus Duplikat
Jika Anda melakukan scraping berulang kali dan memiliki banyak file ekstraksi, gabungkan semuanya dan buang data yang *double* dengan `combine_json.py`.

```bash
python combine_json.py
```
*Skrip ini akan mencari file yang sesuai, menggabungkannya dengan `all_tweets_combined.json` yang ada, dan membuang tweet duplikat.*

### Langkah 4: Konversi ke Format CSV
Langkah terakhir untuk mempermudah analisis, konversi file JSON gabungan tersebut menjadi tabel CSV.

```bash
python json_to_csv.py
```
*Skrip ini secara otomatis akan membaca `all_tweets_combined.json` dan menghasilkan file `all_tweets_combined.csv` dengan rapi.*
