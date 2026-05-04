# Flowchart Proses Pengumpulan Data

Berikut adalah *source code* Mermaid yang dapat Anda salin (copy) langsung ke dalam file Markdown, Notion, Draw.io, atau alat pembuatan diagram lainnya yang mendukung sintaks Mermaid. Anda juga dapat menggunakan *tools* online seperti [Mermaid Live Editor](https://mermaid.live/) untuk mengubahnya menjadi gambar (PNG/JPG) yang bisa disisipkan ke file Word laporan skripsi Anda.

```mermaid
flowchart TD
    Start([Mulai: Pencarian Topik di Twitter/X]) --> P1[Jalankan Script Auto-Capture\nvia Browser DevTools Console]
    
    P1 --> D1[/"Data Mentah (Raw Response)"\n(twitter_bulk_responses.json)/]
    
    D1 --> P2[Ekstraksi Atribut Tweet\n(extract_bulk.py)]
    
    P2 --> D2[/"Data Tweet Terekstraksi"\n(*_extracted.json)/]
    
    D2 --> P3[Penggabungan Data &\nPenghapusan Duplikat\n(combine_json.py)]
    
    P3 --> D3[/"Data Tweet Bersih"\n(all_tweets_combined.json)/]
    
    D3 --> P4[Konversi Format ke CSV\n(json_to_csv.py)]
    
    P4 --> D4[/"Dataset Akhir"\n(all_tweets_combined.csv)/]
    
    D4 --> End([Selesai: Dataset Siap Dianalisis])

    %% Styling (Opsional, agar terlihat lebih rapi di laporan)
    classDef startEnd fill:#f9d0c4,stroke:#333,stroke-width:2px;
    classDef process fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef data fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;
    
    class Start,End startEnd;
    class P1,P2,P3,P4 process;
    class D1,D2,D3,D4 data;
```

### Penjelasan Flowchart (Bisa Dikutip di Laporan Skripsi):
1. **Mulai**: Tahapan diawali dengan mencari topik/keyword yang ditentukan pada fitur *search* Twitter.
2. **Auto-Capture**: Menjalankan *script* JavaScript pada *console* browser untuk melakukan *intercept* pada setiap *request* `SearchTimeline` Twitter. Hasil dari tahapan ini adalah file berformat JSON mentah.
3. **Ekstraksi Atribut**: Menggunakan *script* `extract_bulk.py` untuk mengurai struktur *response* Twitter yang kompleks dan mengekstrak elemen-elemen spesifik yang dibutuhkan (seperti teks tweet, *username*, tanggal, metrik interaksi, dll), menghasilkan file `_extracted.json`.
4. **Penggabungan Data dan Penghapusan Duplikat**: Proses ini ditangani oleh `combine_json.py` yang akan menyatukan berbagai *batch* hasil *scraping* ke dalam satu file. Pada saat yang sama, *script* memeriksa `id` tweet untuk menyeleksi dan membuang tweet yang sama (*duplikat*).
5. **Konversi Format**: Tahapan terakhir menggunakan `json_to_csv.py` mengubah format JSON menjadi *Comma-Separated Values* (CSV). Hal ini mempermudah proses pemuatan (*loading*) dan analisis dataset ke dalam *software* statistik atau *dataframe* (seperti Pandas pada Python) pada tahapan penelitian berikutnya.
6. **Selesai**: Diperoleh dataset akhir yang bersih dan terstruktur siap digunakan.
