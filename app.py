"""
Web Dashboard Scraping Dataset Twitter (X)
Sesuai Sistem Desain Obsidian Precision (docs/DESIGN.md)
Menggunakan engine pemrosesan: extract_bulk, combine_json, json_to_csv (tanpa modifikasi)
"""

import streamlit as st
import pandas as pd
import json
import os
from datetime import datetime

# Import engine pemrosesan asli tanpa mengubah kodenya
from extract_bulk import extract_tweets_from_response
from combine_json import remove_duplicates
from json_to_csv import CSV_COLUMNS

# Konfigurasi Halaman Streamlit
st.set_page_config(
    page_title="Dataset Scraped X - Obsidian Precision",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom Styling CSS (Obsidian Precision System)
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

    /* Global canvas & typography */
    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #e3e1e9;
    }
    
    .stApp {
        background-color: #121318;
    }
    
    /* Code & Mono */
    code, pre, .font-mono {
        font-family: 'JetBrains Mono', monospace !important;
    }

    /* Container blocks */
    .obsidian-card {
        background-color: #1a1b21;
        border: 1px solid #232733;
        border-radius: 8px;
        padding: 18px 20px;
        transition: border-color 0.2s ease;
    }
    .obsidian-card:hover {
        border-color: #343b4d;
    }

    /* Badge styles */
    .badge-primary {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background-color: #1e1f25;
        color: #38bdf8;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 500;
        padding: 3px 8px;
        border-radius: 4px;
        border: 1px solid #232733;
        letter-spacing: 0.04em;
    }
    
    .badge-success {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background-color: #1a1f2c;
        color: #34d399;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 500;
        padding: 3px 8px;
        border-radius: 4px;
        border: 1px solid rgba(52, 211, 153, 0.3);
    }

    .badge-neutral {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background-color: #1e1f25;
        color: #94a3b8;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 500;
        padding: 3px 8px;
        border-radius: 4px;
        border: 1px solid #232733;
    }

    .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: #34d399;
        display: inline-block;
    }

    /* Metric card */
    .metric-box {
        background-color: #1a1b21;
        border: 1px solid #232733;
        border-radius: 6px;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .metric-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .metric-val {
        font-family: 'JetBrains Mono', monospace;
        font-size: 24px;
        font-weight: 600;
        color: #f8fafc;
    }
    .metric-sub {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: #38bdf8;
    }

    /* Step card */
    .step-box {
        background-color: #1e1f25;
        border: 1px solid #232733;
        border-radius: 6px;
        padding: 12px 14px;
        height: 100%;
    }
    .step-tag {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 600;
        color: #38bdf8;
        letter-spacing: 0.05em;
    }
    .step-title {
        font-size: 13px;
        font-weight: 600;
        color: #f8fafc;
        margin-top: 4px;
    }
    .step-desc {
        font-size: 11px;
        color: #94a3b8;
        line-height: 1.4;
        margin-top: 2px;
    }

    /* Streamlit overrides for precision look */
    div[data-testid="stMetricValue"] {
        font-family: 'JetBrains Mono', monospace;
        color: #f8fafc;
    }
    
    .stButton>button {
        background-color: #1e1f25;
        color: #f8fafc;
        border: 1px solid #232733;
        border-radius: 4px;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        font-size: 13px;
        transition: all 0.15s ease;
    }
    .stButton>button:hover {
        background-color: #292a2f;
        border-color: #38bdf8;
        color: #38bdf8;
    }

    .stDownloadButton>button {
        background-color: #38bdf8;
        color: #00354a;
        font-weight: 600;
        border: none;
        border-radius: 4px;
        font-size: 13px;
    }
    .stDownloadButton>button:hover {
        background-color: #7bd0ff;
        color: #001e2c;
    }

    /* Header styling */
    .main-title {
        font-size: 26px;
        font-weight: 600;
        letter-spacing: -0.02em;
        color: #f8fafc;
        margin: 0;
    }
    .main-subtitle {
        font-size: 13px;
        color: #94a3b8;
        margin-top: 4px;
    }

    /* Clean divider */
    .divider {
        height: 1px;
        background-color: #232733;
        margin: 16px 0;
    }
</style>
""", unsafe_allow_html=True)

# Inisialisasi Session State
if "page" not in st.session_state:
    st.session_state.page = "setup"
if "parsed_tweets" not in st.session_state:
    st.session_state.parsed_tweets = []
if "file_sources" not in st.session_state:
    st.session_state.file_sources = []
if "active_cols" not in st.session_state:
    st.session_state.active_cols = list(CSV_COLUMNS)

# Snippet JavaScript Auto-Capture dari README.md
JS_SCRAPER_SNIPPET = """let responseCount = 0;
let allResponses = [];

// Fungsi untuk save manual
window.saveTwitterData = function() {
    if (allResponses.length === 0) {
        console.log('❌ Tidak ada data untuk disimpan!');
        return;
    }
    const blob = new Blob([JSON.stringify(allResponses, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twitter_bulk_${responseCount}_responses.json`;
    a.click();
    console.log(`💾 Saved ${responseCount} responses!`);
};

// Fungsi untuk stop capture
window.stopCapture = function() {
    console.log('🛑 Capture stopped!');
    console.log(`📊 Total responses captured: ${responseCount}`);
    window.saveTwitterData();
};

// Intercept XMLHttpRequest
(function() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        return originalOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function() {
        this.addEventListener('load', function() {
            if (this._url && this._url.includes('SearchTimeline') && this.status === 200) {
                try {
                    const data = JSON.parse(this.responseText);
                    responseCount++;
                    allResponses.push(data);
                    console.log(`✅ Response #${responseCount} captured!`);
                } catch (e) {}
            }
        });
        return originalSend.apply(this, arguments);
    };
})();
console.log('🎯 Auto-capture active! Scroll timeline lalu jalankan stopCapture()');"""

def process_uploaded_payloads(uploaded_files, sample_path=None):
    """
    Memproses payload menggunakan fungsi engine tanpa memodifikasi engine:
    1. extract_tweets_from_response (dari extract_bulk.py)
    2. remove_duplicates (dari combine_json.py)
    """
    all_extracted_tweets = []
    file_info = []

    files_to_read = []
    if sample_path:
        with open(sample_path, 'r', encoding='utf-8') as f:
            content = json.load(f)
            files_to_read.append((os.path.basename(sample_path), content))
    elif uploaded_files:
        for uf in uploaded_files:
            try:
                content = json.load(uf)
                files_to_read.append((uf.name, content))
            except Exception as e:
                st.error(f"Gagal membaca file {uf.name}: {e}")

    for filename, payload in files_to_read:
        file_tweets = []
        if isinstance(payload, list):
            # Cek apakah ini array of raw responses atau array of extracted tweets
            if len(payload) > 0 and isinstance(payload[0], dict) and 'data' in payload[0]:
                # Array of raw XHR responses
                for resp in payload:
                    extracted = extract_tweets_from_response(resp)
                    if extracted:
                        file_tweets.extend(extracted)
            elif len(payload) > 0 and isinstance(payload[0], dict) and 'id' in payload[0]:
                # Array of already extracted tweet objects
                file_tweets.extend(payload)
            else:
                # Coba parse tiap item sebagai response
                for item in payload:
                    if isinstance(item, dict):
                        extracted = extract_tweets_from_response(item)
                        if extracted:
                            file_tweets.extend(extracted)
        elif isinstance(payload, dict):
            # Single raw response
            extracted = extract_tweets_from_response(payload)
            if extracted:
                file_tweets.extend(extracted)

        all_extracted_tweets.extend(file_tweets)
        file_info.append({
            "name": filename,
            "tweets_count": len(file_tweets)
        })

    # Deduplikasi menggunakan fungsi remove_duplicates dari combine_json.py
    unique_tweets = remove_duplicates(all_extracted_tweets)
    return unique_tweets, file_info

# =========================================================================
# SCREEN 1: SETUP & INGESTION (Sesuai docs/x_scraper_setup_ingest_tanpa_tabel)
# =========================================================================
if st.session_state.page == "setup":
    col_hdr1, col_hdr2 = st.columns([4, 1])
    with col_hdr1:
        st.markdown("""
        <div style="margin-bottom: 8px;">
            <span class="badge-primary">RAW INGESTION // CLIENT-SIDE SCRAPER</span>
            <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background-color:#34d399; margin:0 6px;"></span>
            <span class="font-mono" style="font-size:12px; color:#94a3b8;">V2.4.0-STREAM</span>
        </div>
        <h1 class="main-title">Import &amp; Konfigurasi Ekstraksi</h1>
        <p class="main-subtitle">Upload payload tweet hasil scraping browser console atau gunakan skrip capture otomatis.</p>
        """, unsafe_allow_html=True)
    
    st.markdown('<div class="divider"></div>', unsafe_allow_html=True)

    # Section 1: File Dropzone & Staged Upload
    st.markdown("""
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 8px;">
        <span class="font-mono" style="font-size:12px; color:#38bdf8; font-weight:600;">SECTION 01 // UPLOAD PAYLOAD FILE</span>
        <span style="font-size:11px; color:#64748b;">Maksimum 50MB per batch</span>
    </div>
    """, unsafe_allow_html=True)

    c_upload, c_sample = st.columns([3, 1])
    with c_upload:
        uploaded_files = st.file_uploader(
            "Tarik berkas .json hasil scraping ke sini",
            type=["json"],
            accept_multiple_files=True,
            help="File JSON yang di-download melalui saveTwitterData() atau stopCapture()"
        )
    with c_sample:
        st.write("")
        st.write("")
        sample_choice = st.selectbox(
            "Pilih Sampel Bawaan:",
            ["raw_json/twitter_bulk_5_responses.json", "extracted_json/all_tweets_combined.json"],
            index=0
        )
        load_sample = st.button("Muat File Sampel 📂", use_container_width=True)

    # Section 2: Quick Browser Console Extraction Steps
    st.markdown('<div class="divider"></div>', unsafe_allow_html=True)
    st.markdown("""
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px;">
        <div style="display:flex; align-items:center; gap:8px;">
            <span class="font-mono" style="font-size:12px; color:#38bdf8; font-weight:600;">SECTION 02 // PANDUAN SCRAPING BROWSER</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    s1, s2, s3, s4, s5 = st.columns(5)
    with s1:
        st.markdown("""
        <div class="step-box">
            <span class="step-tag">STEP 01</span>
            <div class="step-title">Salin Script</div>
            <div class="step-desc">Buka expander di bawah dan salin script snippet.</div>
        </div>
        """, unsafe_allow_html=True)
    with s2:
        st.markdown("""
        <div class="step-box">
            <span class="step-tag">STEP 02</span>
            <div class="step-title">Buka Console</div>
            <div class="step-desc">Buka pencarian Twitter (x.com), tekan F12 -> Console.</div>
        </div>
        """, unsafe_allow_html=True)
    with s3:
        st.markdown("""
        <div class="step-box">
            <span class="step-tag">STEP 03</span>
            <div class="step-title">Paste & Run</div>
            <div class="step-desc">Paste kode snippet ke tab Console lalu tekan Enter.</div>
        </div>
        """, unsafe_allow_html=True)
    with s4:
        st.markdown("""
        <div class="step-box">
            <span class="step-tag">STEP 04</span>
            <div class="step-title">Scroll Feed</div>
            <div class="step-desc">Scroll feed Twitter untuk memuat tweet otomatis.</div>
        </div>
        """, unsafe_allow_html=True)
    with s5:
        st.markdown("""
        <div class="step-box">
            <span class="step-tag">STEP 05</span>
            <div class="step-title">stopCapture()</div>
            <div class="step-desc">Jalankan stopCapture() untuk mengunduh JSON.</div>
        </div>
        """, unsafe_allow_html=True)

    with st.expander("📋 Klik untuk melihat / menyalin kode JavaScript Console"):
        st.code(JS_SCRAPER_SNIPPET, language="javascript")

    # Section 3: Column Schema Preview & Customization
    st.markdown('<div class="divider"></div>', unsafe_allow_html=True)
    st.markdown("""
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 10px;">
        <span class="font-mono" style="font-size:12px; color:#38bdf8; font-weight:600;">SECTION 03 // SKEMA KOLOM DATASET</span>
        <span class="badge-neutral">AUTO-PARSED FROM ENGINE</span>
    </div>
    """, unsafe_allow_html=True)

    selected_columns = st.multiselect(
        "Pilih kolom-kolom yang ingin ditampilkan dan diekspor:",
        options=CSV_COLUMNS,
        default=st.session_state.active_cols
    )

    # Action Bar: Submit / Process
    st.markdown('<div class="divider"></div>', unsafe_allow_html=True)
    c_btn1, c_btn2 = st.columns([3, 1])
    with c_btn1:
        st.markdown("""
        <div style="display:flex; align-items:center; gap:8px; height:100%;">
            <span style="color:#34d399; font-size:16px;">🛡️</span>
            <span style="font-size:12px; color:#94a3b8;">
                Parsing dilakukan menggunakan engine ekstraksi Python lokal di memori. Tidak ada data yang dibagikan ke pihak ketiga.
            </span>
        </div>
        """, unsafe_allow_html=True)
    with c_btn2:
        submit_btn = st.button("Muat Data ke Tabel ↵", type="primary", use_container_width=True)

    # Trigger processing
    if submit_btn or load_sample:
        sample_to_use = sample_choice if load_sample else None
        with st.spinner("Memproses payload tweet dengan engine Python..."):
            parsed_data, files_info = process_uploaded_payloads(uploaded_files, sample_path=sample_to_use)
            if parsed_data:
                st.session_state.parsed_tweets = parsed_data
                st.session_state.file_sources = files_info
                st.session_state.active_cols = selected_columns if selected_columns else CSV_COLUMNS
                st.session_state.page = "table"
                st.rerun()
            else:
                st.warning("⚠️ Tidak ada tweet yang berhasil diekstrak. Pastikan file JSON sesuai format respons Twitter.")

