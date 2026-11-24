/**
 * Shopee Scraper Content Script
 * 1. Mengekstrak ulasan produk Shopee secara real-time dari DOM (.q2b7Oq, data-cmtid).
 * 2. Auto-scraping saat membaca halaman ulasan produk atau berpindah pagination.
 * 3. Sinkronisasi penuh dengan HUD dan storage ekstensi.
 */
(function() {
  if (window.__shopeeScraperInstalled) return;
  window.__shopeeScraperInstalled = true;

  let isCapturingShopee = false;
  let capturedReviews = new Map(); // id -> review object
  let observer = null;
  let scrollHandler = null;
  let scanDebounceTimer = null;

  function scanExistingReviews() {
    const items = document.querySelectorAll('.q2b7Oq, [data-cmtid]');
    let added = 0;

    items.forEach((el, idx) => {
      try {
        const cmtId = el.getAttribute('data-cmtid') || `shopee_rev_${idx + 1}_${Date.now()}`;
        if (capturedReviews.has(cmtId)) return;

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

        if (!text && !username) return;

        const revObj = {
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
        };

        capturedReviews.set(cmtId, revObj);
        added++;
      } catch (e) {}
    });

    if (added > 0) {
      persistToStorage();
      updateHUD();
    }
    return added;
  }

  function persistToStorage() {
    const list = Array.from(capturedReviews.values());
    chrome.storage.local.set({
      capturedShopeeReviews: list,
      shopeeCount: list.length
    });
  }

  function createHUD() {
    if (document.getElementById('shopee-scraper-hud')) return;
    const hud = document.createElement('div');
    hud.id = 'shopee-scraper-hud';
    hud.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      background: #0d0e13;
      border: 1px solid #38bdf8;
      color: #e2e8f0;
      padding: 10px 14px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      gap: 10px;
      pointer-events: none;
      transition: opacity 0.3s;
    `;
    hud.innerHTML = `
      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981; box-shadow:0 0 8px #10b981;"></span>
      <span style="font-weight:600; color:#38bdf8;">Shopee Scraper:</span>
      <span id="shopee-hud-count" style="font-family:monospace; font-size:13px; font-weight:700;">0 ulasan</span>
    `;
    document.body.appendChild(hud);
  }

  function updateHUD() {
    const el = document.getElementById('shopee-hud-count');
    if (el) {
      el.textContent = `${capturedReviews.size} ulasan`;
    }
  }

  function removeHUD() {
    const hud = document.getElementById('shopee-scraper-hud');
    if (hud) hud.remove();
  }

  function startCapturing() {
    isCapturingShopee = true;
    createHUD();
    scanExistingReviews();

    if (!observer) {
      observer = new MutationObserver(() => {
        if (!isCapturingShopee) return;
        clearTimeout(scanDebounceTimer);
        scanDebounceTimer = setTimeout(scanExistingReviews, 400);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    if (!scrollHandler) {
      scrollHandler = () => {
        if (!isCapturingShopee) return;
        clearTimeout(scanDebounceTimer);
        scanDebounceTimer = setTimeout(scanExistingReviews, 300);
      };
      window.addEventListener('scroll', scrollHandler, { passive: true });
    }
  }

  function stopCapturing() {
    isCapturingShopee = false;
    if (observer) { observer.disconnect(); observer = null; }
    if (scrollHandler) { window.removeEventListener('scroll', scrollHandler); scrollHandler = null; }
    removeHUD();
  }

  // Load existing state
  chrome.storage.local.get(['capturedShopeeReviews', 'isCapturing'], (res) => {
    if (res.capturedShopeeReviews && Array.isArray(res.capturedShopeeReviews)) {
      res.capturedShopeeReviews.forEach(r => capturedReviews.set(r.id, r));
    }
    if (res.isCapturing) {
      startCapturing();
    }
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'START_CAPTURE' || msg.action === 'START_SHOPEE_CAPTURE') {
      startCapturing();
      sendResponse({ status: 'STARTED', count: capturedReviews.size });
    } else if (msg.action === 'STOP_CAPTURE' || msg.action === 'STOP_SHOPEE_CAPTURE') {
      stopCapturing();
      sendResponse({ status: 'STOPPED', count: capturedReviews.size });
    } else if (msg.action === 'SCAN_PAGE_NOW' || msg.action === 'SCAN_SHOPEE_NOW') {
      const added = scanExistingReviews();
      sendResponse({ status: 'SCANNED', total: capturedReviews.size, added: added });
    } else if (msg.action === 'GET_STATUS') {
      sendResponse({ isCapturing: isCapturingShopee, count: capturedReviews.size });
    } else if (msg.action === 'CLEAR_DATA' || msg.action === 'RESET_SHOPEE_CAPTURE') {
      capturedReviews.clear();
      persistToStorage();
      updateHUD();
      sendResponse({ status: 'CLEARED' });
    }
    return true;
  });

})();
