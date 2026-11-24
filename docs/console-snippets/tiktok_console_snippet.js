// ==============================================================================
// 4. TIKTOK COMMENTS CONSOLE SCRAPING SNIPPET (Hierarchical Level 1 & 2)
// ==============================================================================
(function() {
  let comments = [];
  let seen = new Set();
  let scrolling = true;

  function scanTikTokDOM() {
    // Auto-click "View more replies" to expand branching comments
    const replyButtons = document.querySelectorAll('[data-key-interaction="comment_view_replies"]');
    replyButtons.forEach(btn => {
      if (btn.offsetParent !== null && !btn.getAttribute('data-scraped-clicked')) {
        btn.setAttribute('data-scraped-clicked', 'true');
        btn.click();
      }
    });

    const items = document.querySelectorAll('[class*="DivCommentItemWrapper"]');
    items.forEach((item, idx) => {
      const isLevel2 = !!item.querySelector('[data-e2e="comment-level-2"]') || !!item.querySelector('[data-e2e="comment-username-2"]');
      const level = isLevel2 ? 2 : 1;

      const userLink = item.querySelector('a[href*="/@"]');
      const handle = userLink ? `@${userLink.getAttribute('href').replace(/^\/@/, '')}` : '';

      const userEl = item.querySelector('[data-e2e^="comment-username"]');
      const userName = userEl ? userEl.innerText.trim() : (handle ? handle.replace('@', '') : '');

      const textEl = item.querySelector('[data-e2e^="comment-level-"]');
      let text = textEl ? textEl.innerText.trim() : '';

      if (!text) {
        if (item.querySelector('[data-e2e="comment-sticker-reply"]')) {
          text = '[Sticker / Media Reply]';
        }
      }

      if (!text && !handle) return;

      const subContent = item.querySelector('[class*="DivCommentSubContentWrapper"]');
      const time = subContent ? subContent.innerText.split('\n')[0].trim() : '';

      const likeEl = item.querySelector('[data-key-interaction="comment_like"]');
      let likes = 0;
      if (likeEl) {
        const span = likeEl.querySelector('span');
        const str = span ? span.innerText.trim() : '';
        if (str) {
          let mult = 1;
          const clean = str.toLowerCase();
          if (clean.includes('k') || clean.includes('rb')) mult = 1000;
          else if (clean.includes('m') || clean.includes('jt')) mult = 1000000;
          likes = Math.round((parseFloat(clean.replace(/[^\d.,]/g, '').replace(',', '.')) || 0) * mult);
        }
      }

      const commentKey = `${handle}_${level}_${text.substring(0, 20)}`;
      if (!seen.has(commentKey)) {
        seen.add(commentKey);
        comments.push({
          id: `tiktok_${level}_${seen.size}`,
          level: level,
          is_reply: level > 1,
          full_text: text,
          created_at: time,
          username: handle,
          user_name: userName,
          likes: likes,
          retweets: 0,
          replies: level === 1 ? 1 : 0,
          views: likes,
          tweet_url: handle ? `https://www.tiktok.com/${handle}` : ''
        });
        console.log(`[TikTok Scraper] Collected: ${seen.size} komentar (L${level}: ${handle})`);
      }
    });
  }

  const scrollTimer = setInterval(() => {
    if (!scrolling) return;
    scanTikTokDOM();
    const commentContainer = document.querySelector('[class*="DivCommentListContainer"]') || window;
    if (commentContainer.scrollBy) {
      commentContainer.scrollBy(0, 800);
    } else {
      window.scrollBy(0, 800);
    }
  }, 1400);

  window.stopCapture = function() {
    scrolling = false;
    clearInterval(scrollTimer);
    scanTikTokDOM();
    if (comments.length === 0) return console.warn('⚠️ Belum ada komentar TikTok terkumpul.');
    const blob = new Blob([JSON.stringify(comments, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tiktok_comments_${Date.now()}.json`;
    a.click();
    console.log(`🛑 Selesai! Mengunduh ${comments.length} komentar TikTok.`);
  };

  console.log('🚀 [TikTok Scraper Aktif] Auto-scrolling & expanding replies... Ketik stopCapture() untuk simpan JSON.');
})();
