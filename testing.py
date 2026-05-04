from google_play_scraper import reviews, Sort
import pandas as pd
from datetime import datetime
import time

# Package name Mobile Legends
app_id = "com.mobile.legends"

# ============================================
# KONFIGURASI FILTERING
# ============================================
# Rentang tanggal yang diinginkan
start_date = datetime(2024, 1, 1)   # Dari tanggal ini
end_date = datetime(2026, 12, 31)   # Sampai tanggal ini

# Batasan pengambilan data (untuk menghindari loop terlalu lama)
MAX_REVIEWS_TO_FETCH = 1000  # Maksimal review yang akan diambil
TARGET_FILTERED = 1000       # Target jumlah review yang sudah difilter

# ============================================
# PROSES SCRAPING
# ============================================
print(f"📱 Memulai scraping: {app_id}")
print(f"📅 Rentang tanggal: {start_date.date()} s/d {end_date.date()}")
print(f"🎯 Target: {TARGET_FILTERED} review (maks fetch: {MAX_REVIEWS_TO_FETCH})")
print("=" * 60)

all_reviews = []
token = None
batch_num = 0
total_fetched = 0

while total_fetched < MAX_REVIEWS_TO_FETCH:
    batch_num += 1
    
    try:
        # Ambil batch review
        result, token = reviews(
            app_id,
            lang="id",
            country="id",
            sort=Sort.NEWEST,
            count=200,  # Ambil 200 per batch
            continuation_token=token
        )
        
        if not result:
            print(f"\n✓ Tidak ada data lagi di batch #{batch_num}")
            break
        
        total_fetched += len(result)
        all_reviews.extend(result)
        
        # Tampilkan progress setiap batch
        print(f"Batch #{batch_num}: +{len(result)} review (Total: {total_fetched})", end="")
        
        # Cek apakah sudah cukup
        if len(all_reviews) >= MAX_REVIEWS_TO_FETCH:
            print(f" → Mencapai batas maksimal")
            break
        
        # Cek tanggal review terakhir untuk optimasi
        last_date = result[-1]["at"]
        if last_date < start_date:
            print(f" → Review sudah melewati batas awal ({last_date.date()})")
            break
        
        print()  # New line
        
        if token is None:
            print(f"\n✓ Selesai - tidak ada token lanjutan")
            break
        
        time.sleep(1)  # Delay untuk menghindari rate limit
        
    except Exception as e:
        print(f"\n✗ Error di batch #{batch_num}: {e}")
        break

print("\n" + "=" * 60)
print(f"📊 Total review yang diambil: {len(all_reviews)}")

# ============================================
# POST-FILTERING BERDASARKAN TANGGAL
# ============================================
print("\n🔍 Memfilter berdasarkan tanggal...")

filtered_reviews = []
for review in all_reviews:
    review_date = review["at"]
    if start_date <= review_date <= end_date:
        filtered_reviews.append(review)

print(f"✓ Review setelah filtering: {len(filtered_reviews)}")

# ============================================
# SIMPAN KE CSV
# ============================================
if len(filtered_reviews) > 0:
    # Konversi ke DataFrame
    df = pd.DataFrame(filtered_reviews)
    
    # Pilih kolom penting
    df = df[[
        "userName",
        "score",
        "content",
        "at",
        "replyContent"
    ]]
    
    # Simpan ke CSV
    output_file = "komentar_mobile_legends.csv"
    df.to_csv(output_file, index=False, encoding="utf-8")
    
    print(f"\n✅ Berhasil menyimpan {len(df)} review ke '{output_file}'")
    print(f"\n📈 Preview data:")
    print(df.head())
    
    # Statistik tambahan
    print(f"\n📊 Statistik:")
    print(f"   • Tanggal tertua: {df['at'].min()}")
    print(f"   • Tanggal terbaru: {df['at'].max()}")
    print(f"   • Rating rata-rata: {df['score'].mean():.2f}")
else:
    print("\n⚠ Tidak ada review yang sesuai dengan filter tanggal")
