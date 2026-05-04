"""
Ekstraksi Tweets dari Raw JSON Twitter API
Input: File JSON mentah dari Network tab (SearchTimeline response)
Output: File JSON bersih dengan tweets yang sudah diekstrak
"""

import json
import os
import sys

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
    except (KeyError, TypeError) as e:
        print(f"⚠️  Warning: Error parsing response - {e}")
    
    return tweets

def process_file(input_file, output_file=None, delete_after=False):
    """Process single JSON file"""
    if not output_file:
        # Auto-generate output filename
        base_name = os.path.splitext(input_file)[0]
        output_file = f"{base_name}_extracted.json"
    
    print(f"📄 Processing: {input_file}")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        tweets = extract_tweets_from_response(data)
        
        if tweets:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(tweets, f, ensure_ascii=False, indent=2)
            
            print(f"  ✅ Berhasil! {len(tweets)} tweets")
            print(f"  💾 Output: {output_file}")
            
            # Delete raw file if requested
            if delete_after:
                try:
                    os.remove(input_file)
                    print(f"  🗑️  Raw file dihapus: {input_file}")
                except Exception as e:
                    print(f"  ⚠️  Gagal menghapus raw file: {e}")
            
            return len(tweets)
        else:
            print(f"  ⚠️  Tidak ada tweets ditemukan")
            return 0
    
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return 0

def process_folder(folder_path, pattern="*.json", delete_after=False):
    """Process all JSON files in folder"""
    from pathlib import Path
    
    folder = Path(folder_path)
    json_files = list(folder.glob(pattern))
    
    if not json_files:
        print(f"❌ Tidak ada file JSON di folder: {folder_path}")
        return
    
    print(f"📁 Ditemukan {len(json_files)} file JSON\n")
    
    total_tweets = 0
    successful_files = 0
    
    for json_file in json_files:
        count = process_file(str(json_file), delete_after=delete_after)
        if count > 0:
            total_tweets += count
            successful_files += 1
        print()
    
    print("="*60)
    print(f"✅ Selesai!")
    print(f"  - File berhasil: {successful_files}/{len(json_files)}")
    print(f"  - Total tweets: {total_tweets}")
    print("="*60)

# ================= MAIN =================

if __name__ == "__main__":
    print("="*60)
    print("🔧 EKSTRAKSI TWEETS DARI RAW JSON")
    print("="*60)
    
    # Check for --delete flag
    delete_after = "--delete" in sys.argv
    if delete_after:
        sys.argv.remove("--delete")
    
    if len(sys.argv) < 2:
        print("\n📖 Cara Pakai:")
        print("  1. Single file:")
        print("     python extract_tweets.py input.json [output.json] [--delete]")
        print("\n  2. Folder (semua JSON):")
        print("     python extract_tweets.py folder_path/ [--delete]")
        print("\n  3. Folder dengan pattern:")
        print("     python extract_tweets.py folder_path/ raw_*.json [--delete]")
        print("\n  Opsi:")
        print("     --delete : Hapus file raw setelah berhasil diekstrak")
        print("="*60)
        sys.exit(1)
    
    input_path = sys.argv[1]
    
    if os.path.isfile(input_path):
        # Single file mode
        output_file = sys.argv[2] if len(sys.argv) >= 3 and not sys.argv[2].startswith('--') else None
        process_file(input_path, output_file, delete_after=delete_after)
    
    elif os.path.isdir(input_path):
        # Folder mode
        pattern = sys.argv[2] if len(sys.argv) >= 3 and not sys.argv[2].startswith('--') else "*.json"
        process_folder(input_path, pattern, delete_after=delete_after)
    
    else:
        print(f"❌ File/folder tidak ditemukan: {input_path}")
