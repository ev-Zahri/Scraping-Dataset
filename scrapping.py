import requests
import json

# URL diambil dari gabungan :authority dan :path
# Perhatikan: URL aslinya sangat panjang karena query paramnya (variables & features)
url = "https://x.com/i/api/graphql/M1jEez78PEfVfbQLvlWMvQ/SearchTimeline"

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

variables_data = {
    "rawQuery": "shopee paylater lang:id until:2025-12-22 since:2025-01-01 -filter:links",
    "count": 20,
    "querySource": "typed_query",
    "product": "Top",
    "withGrokTranslatedBio": False
}

params = {
    "variables": json.dumps(variables_data),
    "features": json.dumps(features_data)
}

# yang perlu dirubah itu value dari authorization, cookie, dan 2 nilai serupa di ct=0 dan x-csrf-token

headers = {
    "authority": "x.com",
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA", 
    "content-type": "application/json",
    "cookie": '__cuid=6ea4cf7b547d45189d83e581810ce8ac; kdt=Rxtmb2JRoLRgeGEoVJiZ6NhHZ22sdf381MzaLhMA; des_opt_in=N; _ga_RJGMY4G45L=GS2.1.s1761278576$o1$g0$t1761278579$j57$l0$h0; dnt=1; _ga_BLY4P7T5KW=GS2.1.s1761627665$o1$g0$t1761627678$j47$l0$h0; _ga=GA1.2.1754318488.1761278546; guest_id=v1%3A176431461904749559; guest_id_marketing=v1%3A176431461904749559; guest_id_ads=v1%3A176431461904749559; personalization_id="v1_W1OTjspWL1Ts488olXMt1A=="; g_state={"i_l":0,"i_ll":1764318603478}; auth_token=5b67b27fa8fe046c364dab469cca38c9d8b75e4f; ct0=ce9a813685ef717e32575ef55ec5584b0f09ac34cc8686c59066c0853aec3d20c1a74da4e3cb5b40f8fe8f141bd7d63765ef74adc6901b69e5be224e985ab50459722e0eb0f35f79a40e48a4070372e1; twid=u%3D1827615686799335424; lang=id; __cf_bm=UxDtXDUVqro5ECztz1ZIv4xwi5qCV.cmdNap5dBXWB0-1766550733.4327278-1.0.1.1-5PdohK6B8UEUMOHP5IlUUNrNSD2xbYZP0Ww3ECh0PjmOba7zZg_ql0E4NE1W3_YumKu1MQp8XTCY84siP2DxTysAOsEuynJxxPzlX0qUZRFbC1XnXFuhy9M_iYZ0FWTE',
    "referer": "https://x.com/search?q=shopee%20paylater%20lang%3Aid%20until%3A2025-12-22%20since%3A2025-01-01%20-filter%3Alinks&src=typed_query",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
    "x-client-transaction-id": "tGAw9ASyHu0tuIKnZzHD1/Ij7Gi3Jb9aRZCVK1YHzxsqCaXsAVogR8RPbwqwqW8XMOm9SLATHpfbCW4Ea2JzX6LfNWlYtw",
    "x-csrf-token": "ce9a813685ef717e32575ef55ec5584b0f09ac34cc8686c59066c0853aec3d20c1a74da4e3cb5b40f8fe8f141bd7d63765ef74adc6901b69e5be224e985ab50459722e0eb0f35f79a40e48a4070372e1",
    "x-twitter-active-user": "yes",
    "x-twitter-auth-type": "OAuth2Session",
    "x-twitter-client-language": "id"
}

response = requests.get(url, headers=headers, params=params)

if response.status_code == 200:
    print("Sukses!")
    data = response.json()
    
    # Simpan data ke file JSON
    output_filename = "shopee_paylater_tweets2.json"
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Data berhasil disimpan ke {output_filename}")
    print(f"Total data: {len(str(data))} karakter")
else:
    print(f"Gagal: {response.status_code}")
    print(response.text)


