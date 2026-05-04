"""
Script untuk menggabungkan multiple file JSON hasil scraping
dan menghapus duplikat berdasarkan tweet ID
"""

import json
import os
import sys
from pathlib import Path

# ================= KONFIGURASI =================

# Folder tempat file JSON hasil scraping berada
INPUT_FOLDER = "."  # Current directory, atau ganti dengan path folder

# Pattern nama file yang akan digabungkan
# Contoh: "*_extracted.json" untuk file hasil ekstraksi
# Atau: "shopee_*.json" untuk file raw
FILE_PATTERN = "raw_json/*.json"

# Output file
OUTPUT_FILE = "extracted_json/all_tweets_combined.json"

# ================= FUNGSI EKSTRAKSI =================

def load_existing_tweets(output_file):
    """Load tweets yang sudah ada di file output"""
    if os.path.exists(output_file):
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                existing_tweets = json.load(f)
                if isinstance(existing_tweets, list):
                    print(f"📥 Memuat tweets yang sudah ada: {len(existing_tweets)} tweets")
                    return existing_tweets
        except Exception as e:
            print(f"⚠️  Gagal membaca file output yang ada: {e}")
    return []

def extract_tweets_from_response(data):
    """Ekstrak tweets dari raw response JSON Twitter API"""
    tweets = []
    
    try:
        instructions = data['data']['search_by_raw_query']['search_timeline']['timeline']['instructions']
        
        for instr in instructions:
            if instr.get('type') == 'TimelineAddEntries':
                entries = instr.get('entries', [])
                
                for entry in entries:
                    entry_id = entry.get('entryId', '')
                    
                    if entry_id.startswith('tweet-'):
                        try:
                            content = entry['content']
                            item_content = content['itemContent']
                            tweet_results = item_content['tweet_results']['result']
                            
                            legacy = tweet_results.get('legacy', {})
                            user_core = tweet_results.get('core', {}).get('user_results', {}).get('result', {}).get('core', {})
                            
                            username = user_core.get('screen_name', '')
                            user_name = user_core.get('name', '')
                            tweet_id = legacy.get('id_str', '')
                            
                            tweet_obj = {
                                'id': tweet_id,
                                'full_text': legacy.get('full_text', ''),
                                'created_at': legacy.get('created_at', ''),
                                'username': username,
                                'user_name': user_name,
                                'likes': legacy.get('favorite_count', 0),
                                'retweets': legacy.get('retweet_count', 0),
                                'replies': legacy.get('reply_count', 0),
                                'views': tweet_results.get('views', {}).get('count', '0'),
                                'tweet_url': f"https://twitter.com/{username}/status/{tweet_id}" if username and tweet_id else ''
                            }
                            
                            tweets.append(tweet_obj)
                        except (KeyError, TypeError):
                            continue
    except (KeyError, TypeError):
        pass
    
    return tweets

def remove_duplicates(tweets):
    """Remove duplicate tweets based on tweet ID"""
    seen_ids = set()
    unique_tweets = []
    
    for tweet in tweets:
        tweet_id = tweet.get('id')
        if tweet_id and tweet_id not in seen_ids:
            seen_ids.add(tweet_id)
            unique_tweets.append(tweet)
    
    return unique_tweets

# ================= MAIN =================

def main():
    print("="*60)
    print("📦 PENGGABUNG FILE JSON TWITTER")
    print("="*60)
    
    # Check for help flag
    if len(sys.argv) > 1 and sys.argv[1] in ['-h', '--help', 'help']:
        print("\n📖 Cara Pakai:")
        print("  python combine_json.py")
        print("\n📝 Deskripsi:")
        print("  - Menggabungkan semua file *_extracted.json di folder raw_json/")
        print("  - Menghapus duplikat berdasarkan tweet ID")
        print("  - Menggabungkan dengan tweets yang sudah ada di output file")
        print("  - Otomatis menghapus file _extracted.json setelah digabungkan")
        print("\n📂 Konfigurasi:")
        print(f"  - Input folder: {FILE_PATTERN}")
        print(f"  - Output file: {OUTPUT_FILE}")
        print("="*60)
        return
    
    delete_after = "--delete" in sys.argv
    if delete_after:
        sys.argv.remove("--delete")
        
    # Cari semua file JSON yang match pattern
    folder_path = Path(INPUT_FOLDER)
    json_files = list(folder_path.glob(FILE_PATTERN))
    
    if not json_files:
        print(f"\n❌ Tidak ada file yang match pattern: {FILE_PATTERN}")
        print(f"   Di folder: {folder_path.absolute()}")
        return
    
    print(f"\n📁 Ditemukan {len(json_files)} file:")
    for f in json_files:
        print(f"  - {f.name}")
    
    print(f"\n🔄 Memproses file...")
    
    # Load existing tweets from output file
    all_tweets = load_existing_tweets(OUTPUT_FILE)
    successful_files = 0
    files_deleted = 0
    files_to_delete = []  # Track files yang berhasil diproses
    
    for json_file in json_files:
        file_processed = False
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                # Deteksi format file
                if isinstance(data, list):
                    # Format extracted tweets (array of tweet objects)
                    tweets = data
                    print(f"  ✓ {json_file.name}: {len(tweets)} tweets (extracted format)")
                elif isinstance(data, dict) and 'data' in data:
                    # Format raw response
                    tweets = extract_tweets_from_response(data)
                    print(f"  ✓ {json_file.name}: {len(tweets)} tweets (raw format)")
                else:
                    print(f"  ✗ {json_file.name}: Format tidak dikenali")
                    continue
                
                all_tweets.extend(tweets)
                successful_files += 1
                file_processed = True
                    
        except Exception as e:
            print(f"  ✗ {json_file.name}: Error - {e}")
        
        # Hapus file setelah file handle sudah tertutup
        if file_processed:
            files_to_delete.append(json_file)
    
    # Hapus semua file yang berhasil diproses
    print(f"\n🗑️  Menghapus file ekstraksi...")
    for json_file in files_to_delete:
        try:
            json_file.unlink()
            print(f"  ✓ Dihapus: {json_file.name}")
            files_deleted += 1
        except OSError as e:
            print(f"  ✗ Gagal menghapus {json_file.name}: {e}")
    
    # Remove duplicates
    print(f"\n🔍 Menghapus duplikat...")
    unique_tweets = remove_duplicates(all_tweets)
    duplicates_removed = len(all_tweets) - len(unique_tweets)
    
    print(f"  Total tweets: {len(all_tweets)}")
    print(f"  Duplikat dihapus: {duplicates_removed}")
    print(f"  Tweets unik: {len(unique_tweets)}")
    
    # Simpan hasil
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(unique_tweets, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Hasil disimpan di: {OUTPUT_FILE}")
    print("="*60)
    print("✅ SELESAI!")
    print("="*60)
    
    # Statistik
    print(f"\n📊 STATISTIK:")
    print(f"  - File diproses: {successful_files}/{len(json_files)}")
    print(f"  - File dihapus: {files_deleted}/{successful_files}")
    print(f"  - Total tweets (dengan duplikat): {len(all_tweets)}")
    print(f"  - Total tweets (unik): {len(unique_tweets)}")
    print(f"  - File output: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
