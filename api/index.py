from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add root folder to sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from extract_bulk import extract_tweets_from_response
from combine_json import remove_duplicates

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            req_data = json.loads(body.decode('utf-8'))

            payloads = req_data.get('payloads', [])
            all_extracted_tweets = []

            for payload in payloads:
                if isinstance(payload, list):
                    for item in payload:
                        if isinstance(item, dict):
                            if 'data' in item:
                                tweets = extract_tweets_from_response(item)
                                if tweets:
                                    all_extracted_tweets.extend(tweets)
                            elif 'id' in item and 'full_text' in item:
                                all_extracted_tweets.append(item)
                            else:
                                tweets = extract_tweets_from_response(item)
                                if tweets:
                                    all_extracted_tweets.extend(tweets)
                elif isinstance(payload, dict):
                    tweets = extract_tweets_from_response(payload)
                    if tweets:
                        all_extracted_tweets.extend(tweets)

            if len(all_extracted_tweets) == 0:
                self.send_response(422)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "error": "Tidak ditemukan data tweet yang valid pada berkas. Pastikan file berisi respon SearchTimeline Twitter/X."
                }).encode('utf-8'))
                return

            unique_tweets = remove_duplicates(all_extracted_tweets)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "total_raw": len(all_extracted_tweets),
                "total_unique": len(unique_tweets),
                "tweets": unique_tweets
            }).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
