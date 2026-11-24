// ==============================================================================
// 5. SHOPEE REVIEWS CONSOLE SCRAPING SNIPPET
// ==============================================================================
(function() {
  let reviews = [];
  let seen = new Set();
  let paginationActive = true;

  function scanShopeeDOM() {
    const items = document.querySelectorAll('.q2b7Oq, [data-cmtid]');
    items.forEach(el => {
      const cmtId = el.getAttribute('data-cmtid') || el.innerText.substring(0, 20);
      if (seen.has(cmtId)) return;
      seen.add(cmtId);

      const userEl = el.querySelector('.InK5kS');
      const username = userEl ? userEl.innerText.trim() : '';

      const textEl = el.querySelector('.YNedDV');
      const text = textEl ? textEl.innerText.trim() : '';

      const metaEl = el.querySelector('.XYk98l');
      let reviewDate = '';
      let variation = '';
      if (metaEl) {
        const parts = metaEl.innerText.split('|');
        reviewDate = parts[0] ? parts[0].trim() : '';
        variation = parts[1] ? parts[1].replace(/Variasi:/i, '').trim() : '';
      }

      const stars = el.querySelectorAll('.icon-rating-solid, .icon-rating-solid--active').length || 5;
      const likeEl = el.querySelector('.shopee-product-rating__like-count');
      const likes = likeEl ? (parseInt(likeEl.innerText.trim(), 10) || 0) : 0;

      reviews.push({
        id: cmtId,
        full_text: text,
        created_at: reviewDate,
        username: username,
        user_name: username,
        rating: stars,
        variation: variation,
        likes: likes,
        retweets: 0,
        replies: 0,
        views: likes,
        tweet_url: window.location.href
      });
      console.log(`[Shopee Scraper] Collected: ${seen.size} ulasan (User: ${username}, Rating: ${stars}★)`);
    });
  }

  // Auto click next pagination button
  const pageTimer = setInterval(() => {
    if (!paginationActive) return;
    scanShopeeDOM();

    // Look for next page button
    const nextBtn = document.querySelector('.shopee-icon-button--right, button.shopee-button-solid--primary + button');
    if (nextBtn && !nextBtn.disabled && nextBtn.getAttribute('aria-disabled') !== 'true') {
      nextBtn.click();
      console.log('➡️ Berpindah ke halaman ulasan berikutnya...');
    } else {
      window.scrollBy(0, 600);
    }
  }, 2200);

  window.stopCapture = function() {
    paginationActive = false;
    clearInterval(pageTimer);
    scanShopeeDOM();
    if (reviews.length === 0) return console.warn('⚠️ Belum ada ulasan Shopee terkumpul.');
    const blob = new Blob([JSON.stringify(reviews, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `shopee_reviews_${Date.now()}.json`;
    a.click();
    console.log(`🛑 Selesai! Mengunduh ${reviews.length} ulasan produk Shopee.`);
  };

  console.log('🚀 [Shopee Scraper Aktif] Auto-scanning ulasan & paginasi... Ketik stopCapture() untuk simpan JSON.');
})();
