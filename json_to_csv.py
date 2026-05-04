"""
Konversi file JSON tweets ke format CSV
Input: File JSON dengan array of tweet objects
Output: File CSV dengan kolom-kolom tweet
"""

import json
import csv
import sys
import os
from pathlib import Path

# ================= KONFIGURASI =================

# Default input/output files
DEFAULT_INPUT = "extracted_json/all_tweets_combined.json"
DEFAULT_OUTPUT = "extracted_json/all_tweets_combined.csv"

# Kolom-kolom yang akan diekspor ke CSV
CSV_COLUMNS = [
    'id',
    'full_text',
    'created_at',
    'username',
    'user_name',
    'likes',
    'retweets',
    'replies',
    'views',
    'tweet_url'
]

# ================= FUNGSI KONVERSI =================

def json_to_csv(input_file, output_file=None):
    """Konversi JSON tweets ke CSV"""
    
    # Auto-generate output filename jika tidak disediakan
    if not output_file:
        base_name = os.path.splitext(input_file)[0]
        output_file = f"{base_name}.csv"
    
    print(f"📄 Input file: {input_file}")
    print(f"💾 Output file: {output_file}")
    
    try:
        # Baca file JSON
        with open(input_file, 'r', encoding='utf-8') as f:
            tweets = json.load(f)
        
        if not isinstance(tweets, list):
            print("❌ Error: File JSON harus berisi array of tweets")
            return False
        
        if len(tweets) == 0:
            print("⚠️  Warning: File JSON kosong, tidak ada tweets")
            return False
        
        print(f"📊 Total tweets: {len(tweets)}")
        
        # Buat folder output jika belum ada
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Tulis ke CSV
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(
                f, 
                fieldnames=CSV_COLUMNS,
                quoting=csv.QUOTE_ALL,  
                escapechar='\\'
            )
            
            # Tulis header
            writer.writeheader()
            
            # Tulis data tweets
            for tweet in tweets:
                # Ambil hanya kolom yang diperlukan
                row = {col: tweet.get(col, '') for col in CSV_COLUMNS}
                writer.writerow(row)
        
        print(f"✅ Berhasil! {len(tweets)} tweets diekspor ke CSV")
        return True
    
    except FileNotFoundError:
        print(f"❌ Error: File tidak ditemukan: {input_file}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ Error: File JSON tidak valid: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

# ================= MAIN =================

def main():
    print("="*60)
    print("📊 KONVERSI JSON KE CSV")
    print("="*60)
    
    # Check for help flag
    if len(sys.argv) > 1 and sys.argv[1] in ['-h', '--help', 'help']:
        print("\n📖 Cara Pakai:")
        print("  1. Menggunakan file default:")
        print("     python json_to_csv.py")
        print("\n  2. Dengan file input custom:")
        print("     python json_to_csv.py input.json")
        print("\n  3. Dengan file input dan output custom:")
        print("     python json_to_csv.py input.json output.csv")
        print("\n📂 Konfigurasi Default:")
        print(f"  - Input file: {DEFAULT_INPUT}")
        print(f"  - Output file: {DEFAULT_OUTPUT}")
        print("\n📋 Kolom CSV yang diekspor:")
        for col in CSV_COLUMNS:
            print(f"  - {col}")
        print("="*60)
        return
    
    # Tentukan input dan output file
    if len(sys.argv) >= 2:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) >= 3 else None
    else:
        input_file = DEFAULT_INPUT
        output_file = DEFAULT_OUTPUT
    
    print()
    
    # Konversi
    success = json_to_csv(input_file, output_file)
    
    print("="*60)
    if success:
        print("✅ SELESAI!")
    else:
        print("❌ GAGAL!")
    print("="*60)

if __name__ == "__main__":
    main()
