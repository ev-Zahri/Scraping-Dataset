// ==============================================================================
// 2. YOUTUBE COMMENTS CONSOLE SCRAPING SNIPPET
// ==============================================================================
(function() {
  let comments = [];
  let seen = new Set();
  let scrolling = true;

  function scanYtDOM() {
    const nodes = document.querySelectorAll('ytd-comment-view-model');
    nodes.forEach(el => {
      const textEl = el.querySelector('#content-text');
      const authorEl = el.querySelector('#author-text');
      const timeEl = el.querySelector('#published-time-text a');
      const likeEl = el.querySelector('#like-button');

      if (!textEl) return;
      const text = textEl.innerText.trim();
      const author = authorEl ? authorEl.innerText.trim() : '';
      const time = timeEl ? timeEl.innerText.trim() : '';
      const href = timeEl ? timeEl.getAttribute('href') : '';
      const cId = (href && href.includes('lc=')) ? href.split('lc=')[1] : `${author}_${text.substring(0, 15)}`;

      if (!seen.has(cId)) {
        seen.add(cId);
        let likes = 0;
        if (likeEl) {
          const aria = likeEl.getAttribute('aria-label') || '';
          const m = aria.match(/([\d.,KkMmbjt]+)\s*(?:suka|like|orang)/i);
          if (m) {
            let mult = 1;
            const c = m[1].toLowerCase();
            if (c.includes('rb') || c.includes('k')) mult = 1000;
            else if (c.includes('jt') || c.includes('m')) mult = 1000000;
            likes = Math.round((parseFloat(c.replace(/[^\d.,]/g, '').replace(',', '.')) || 0) * mult);
          }
        }

        comments.push({
          id: cId,
          full_text: text,
          created_at: time,
          username: author,
          user_name: author.replace('@', ''),
          likes: likes,
          retweets: 0,
          replies: 0,
          views: likes,
          tweet_url: href ? (href.startsWith('http') ? href : `https://www.youtube.com${href}`) : ''
        });
        console.log(`[YouTube Scraper] Collected: ${seen.size} komentar`);
      }
    });
  }

  const scrollTimer = setInterval(() => {
    if (!scrolling) return;
    scanYtDOM();
    window.scrollBy(0, 900);
  }, 1400);

  window.stopCapture = function() {
    scrolling = false;
    clearInterval(scrollTimer);
    scanYtDOM();
    if (comments.length === 0) return console.warn('⚠️ Belum ada komentar YouTube terkumpul.');
    const blob = new Blob([JSON.stringify(comments, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `youtube_comments_${Date.now()}.json`;
    a.click();
    console.log(`🛑 Selesai! Mengunduh ${comments.length} komentar YouTube.`);
  };

  console.log('🚀 [YouTube Scraper Aktif] Auto-scrolling komentar... Ketik stopCapture() untuk simpan JSON.');
})();
