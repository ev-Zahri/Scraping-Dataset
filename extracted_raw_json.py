"""
Ekstraksi, Penggabungan, dan Konversi Tweet JSON ke CSV
Script ini menggabungkan fungsi dari extract_bulk.py, combine_json.py, dan json_to_csv.py.
Input: File tunggal atau folder berisi file JSON (raw response atau extracted tweets)
Output: File JSON gabungan dan file CSV
"""

import json
import csv
import sys
import os
from pathlib import Path
import argparse

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

def load_existing_tweets(output_file):
    """Load tweets yang sudah ada di file output"""
    if os.path.exists(output_file):
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                existing_tweets = json.load(f)
                if isinstance(existing_tweets, list):
                    print(f"📥 Memuat {len(existing_tweets)} tweets yang sudah ada dari {output_file}")
                    return existing_tweets
        except Exception as e:
            print(f"⚠️  Gagal membaca file output yang ada: {e}")
    return []

def json_to_csv(tweets, output_file):
    print(f"💾 Menyimpan data ke CSV: {output_file}")
    try:
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(
                f, 
                fieldnames=CSV_COLUMNS,
                quoting=csv.QUOTE_ALL,  
                escapechar='\\'
            )
            
            writer.writeheader()
            for tweet in tweets:
                row = {col: tweet.get(col, '') for col in CSV_COLUMNS}
                writer.writerow(row)
        
        print(f"✅ Berhasil mengekspor ke CSV")
        return True
    except Exception as e:
        print(f"❌ Error saat menyimpan CSV: {e}")
        return False

def process_data(input_path, output_json, output_csv, pattern="*.json", delete_after=False):
    print("="*60)
    print("🚀 EKSTRAKSI, PENGGABUNGAN, DAN KONVERSI TWEETS")
    print("="*60)
    
    all_tweets = []
    if output_json:
        all_tweets = load_existing_tweets(output_json)
    
    json_files = []
    input_p = Path(input_path)
    
    if input_p.is_file():
        json_files.append(input_p)
        print(f"📄 Memproses single file: {input_path}")
    elif input_p.is_dir():
        json_files = list(input_p.glob(pattern))
        print(f"📁 Ditemukan {len(json_files)} file di folder '{input_path}' (Pattern: {pattern})")
    else:
        print(f"❌ Input path tidak ditemukan: {input_path}")
        return
        
    if not json_files:
        print("❌ Tidak ada file untuk diproses.")
        return

    successful_files = 0
    files_to_delete = []
    
    print("\n🔄 Mulai memproses file...")
    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                tweets = []
                # Deteksi format: bulk array of responses, single response, or array of extracted tweets
                if isinstance(data, list):
                    if len(data) > 0 and isinstance(data[0], dict) and 'data' in data[0]:
                        # Bulk format (array of raw responses)
                        for response in data:
                            tweets.extend(extract_tweets_from_response(response))
                        print(f"  ✓ {json_file.name}: {len(tweets)} tweets (bulk raw format)")
                    else:
                        # Extracted format (array of tweet objects)
                        tweets = data
                        print(f"  ✓ {json_file.name}: {len(tweets)} tweets (extracted format)")
                elif isinstance(data, dict) and 'data' in data:
                    # Single raw response
                    tweets = extract_tweets_from_response(data)
                    print(f"  ✓ {json_file.name}: {len(tweets)} tweets (single raw format)")
                else:
                    print(f"  ✗ {json_file.name}: Format JSON tidak dikenali")
                    continue
                
                if tweets:
                    all_tweets.extend(tweets)
                    successful_files += 1
                    files_to_delete.append(json_file)
                    
        except Exception as e:
            print(f"  ✗ {json_file.name}: Error - {e}")
            
    # Hapus duplikat
    print("\n🔍 Menghapus duplikat...")
    initial_count = len(all_tweets)
    unique_tweets = remove_duplicates(all_tweets)
    duplicates = initial_count - len(unique_tweets)
    
    print(f"  Total tweets (sebelum unik): {initial_count}")
    print(f"  Duplikat dihapus         : {duplicates}")
    print(f"  Total tweets unik        : {len(unique_tweets)}")
    
    if len(unique_tweets) == 0:
        print("\n⚠️  Tidak ada tweets yang diekstrak. Menghentikan proses.")
        return

    print()
    # Simpan ke JSON
    if output_json:
        print(f"💾 Menyimpan data JSON: {output_json}")
        try:
            out_p = Path(output_json)
            out_p.parent.mkdir(parents=True, exist_ok=True)
            with open(output_json, 'w', encoding='utf-8') as f:
                json.dump(unique_tweets, f, ensure_ascii=False, indent=2)
            print(f"✅ Berhasil menyimpan JSON")
        except Exception as e:
            print(f"❌ Error saat menyimpan JSON: {e}")
            
    # Simpan ke CSV
    if output_csv:
        json_to_csv(unique_tweets, output_csv)
        
    # Hapus file asal jika opsi aktif
    if delete_after and files_to_delete:
        print("\n🗑️  Menghapus file sumber...")
        for f in files_to_delete:
            try:
                f.unlink()
                print(f"  ✓ Dihapus: {f.name}")
            except Exception as e:
                print(f"  ✗ Gagal menghapus {f.name}: {e}")

    print("\n" + "="*60)
    print("✅ PROSES SELESAI!")
    print("="*60)
    print(f"📊 File diproses : {successful_files}/{len(json_files)}")
    print(f"📊 Tweets unik   : {len(unique_tweets)}")

def main():
    parser = argparse.ArgumentParser(description="Ekstraksi, Penggabungan, dan Konversi Tweet JSON ke CSV")
    parser.add_argument("input", help="Path ke file tunggal atau folder berisi JSON")
    parser.add_argument("--json", default="extracted_json/all_tweets_combined.json", help="Path output file JSON (default: extracted_json/all_tweets_combined.json)")
    parser.add_argument("--csv", default="extracted_json/all_tweets_combined.csv", help="Path output file CSV (default: extracted_json/all_tweets_combined.csv)")
    parser.add_argument("--pattern", default="*.json", help="Pattern file jika input adalah folder (default: *.json)")
    parser.add_argument("--delete", action="store_true", help="Hapus file sumber setelah berhasil diproses")
    
    # Jika tidak ada argumen, tampilkan cara penggunaan (help)
    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(1)
        
    args = parser.parse_args()
    
    process_data(args.input, args.json, args.csv, args.pattern, args.delete)

if __name__ == "__main__":
    main()
