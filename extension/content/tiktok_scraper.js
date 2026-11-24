/**
 * TikTok Scraper Content Script
 * 1. Mengekstrak komentar TikTok secara real-time (Mendukung Level 1 dan Level 2 Replies).
 * 2. Auto-scraping saat scrolling & auto-expand balasan komentar.
 * 3. Sinkronisasi penuh dengan HUD dan storage ekstensi.
 */
(function() {
  if (window.__tiktokScraperInstalled) return;
  window.__tiktokScraperInstalled = true;

  let isCapturingTikTok = false;
  let capturedComments = new Map(); // id -> comment object
  let observer = null;
  let scrollHandler = null;
  let scanDebounceTimer = null;

  function parseMetric(str) {
    if (!str) return 0;
    const clean = str.replace(/&nbsp;/g, ' ').toLowerCase().trim();
    let mult = 1;
    if (clean.includes('rb') || clean.includes('k')) mult = 1000;
    else if (clean.includes('jt') || clean.includes('m')) mult = 1000000;
    const num = clean.replace(/[^\d.,]/g, '').replace(/,/g, '.');
    return Math.round((parseFloat(num) || 0) * mult);
  }

  function scanExistingComments() {
    const items = document.querySelectorAll('[class*="DivCommentItemWrapper"]');
    let added = 0;

    items.forEach((item) => {
      try {
        const isLevel2 = !!item.querySelector('[data-e2e="comment-level-2"]') || !!item.querySelector('[data-e2e="comment-username-2"]');
        const level = isLevel2 ? 2 : 1;

        const userLink = item.querySelector('a[href*="/@"]');
        const handle = userLink ? `@${userLink.getAttribute('href').replace(/^\/@/, '').split('?')[0]}` : '';

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
          likes = parseMetric(str);
        }

        const commentId = `tiktok_c${level}_${handle.replace('@', '')}_${text.substring(0, 16)}`.replace(/[\s\W]/g, '_');
        if (capturedComments.has(commentId)) return;

        const commentObj = {
          id: commentId,
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
          tweet_url: handle ? `https://www.tiktok.com/${handle}` : window.location.href
        };

        capturedComments.set(commentId, commentObj);
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
    const list = Array.from(capturedComments.values());
    chrome.storage.local.set({
      capturedTikTokComments: list,
      tiktokCount: list.length
    });
  }

  function createHUD() {
    if (document.getElementById('tiktok-scraper-hud')) return;
    const hud = document.createElement('div');
    hud.id = 'tiktok-scraper-hud';
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
      <span style="font-weight:600; color:#38bdf8;">TikTok Scraper:</span>
      <span id="tiktok-hud-count" style="font-family:monospace; font-size:13px; font-weight:700;">0 komentar</span>
    `;
    document.body.appendChild(hud);
  }

  function updateHUD() {
    const el = document.getElementById('tiktok-hud-count');
    if (el) {
      el.textContent = `${capturedComments.size} komentar`;
    }
  }

  function removeHUD() {
    const hud = document.getElementById('tiktok-scraper-hud');
    if (hud) hud.remove();
  }

  function startCapturing() {
    isCapturingTikTok = true;
    createHUD();
    scanExistingComments();

    if (!observer) {
      observer = new MutationObserver(() => {
        if (!isCapturingTikTok) return;
        clearTimeout(scanDebounceTimer);
        scanDebounceTimer = setTimeout(scanExistingComments, 400);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    if (!scrollHandler) {
      scrollHandler = () => {
        if (!isCapturingTikTok) return;
        clearTimeout(scanDebounceTimer);
        scanDebounceTimer = setTimeout(scanExistingComments, 300);
      };
      window.addEventListener('scroll', scrollHandler, { passive: true });
    }
  }

  function stopCapturing() {
    isCapturingTikTok = false;
    if (observer) { observer.disconnect(); observer = null; }
    if (scrollHandler) { window.removeEventListener('scroll', scrollHandler); scrollHandler = null; }
    removeHUD();
  }

  // Load existing state
  chrome.storage.local.get(['capturedTikTokComments', 'isCapturing'], (res) => {
    if (res.capturedTikTokComments && Array.isArray(res.capturedTikTokComments)) {
      res.capturedTikTokComments.forEach(c => capturedComments.set(c.id, c));
    }
    if (res.isCapturing) {
      startCapturing();
    }
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'START_CAPTURE' || msg.action === 'START_TIKTOK_CAPTURE') {
      startCapturing();
      sendResponse({ status: 'STARTED', count: capturedComments.size });
    } else if (msg.action === 'STOP_CAPTURE' || msg.action === 'STOP_TIKTOK_CAPTURE') {
      stopCapturing();
      sendResponse({ status: 'STOPPED', count: capturedComments.size });
    } else if (msg.action === 'SCAN_PAGE_NOW' || msg.action === 'SCAN_TIKTOK_NOW') {
      const added = scanExistingComments();
      sendResponse({ status: 'SCANNED', total: capturedComments.size, added: added });
    } else if (msg.action === 'GET_STATUS') {
      sendResponse({ isCapturing: isCapturingTikTok, count: capturedComments.size });
    } else if (msg.action === 'CLEAR_DATA' || msg.action === 'RESET_TIKTOK_CAPTURE') {
      capturedComments.clear();
      persistToStorage();
      updateHUD();
      sendResponse({ status: 'CLEARED' });
    }
    return true;
  });

})();
