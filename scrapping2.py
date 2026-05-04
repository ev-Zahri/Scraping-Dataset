import requests
import json
import re
import time

# ================= KONFIGURASI =================

# 1. URL
url = "https://x.com/i/api/graphql/M1jEez78PEfVfbQLvlWMvQ/SearchTimeline"

# 2. Authorization (Statis - Jarang berubah untuk Web Client)
AUTH_TOKEN = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"

# 3. COOKIES (DINAMIS - GANTI INI SETIAP KALI ERROR/EXPIRED)
# Salin SEMUA string cookie dari tab Network di Browser (DevTools) ke sini:
MY_COOKIE = '__cuid=6ea4cf7b547d45189d83e581810ce8ac; kdt=Rxtmb2JRoLRgeGEoVJiZ6NhHZ22sdf381MzaLhMA; des_opt_in=N; _ga_RJGMY4G45L=GS2.1.s1761278576$o1$g0$t1761278579$j57$l0$h0; dnt=1; _ga_BLY4P7T5KW=GS2.1.s1761627665$o1$g0$t1761627678$j47$l0$h0; _ga=GA1.2.1754318488.1761278546; guest_id=v1%3A176431461904749559; guest_id_marketing=v1%3A176431461904749559; guest_id_ads=v1%3A176431461904749559; personalization_id="v1_W1OTjspWL1Ts488olXMt1A=="; g_state={"i_l":0,"i_ll":1764318603478}; auth_token=5b67b27fa8fe046c364dab469cca38c9d8b75e4f; ct0=ce9a813685ef717e32575ef55ec5584b0f09ac34cc8686c59066c0853aec3d20c1a74da4e3cb5b40f8fe8f141bd7d63765ef74adc6901b69e5be224e985ab50459722e0eb0f35f79a40e48a4070372e1; twid=u%3D1827615686799335424; lang=id; __cf_bm=AwJNf1kbPw1OBA4agjhGsku45Q6oZMdG9IYIts3g5Zw-1766553422.4508595-1.0.1.1-2pj8ZBuj8MWP.WxDy5jQAvyRsE7.mjhnBVCr2aHsHlcg0yJnUTmRYhvVbBq66uYswLFCQSRkciURU_esDjG63bi5Nh_B8PxyhwPYHU7AbsRc750Lh6MhkCCsdqbtam_.'

# 4. Transaction ID (DINAMIS - Ganti jika error terus menerus)
CLIENT_ID = "3Ex9bM5ZCqvycxLMyV28DFWaqRlty5v89O0Q4V9QPY+qKGHW5ptgUGVZNX6oJhBs7wLPINjWkWnYt4KlntyP305djjYL3w"

# 5. Query pencarian
start_date = "2025-12-01"
end_date = "2025-12-05"
SEARCH_QUERY = f"shopee paylater lang:id until:{end_date} since:{start_date} -filter:links"

# 6. Target Jumlah Halaman (bukan jumlah tweet)
TARGET_PAGES = 1  # Setiap halaman berisi ~20 tweets 

# ================= HELPER FUNCTIONS =================

def get_csrf_token(cookie_string):
    """Mencari nilai ct0 di dalam cookie secara otomatis"""
    match = re.search(r'ct0=([^;]+)', cookie_string)
    if match:
        return match.group(1)
    else:
        print("PERINGATAN: Tidak menemukan 'ct0' di cookie. Pastikan copy semua string cookie.")
        return ""

def get_headers(csrf_token):
    return {
        "authority": "x.com",
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "authorization": AUTH_TOKEN,
        "content-type": "application/json",
        "cookie": MY_COOKIE,
        "referer": "https://x.com/search?q=shopee%20paylater&src=typed_query",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
        "x-client-transaction-id": CLIENT_ID,
        "x-csrf-token": csrf_token,
        "x-twitter-active-user": "yes",
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-client-language": "id"
    }