# =========================================================================
# SCREEN 2: DATASET TABLE & EXPORT (Sesuai docs/x_scraper_datase_dengan_tabel)
# =========================================================================
elif st.session_state.page == "table":
    tweets = st.session_state.parsed_tweets
    df = pd.DataFrame(tweets)

    # Pastikan tipe data numerik sesuai
    for col_num in ['likes', 'retweets', 'replies']:
        if col_num in df.columns:
            df[col_num] = pd.to_numeric(df[col_num], errors='coerce').fillna(0).astype(int)
    if 'views' in df.columns:
        df['views_clean'] = pd.to_numeric(df['views'], errors='coerce').fillna(0).astype(int)

    # Header Bar
    col_t1, col_t2 = st.columns([3, 2])
    with col_t1:
        st.markdown(f"""
        <div style="display:flex; align-items:center; gap:10px; margin-bottom: 6px;">
            <h1 class="main-title" style="display:inline;">Dataset Scraped X</h1>
            <span class="badge-success"><span class="status-dot"></span> Ready</span>
            <span class="badge-neutral">{len(st.session_state.active_cols)} Kolom Aktif</span>
        </div>
        <p class="main-subtitle">
            Menampilkan {len(df):,} tweet unik hasil ekstraksi &amp; deduplikasi otomatis.
        </p>
        """, unsafe_allow_html=True)
    with col_t2:
        b_back, b_csv, b_json = st.columns([1.2, 1, 1])
        with b_back:
            if st.button("← Konfigurasi", use_container_width=True):
                st.session_state.page = "setup"
                st.rerun()
        with b_csv:
            csv_data = df[st.session_state.active_cols].to_csv(index=False).encode('utf-8')
            st.download_button(
                label="Export CSV 📥",
                data=csv_data,
                file_name=f"tweets_extracted_{len(df)}_records.csv",
                mime="text/csv",
                use_container_width=True
            )
        with b_json:
            json_data = df[st.session_state.active_cols].to_json(orient="records", indent=2).encode('utf-8')
            st.download_button(
                label="Export JSON 💾",
                data=json_data,
                file_name=f"tweets_extracted_{len(df)}_records.json",
                mime="application/json",
                use_container_width=True
            )

    st.markdown('<div class="divider"></div>', unsafe_allow_html=True)

    # Metric Summary Strip (4 Cards)
    total_tweets = len(df)
    unique_authors = df['username'].nunique() if 'username' in df.columns else 0
    density = f"{(unique_authors / total_tweets * 100):.1f}%" if total_tweets > 0 else "0%"
    
    total_interactions = 0
    for col_int in ['likes', 'retweets', 'replies']:
        if col_int in df.columns:
            total_interactions += df[col_int].sum()
    avg_interaction = f"{(total_interactions / total_tweets):.1f}" if total_tweets > 0 else "0"

    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.markdown(f"""
        <div class="metric-box">
            <span class="metric-label">Total Tweet</span>
            <span class="metric-val">{total_tweets:,}</span>
            <span class="metric-sub" style="color:#34d399;">+100% deduplicated</span>
        </div>
        """, unsafe_allow_html=True)
    with m2:
        st.markdown(f"""
        <div class="metric-box">
            <span class="metric-label">Akun Unik</span>
            <span class="metric-val">{unique_authors:,}</span>
            <span class="metric-sub" style="color:#94a3b8;">{density} density</span>
        </div>
        """, unsafe_allow_html=True)
    with m3:
        st.markdown(f"""
        <div class="metric-box">
            <span class="metric-label">Total Interaksi</span>
            <span class="metric-val">{total_interactions:,}</span>
            <span class="metric-sub">{avg_interaction} / tweet</span>
        </div>
        """, unsafe_allow_html=True)
    with m4:
        st.markdown(f"""
        <div class="metric-box">
            <span class="metric-label">Kolom Terpilih</span>
            <span class="metric-val">{len(st.session_state.active_cols)}</span>
            <span class="metric-sub" style="color:#94a3b8;">Schema normalized</span>
        </div>
        """, unsafe_allow_html=True)

    st.markdown('<div class="divider"></div>', unsafe_allow_html=True)

    # Filter & Query Strip
    fc1, fc2, fc3 = st.columns([3, 1.5, 1.5])
    with fc1:
        search_query = st.text_input(
            "Pencarian:",
            placeholder="🔍 Cari keyword teks tweet, username (@...), atau Tweet ID...",
            label_visibility="collapsed"
        )
    with fc2:
        sort_by = st.selectbox(
            "Urutkan berdasarkan:",
            ["Default", "Paling Banyak Likes", "Paling Banyak Retweets", "Paling Banyak Replies"],
            label_visibility="collapsed"
        )
    with fc3:
        only_interactive = st.checkbox("Hanya yang ada interaksi", value=False)

    # Penerapan Filter
    filtered_df = df.copy()
    if search_query:
        query = search_query.lower()
        filtered_df = filtered_df[
            filtered_df['full_text'].astype(str).str.lower().str.contains(query) |
            filtered_df['username'].astype(str).str.lower().str.contains(query) |
            filtered_df['id'].astype(str).str.contains(query)
        ]
    if only_interactive:
        if 'likes' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['likes'] > 0]
    if sort_by == "Paling Banyak Likes" and 'likes' in filtered_df.columns:
        filtered_df = filtered_df.sort_values(by="likes", ascending=False)
    elif sort_by == "Paling Banyak Retweets" and 'retweets' in filtered_df.columns:
        filtered_df = filtered_df.sort_values(by="retweets", ascending=False)
    elif sort_by == "Paling Banyak Replies" and 'replies' in filtered_df.columns:
        filtered_df = filtered_df.sort_values(by="replies", ascending=False)

    # Data Table View
    cols_to_display = [c for c in st.session_state.active_cols if c in filtered_df.columns]
    
    st.markdown(f"""
    <div style="display:flex; justify-content:space-between; align-items:center; margin: 10px 0 6px 0;">
        <span class="font-mono" style="font-size:12px; color:#94a3b8;">
            Menampilkan <b style="color:#f8fafc;">{len(filtered_df):,}</b> dari <b style="color:#f8fafc;">{len(df):,}</b> tweet
        </span>
    </div>
    """, unsafe_allow_html=True)

    st.dataframe(
        filtered_df[cols_to_display],
        use_container_width=True,
        height=480,
        column_config={
            "tweet_url": st.column_config.LinkColumn("Tweet Link", display_text="Buka di X"),
            "full_text": st.column_config.TextColumn("Konten Tweet", width="large"),
            "likes": st.column_config.NumberColumn("Likes ❤️"),
            "retweets": st.column_config.NumberColumn("RT 🔁"),
            "replies": st.column_config.NumberColumn("Reply 💬"),
            "views": st.column_config.TextColumn("Views 👁️"),
            "username": st.column_config.TextColumn("Author 👤")
        }
    )

    # Quick Tweet Inspector
    with st.expander("🔍 Pratinjau Tweet Satuan (Inspector)"):
        if len(filtered_df) > 0:
            selected_idx = st.slider("Pilih indeks tweet:", 0, len(filtered_df)-1, 0)
            tweet_item = filtered_df.iloc[selected_idx].to_dict()
            st.json(tweet_item)
        else:
            st.write("Tidak ada tweet yang cocok dengan filter pencarian.")
