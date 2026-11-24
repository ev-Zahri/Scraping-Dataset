// ==============================================================================
// 1. TWITTER / X CONSOLE SCRAPING SNIPPET (SearchTimeline + DOM Stream)
// ==============================================================================
(function() {
  let tweets = [];
  let seen = new Set();
  let scrolling = true;

  // Intercept XHR SearchTimeline
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(m, u) { this._url = u; return origOpen.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function() {
    this.addEventListener('load', function() {
      if (this._url && this._url.includes('SearchTimeline') && this.status === 200) {
        try {
          const json = JSON.parse(this.responseText);
          const instrs = json?.data?.search_by_raw_query?.search_timeline?.timeline?.instructions || [];
          for (const ins of instrs) {
            for (const entry of (ins.entries || [])) {
              const res = entry?.content?.itemContent?.tweet_results?.result;
              const leg = res?.legacy;
              if (leg && !seen.has(leg.id_str)) {
                seen.add(leg.id_str);
                const user = res?.core?.user_results?.result?.core?.screen_name || '';
                tweets.push({
                  id: leg.id_str,
                  full_text: leg.full_text || '',
                  created_at: leg.created_at || '',
                  username: `@${user}`,
                  user_name: res?.core?.user_results?.result?.core?.name || user,
                  likes: leg.favorite_count || 0,
                  retweets: leg.retweet_count || 0,
                  replies: leg.reply_count || 0,
                  views: res?.views?.count || '0',
                  tweet_url: `https://x.com/${user}/status/${leg.id_str}`
                });
                console.log(`[X Scraper] Collected: ${seen.size} tweets`);
              }
            }
          }
        } catch(e) {}
      }
    });
    return origSend.apply(this, arguments);
  };

  // Auto Scroll
  const timer = setInterval(() => {
    if (!scrolling) return;
    window.scrollBy(0, 800);
  }, 1200);

  window.stopCapture = function() {
    scrolling = false;
    clearInterval(timer);
    if (tweets.length === 0) return console.warn('⚠️ Belum ada tweet terkumpul.');
    const blob = new Blob([JSON.stringify(tweets, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `x_scraped_${Date.now()}.json`;
    a.click();
    console.log(`🛑 Selesai! Mengunduh ${tweets.length} tweet.`);
  };

  console.log('🚀 [X Scraper Aktif] Auto-scrolling... Ketik stopCapture() untuk simpan JSON.');
})();