# ================= FEATURES (WAJIB LENGKAP) =================
features_data = {
    "rweb_video_screen_enabled": False,
    "profile_label_improvements_pcf_label_in_post_enabled": True,
    "responsive_web_profile_redirect_enabled": False,
    "rweb_tipjar_consumption_enabled": True,
    "verified_phone_label_enabled": False,
    "creator_subscriptions_tweet_preview_api_enabled": True,
    "responsive_web_graphql_timeline_navigation_enabled": True,
    "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
    "premium_content_api_read_enabled": False,
    "communities_web_enable_tweet_community_results_fetch": True,
    "c9s_tweet_anatomy_moderator_badge_enabled": True,
    "responsive_web_grok_analyze_button_fetch_trends_enabled": False,
    "responsive_web_grok_analyze_post_followups_enabled": True,
    "responsive_web_jetfuel_frame": True,
    "responsive_web_grok_share_attachment_enabled": True,
    "articles_preview_enabled": True,
    "responsive_web_edit_tweet_api_enabled": True,
    "graphql_is_translatable_rweb_tweet_is_translatable_enabled": True,
    "view_counts_everywhere_api_enabled": True,
    "longform_notetweets_consumption_enabled": True,
    "responsive_web_twitter_article_tweet_consumption_enabled": True,
    "tweet_awards_web_tipping_enabled": False,
    "responsive_web_grok_show_grok_translated_post": False,
    "responsive_web_grok_analysis_button_from_backend": True,
    "creator_subscriptions_quote_tweet_preview_enabled": False,
    "freedom_of_speech_not_reach_fetch_enabled": True,
    "standardized_nudges_misinfo": True,
    "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": True,
    "longform_notetweets_rich_text_read_enabled": True,
    "longform_notetweets_inline_media_enabled": True,
    "responsive_web_grok_image_annotation_enabled": True,
    "responsive_web_grok_imagine_annotation_enabled": True,
    "responsive_web_grok_community_note_auto_translation_is_enabled": False,
    "responsive_web_enhance_cards_enabled": False
}

# ================= MAIN LOGIC (LOOPING) =================

def extract_tweets_from_response(data):
    """Ekstrak tweet dari response JSON Twitter API"""
    tweets = []
    
    try:
        instructions = data['data']['search_by_raw_query']['search_timeline']['timeline']['instructions']
        
        for instr in instructions:
            if instr.get('type') == 'TimelineAddEntries':
                entries = instr.get('entries', [])
                
                for entry in entries:
                    entry_id = entry.get('entryId', '')
                    
                    # Hanya ambil entry yang merupakan tweet
                    if entry_id.startswith('tweet-'):
                        try:
                            content = entry['content']
                            item_content = content['itemContent']
                            tweet_results = item_content['tweet_results']['result']
                            
                            # Ambil data tweet
                            legacy = tweet_results.get('legacy', {})
                            
                            # Ambil data user dari path yang benar
                            user_core = tweet_results.get('core', {}).get('user_results', {}).get('result', {}).get('core', {})
                            username = user_core.get('screen_name', '')
                            user_name = user_core.get('name', '')
                            
                            # Buat URL tweet
                            tweet_id = legacy.get('id_str', '')
                            tweet_url = f"https://twitter.com/{username}/status/{tweet_id}" if username and tweet_id else ''
                            
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
                                'tweet_url': tweet_url,
                            }
                            
                            tweets.append(tweet_obj)
                        except (KeyError, TypeError) as e:
                            # Skip tweet yang strukturnya tidak lengkap
                            continue
    except (KeyError, TypeError) as e:
        print(f"Error parsing response: {e}")
    
    return tweets


