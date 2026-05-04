from google_play_scraper import reviews, Sort
from datetime import datetime

app_id = "com.mobile.legends"

print(f"Mengambil sample review untuk melihat tanggal...")
print("=" * 50)

result, token = reviews(
    app_id,
    lang="id",
    country="id",
    sort=Sort.NEWEST,
    count=10
)

print(f"\nBerhasil mengambil {len(result)} review\n")

for i, r in enumerate(result, 1):
    review_date = r["at"]
    print(f"{i}. Tanggal: {review_date}")
    print(f"   Score: {r['score']}")
    print(f"   User: {r['userName']}")
    print(f"   Preview: {r['content'][:50]}...")
    print()

print("=" * 50)
print(f"Tanggal review terbaru: {result[0]['at']}")
print(f"Tanggal review terlama (dari 10 sample): {result[-1]['at']}")
