"""
Server Web Dashboard Scraping Dataset Twitter (X)
Menyajikan antarmuka visual Obsidian Precision (index.html)
dan mengeksekusi engine ekstraksi asli tanpa mengubah kodenya:
- extract_bulk.py (extract_tweets_from_response)
- combine_json.py (remove_duplicates)
- json_to_csv.py (CSV_COLUMNS)
"""

import http.server
import socketserver
import json
import os
import sys
from pathlib import Path

# Import engine pemrosesan asli tanpa mengubah kodenya sama sekali
from extract_bulk import extract_tweets_from_response
from combine_json import remove_duplicates
from json_to_csv import CSV_COLUMNS

BASE_DIR = Path(__file__).resolve().parent

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            index_path = BASE_DIR / 'index.html'
            if index_path.exists():
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                with open(index_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, "index.html tidak ditemukan")
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/parse':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                req_data = json.loads(body.decode('utf-8'))

                payloads = req_data.get('payloads', [])
                if not payloads or not isinstance(payloads, list):
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "success": False,
                        "error": "Payloads kosong atau tidak valid."
                    }).encode('utf-8'))
                    return

                all_extracted_tweets = []

                # Jalankan fungsi engine asli
                for payload in payloads:
                    if isinstance(payload, list):
                        for item in payload:
                            if isinstance(item, dict):
                                if 'data' in item:
                                    # Raw XHR SearchTimeline response
                                    tweets = extract_tweets_from_response(item)
                                    if tweets:
                                        all_extracted_tweets.extend(tweets)
                                elif 'id' in item and 'full_text' in item:
                                    # Already extracted tweet
                                    all_extracted_tweets.append(item)
                                else:
                                    tweets = extract_tweets_from_response(item)
                                    if tweets:
                                        all_extracted_tweets.extend(tweets)
                    elif isinstance(payload, dict):
                        tweets = extract_tweets_from_response(payload)
                        if tweets:
                            all_extracted_tweets.extend(tweets)

                # Validasi ketat jika data kosong / bukan twitter
                if len(all_extracted_tweets) == 0:
                    self.send_response(422)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "success": False,
                        "error": "Tidak ditemukan data tweet yang valid pada berkas. Pastikan file berisi respon SearchTimeline Twitter/X."
                    }).encode('utf-8'))
                    return

                # Deduplikasi menggunakan fungsi asli combine_json
                unique_tweets = remove_duplicates(all_extracted_tweets)

                response_payload = {
                    "success": True,
                    "total_raw": len(all_extracted_tweets),
                    "total_unique": len(unique_tweets),
                    "tweets": unique_tweets
                }

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(response_payload).encode('utf-8'))

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
        else:
            self.send_error(404, "Endpoint tidak ditemukan")

def run(port=5000):
    handler = DashboardHandler
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", port), handler) as httpd:
        url = f"http://localhost:{port}"
        print("=" * 60)
        print("⚡ DASHBOARD SCRAPING DATASET TWITTER (X) // OBSIDIAN PRECISION")
        print("=" * 60)
        print(f"🚀 Server aktif di: {url}")
        print("📋 Buka URL di atas pada browser Anda.")
        print("💡 Tekan Ctrl + C untuk menghentikan server.")
        print("=" * 60)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server dihentikan.")
            httpd.server_close()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run(port)
        except ValueError:
            pass
    run(port)
