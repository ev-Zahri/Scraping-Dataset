from google_play_scraper import reviews, Sort
import pandas as pd
from datetime import datetime
import time

app_id = "com.mobile.legends"

# Rentang tanggal
start_date = datetime(2020, 1, 1)
end_date   = datetime(2025, 12, 31)

all_reviews = []
token = None
batch_count = 0

print(f"Memulai scraping untuk app: {app_id}")
print(f"Rentang tanggal: {start_date.date()} sampai {end_date.date()}")
print("=" * 50)

try:
    while True:
        batch_count += 1
        print(f"\nBatch #{batch_count}: Mengambil data...")
        
        try:
            result, token = reviews(
                app_id,
                lang="id",
                country="id",
                sort=Sort.NEWEST,
                count=200,
                continuation_token=token
            )
            
            print(f"  ✓ Berhasil mengambil {len(result)} review")
            
        except Exception as e:
            print(f"  ✗ Error saat mengambil data: {e}")
            break

        if not result:
            print("  → Tidak ada data lagi")
            break

        filtered_count = 0
        for r in result:
            review_date = r["at"]

            # Jika review masih dalam rentang
            if start_date <= review_date <= end_date:
                all_reviews.append(r)
                filtered_count += 1

            # Jika sudah lebih lama dari batas awal → STOP
            elif review_date < start_date:
                print(f"  → Review sudah melewati batas awal ({review_date.date()})")
                token = None
                break

        print(f"  → {filtered_count} review sesuai rentang")
        print(f"  → Total terkumpul: {len(all_reviews)} review")

        if token is None:
            print("\n✓ Selesai mengambil semua data")
            break

        print("  → Menunggu 2 detik...")
        time.sleep(2)  # Hindari block IP

except KeyboardInterrupt:
    print("\n\n⚠ Proses dihentikan oleh user")
except Exception as e:
    print(f"\n\n✗ Error tidak terduga: {e}")

print("\n" + "=" * 50)
print(f"Total komentar sesuai rentang: {len(all_reviews)}")

if len(all_reviews) > 0:
    df = pd.DataFrame(all_reviews)

    df = df[[
        "userName",
        "score",
        "content",
        "at",
        "replyContent"
    ]]

    output_file = "komentar_mobile_legends_2020_2025.csv"
    df.to_csv(
        output_file,
        index=False,
        encoding="utf-8"
    )

    print(f"✓ File berhasil disimpan: {output_file}")
    print(f"  → Total baris: {len(df)}")
else:
    print("⚠ Tidak ada data untuk disimpan")
