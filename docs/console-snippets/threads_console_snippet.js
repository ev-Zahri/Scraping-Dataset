// ==============================================================================
// 3. THREADS FEED CONSOLE SCRAPING SNIPPET
// ==============================================================================
(function() {
  let posts = [];
  let seen = new Set();
  let scrolling = true;

  function scanThreadsDOM() {
    const links = document.querySelectorAll('a[href*="/post/"]');
    links.forEach(a => {
      const href = a.getAttribute('href');
      const m = href.match(/@([^\/]+)\/post\/([a-zA-Z0-9_\-]+)/);
      if (!m) return;
      const handle = m[1];
      const postId = m[2];

      if (!seen.has(postId)) {
        seen.add(postId);
        // Find surrounding post container
        const container = a.closest('div[data-pressable-container="true"]') || a.closest('article') || a.parentElement.parentElement;
        let text = '';
        if (container) {
          const textNodes = container.querySelectorAll('div[dir="auto"], span[dir="auto"]');
          const lines = [];
          textNodes.forEach(t => {
            const str = t.innerText.trim();
            if (str && str.length > 2 && !lines.includes(str) && !str.match(/^\d+\s*(?:jam|hari|m|h|d|detik|menit)$/i)) {
              lines.push(str);
            }
          });
          text = lines.join('\n\n');
        }

        posts.push({
          id: postId,
          full_text: text || `Post by @${handle}`,
          created_at: new Date().toISOString(),
          username: `@${handle}`,
          user_name: handle,
          likes: 0,
          retweets: 0,
          replies: 0,
          views: 0,
          tweet_url: href.startsWith('http') ? href : `https://www.threads.net${href}`
        });
        console.log(`[Threads Scraper] Collected: ${seen.size} posts`);
      }
    });
  }

  const timer = setInterval(() => {
    if (!scrolling) return;
    scanThreadsDOM();
    window.scrollBy(0, 900);
  }, 1300);

  window.stopCapture = function() {
    scrolling = false;
    clearInterval(timer);
    scanThreadsDOM();
    if (posts.length === 0) return console.warn('⚠️ Belum ada posting Threads terkumpul.');
    const blob = new Blob([JSON.stringify(posts, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `threads_scraped_${Date.now()}.json`;
    a.click();
    console.log(`🛑 Selesai! Mengunduh ${posts.length} posting Threads.`);
  };

  console.log('🚀 [Threads Scraper Aktif] Auto-scrolling feed... Ketik stopCapture() untuk simpan JSON.');
})();
