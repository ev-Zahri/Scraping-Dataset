Step 1
Buka browser (apapun) terus paste 

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
                    
                    // Auto-save setiap 10 response
                    // if (responseCount % 10 === 0) {
                    //     window.saveTwitterData();
                    // }
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

Selanjutnya kode di run dengan enter
D:\Skripsi dan Metopen\Metopen Ngulang\Dataset Okt 2025\Kode Program\testing.py
Operasinya:
- saveTwitterData() -> untuk menyimpan data (download)
- stopCapture() -> untuk menghentikan capture dan autosave semua data
- responseCount -> untuk melihat jumlah data yang tercapture

Setelah data didapatkan jalankan terminal dengan
1.  python extract_bulk.py [file.json] -> untuk mengekstraksi file dengan 1 file saja
    python .\extract_bulk.py [folder json] -> untuk mengekstraksi seluruh file yang ada di folder tersebut

2.  python combine_json.py -> untuk menggabungkan isi file yang sudah ada all_tweets_combined.json dengan file terbaru [file-bulk-extract.json] dari extract bulk

3.  python json_to_csv.py -> untuk mengubah format file menjadi csv