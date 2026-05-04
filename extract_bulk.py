"""
Ekstraksi Tweets dari Bulk JSON (Array of Responses)
Input: File JSON yang berisi array of response objects
Output: File JSON dengan tweets yang sudah diekstrak
"""

import json
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
    except (KeyError, TypeError):
        pass
    
    return tweets

def process_bulk_file(input_file, output_file):
    """Process bulk JSON file (array of responses)"""
    
    print("="*60)
    print("🔧 EKSTRAKSI TWEETS DARI BULK JSON")
    print("="*60)
    print(f"📄 Input file: {input_file}")
    print(f"💾 Output file: {output_file}")
    
    try:
        # Baca file bulk JSON
        with open(input_file, 'r', encoding='utf-8') as f:
            responses = json.load(f)
        
        if not isinstance(responses, list):
            print("❌ Error: File harus berisi array of responses")
            return False
        
        print(f"📊 Total responses: {len(responses)}")
        print("\n🔄 Memproses responses...")
        
        all_tweets = []
        successful_responses = 0
        
        for i, response in enumerate(responses, 1):
            try:
                tweets = extract_tweets_from_response(response)
                if tweets:
                    all_tweets.extend(tweets)
                    successful_responses += 1
                    print(f"  ✓ Response #{i}: {len(tweets)} tweets")
                else:
                    print(f"  ✗ Response #{i}: Tidak ada tweets")
            except Exception as e:
                print(f"  ✗ Response #{i}: Error - {e}")
        
        # Remove duplicates
        print(f"\n🔍 Menghapus duplikat...")
        seen_ids = set()
        unique_tweets = []
        
        for tweet in all_tweets:
            tweet_id = tweet.get('id')
            if tweet_id and tweet_id not in seen_ids:
                seen_ids.add(tweet_id)
                unique_tweets.append(tweet)
        
        duplicates = len(all_tweets) - len(unique_tweets)
        print(f"  Total tweets: {len(all_tweets)}")
        print(f"  Duplikat dihapus: {duplicates}")
        print(f"  Tweets unik: {len(unique_tweets)}")
        
        # Simpan hasil
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(unique_tweets, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Hasil disimpan di: {output_file}")
        print("="*60)
        print("✅ SELESAI!")
        print("="*60)
        print(f"\n📊 STATISTIK:")
        print(f"  - Responses diproses: {successful_responses}/{len(responses)}")
        print(f"  - Total tweets (dengan duplikat): {len(all_tweets)}")
        print(f"  - Total tweets (unik): {len(unique_tweets)}")
        print(f"  - File output: {output_file}")
        
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

def process_folder(folder_path, pattern="*_bulk*.json"):
    """Process all bulk JSON files in folder"""
    from pathlib import Path
    
    print("="*60)
    print("🔧 EKSTRAKSI BULK TWEETS DARI FOLDER")
    print("="*60)
    print(f"📁 Folder: {folder_path}")
    print(f"🔍 Pattern: {pattern}")
    
    folder = Path(folder_path)
    if not folder.exists():
        print(f"❌ Error: Folder tidak ditemukan: {folder_path}")
        return False
    
    # Cari semua file yang match pattern
    json_files = list(folder.glob(pattern))
    
    if not json_files:
        print(f"❌ Tidak ada file yang match pattern: {pattern}")
        return False
    
    print(f"\n📊 Ditemukan {len(json_files)} file:")
    for f in json_files:
        print(f"  - {f.name}")
    
    print(f"\n🔄 Memproses file...")
    
    successful_files = 0
    total_tweets = 0
    
    for json_file in json_files:
        input_file = str(json_file)
        output_file = input_file.replace('.json', '_extracted.json')
        
        print(f"\n📄 Processing: {json_file.name}")
        
        try:
            # Baca file bulk JSON
            with open(input_file, 'r', encoding='utf-8') as f:
                responses = json.load(f)
            
            if not isinstance(responses, list):
                print(f"  ✗ Error: File harus berisi array of responses")
                continue
            
            print(f"  📊 Total responses: {len(responses)}")
            
            all_tweets = []
            successful_responses = 0
            
            for i, response in enumerate(responses, 1):
                try:
                    tweets = extract_tweets_from_response(response)
                    if tweets:
                        all_tweets.extend(tweets)
                        successful_responses += 1
                except Exception:
                    pass
            
            # Remove duplicates
            seen_ids = set()
            unique_tweets = []
            
            for tweet in all_tweets:
                tweet_id = tweet.get('id')
                if tweet_id and tweet_id not in seen_ids:
                    seen_ids.add(tweet_id)
                    unique_tweets.append(tweet)
            
            # Simpan hasil
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(unique_tweets, f, ensure_ascii=False, indent=2)
            
            print(f"  ✅ Berhasil: {len(unique_tweets)} tweets unik")
            print(f"  💾 Output: {Path(output_file).name}")
            
            successful_files += 1
            total_tweets += len(unique_tweets)
            
        except Exception as e:
            print(f"  ✗ Error: {e}")
    
    print("\n" + "="*60)
    print("✅ SELESAI!")
    print("="*60)
    print(f"\n📊 STATISTIK:")
    print(f"  - File diproses: {successful_files}/{len(json_files)}")
    print(f"  - Total tweets: {total_tweets}")
    print("="*60)
    
    return True

if __name__ == "__main__":
    import os
    
    if len(sys.argv) < 2:
        print("\n📖 Cara Pakai:")
        print("  1. Single file:")
        print("     python extract_bulk.py input.json [output.json]")
        print("\n  2. Folder (semua file bulk):")
        print("     python extract_bulk.py folder_path/")
        print("\n  3. Folder dengan pattern:")
        print("     python extract_bulk.py folder_path/ *_bulk*.json")
        print("\nContoh:")
        print("  python extract_bulk.py raw_json/twitter_bulk.json")
        print("  python extract_bulk.py raw_json/")
        print("  python extract_bulk.py raw_json/ twitter_*.json")
        sys.exit(1)
    
    input_path = sys.argv[1]
    
    # Check if input is file or folder
    if os.path.isfile(input_path):
        # Single file mode
        output_file = sys.argv[2] if len(sys.argv) >= 3 else input_path.replace('.json', '_extracted.json')
        process_bulk_file(input_path, output_file)
    
    elif os.path.isdir(input_path):
        # Folder mode
        pattern = sys.argv[2] if len(sys.argv) >= 3 else "*_bulk*.json"
        process_folder(input_path, pattern)
    
    else:
        print(f"❌ File/folder tidak ditemukan: {input_path}")