def find_next_cursor(data):
    """Cari cursor untuk halaman berikutnya"""
    try:
        instructions = data['data']['search_by_raw_query']['search_timeline']['timeline']['instructions']
        
        for instr in instructions:
            if instr.get('type') == 'TimelineAddEntries':
                entries = instr.get('entries', [])
                
                # Cursor biasanya ada di entry terakhir
                for entry in reversed(entries):
                    entry_id = entry.get('entryId', '')
                    
                    if entry_id.startswith('cursor-bottom-'):
                        return entry['content']['value']
    except (KeyError, TypeError):
        pass
    
    return None


def run_scraper():
    # 1. Setup Header Otomatis
    csrf_token = get_csrf_token(MY_COOKIE)
    if not csrf_token:
        return
    
    headers = get_headers(csrf_token)
    
    all_tweets = []
    all_responses = []  # Simpan juga raw response untuk debugging
    cursor = None
    page_count = 0
    
    print(f"Mulai scraping... Target: {TARGET_PAGES} halaman")
    print(f"Query: {SEARCH_QUERY}")
    print("="*60)

    while page_count < TARGET_PAGES:
        # 2. Siapkan Variables (Dinamis sesuai cursor)
        variables_data = {
            "rawQuery": SEARCH_QUERY,
            "count": 30,  # Maximum tweets per request (Twitter limit)
            "querySource": "typed_query",
            "product": "Top"
        }
        
        # Masukkan cursor jika ini bukan request pertama
        if cursor:
            variables_data["cursor"] = cursor
            # PENTING: fieldToggles diperlukan saat menggunakan cursor
            variables_data["fieldToggles"] = {
                "withArticleRichContentState": True
            }

        params = {
            "variables": json.dumps(variables_data),
            "features": json.dumps(features_data)
        }

        try:
            # 3. Request
            print(f"\n[Halaman {page_count + 1}] Requesting data...")
            
            response = requests.get(url, headers=headers, params=params)
            
            # DEBUG: Print response status
            print(f"  🔍 DEBUG: Response status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"STOP: Request gagal dengan status {response.status_code}")
                print(f"Response: {response.text[:500]}")
                break
            
            data = response.json()
            all_responses.append(data)  # Simpan raw response
            
            # 4. Ekstrak tweets dari response
            tweets = extract_tweets_from_response(data)
            print(f"  ✓ Berhasil mengekstrak {len(tweets)} tweets")
            
            all_tweets.extend(tweets)
            page_count += 1
            
            # 5. Cari cursor untuk halaman berikutnya
            next_cursor = find_next_cursor(data)
            
            if next_cursor and next_cursor != cursor:
                cursor = next_cursor
                print(f"  ✓ Cursor ditemukan untuk halaman berikutnya")
            else:
                print("  ⚠ Tidak ada cursor baru (Halaman terakhir)")
                break
            
            # 6. JEDA (Wajib agar tidak diblokir)
            if page_count < TARGET_PAGES:
                print("  ⏳ Menunggu 10 detik...")
                time.sleep(10)

        except Exception as e:
            print(f"❌ Error tak terduga: {e}")
            import traceback
            traceback.print_exc()
            break

    # 7. Simpan Hasil
    print("\n" + "="*60)
    print(f"✅ Selesai! Total tweet tersimpan: {len(all_tweets)}")
    print(f"📄 Total halaman: {page_count}")
    
    # Simpan tweets yang sudah diekstrak
    filename_tweets = f"temp_tweets/hasil_tweets_{start_date}_{end_date}.json"
    with open(filename_tweets, 'w', encoding='utf-8') as f:
        json.dump(all_tweets, f, ensure_ascii=False, indent=2)
    print(f"💾 Tweets tersimpan di: {filename_tweets}")
    
    # # Simpan juga raw responses untuk referensi
    # filename_raw = "hasil_raw_responses.json"
    # with open(filename_raw, 'w', encoding='utf-8') as f:
    #     json.dump(all_responses, f, ensure_ascii=False, indent=2)
    # print(f"💾 Raw responses tersimpan di: {filename_raw}")

# Jalankan
if __name__ == "__main__":
    run_scraper()