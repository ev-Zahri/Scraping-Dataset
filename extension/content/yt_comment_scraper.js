/**
 * YouTube Comments Scraper Content Script
 * 1. Mengekstrak komentar dari struktur HTML/DOM YouTube secara real-time.
 * 2. Auto-scraping komentar baru ketika user scrolling (debounced scroll & MutationObserver).
 * 3. Sinkronisasi dua arah 100% dengan chrome.storage.local dan Popup Ekstensi.
 */
(function() {
  if (window.__ytScraperInstalled) return;
  window.__ytScraperInstalled = true;

  let isCapturingYT = false;
  let capturedComments = new Map(); // id -> comment object
  let observer = null;
  let scrollHandler = null;
  let scanDebounceTimer = null;

  function parseFormattedNumber(str) {
    if (!str) return 0;
    const cleanStr = str.toLowerCase().replace(/\s+/g, '');
    let multiplier = 1;
    if (cleanStr.includes('rb') || cleanStr.includes('k')) {
      multiplier = 1000;
    } else if (cleanStr.includes('jt') || cleanStr.includes('m')) {
      multiplier = 1000000;
    }
    const numPart = cleanStr.replace(/[^\d.,]/g, '').replace(/,/g, '.');
    const val = parseFloat(numPart) || 0;
    return Math.round(val * multiplier);
  }

  function parseLikesCount(el) {
    // 1. Cek langsung teks di #vote-count-middle
    const voteMiddle = el.querySelector('#vote-count-middle');
    if (voteMiddle) {
      const txt = (voteMiddle.innerText || voteMiddle.textContent || '').trim();
      if (txt) {
        const num = parseFormattedNumber(txt);
        if (num > 0) return num;
      }
    }

    // 2. Cek aria-label di like-button
    const likeBtn = el.querySelector('#like-button button') || el.querySelector('ytd-toggle-button-renderer#like-button button');
    if (likeBtn) {
      const aria = likeBtn.getAttribute('aria-label') || '';
      // Format Indo: "bersama 12 orang" atau "12 suka"
      let match = aria.match(/bersama\s+([\d.,KkMm]+)\s+orang/i) || aria.match(/([\d.,KkMm]+)\s+suka/i);
      if (match) return parseFormattedNumber(match[1]);
      
      // Format Inggris: "along with 12 other people" atau "12 likes"
      match = aria.match(/along with ([\d.,KkMm]+) other/i) || aria.match(/([\d.,KkMm]+) like/i);
      if (match) return parseFormattedNumber(match[1]);

      match = aria.match(/^([\d.,KkMm]+)/);
      if (match) return parseFormattedNumber(match[1]);
    }

    return 0;
  }

  function extractCommentFromElement(el) {
    try {
      // 1. Teks komentar dari #content-text
      const textEl = el.querySelector('#content-text') || el.querySelector('.yt-core-attributed-string') || el.querySelector('yt-attributed-string');
      if (!textEl) return null;
      const text = (textEl.innerText || textEl.textContent || '').trim();
      if (!text) return null;

      // 2. Author info dari #author-text
      const authorEl = el.querySelector('#author-text') || el.querySelector('a[href*="/@"]') || el.querySelector('a.yt-simple-endpoint');
      const author = (authorEl?.innerText || authorEl?.textContent || '').trim();
      const authorHref = authorEl?.getAttribute('href') || '';
      const authorUrl = authorHref ? (authorHref.startsWith('http') ? authorHref : `https://www.youtube.com${authorHref}`) : '';

      // 3. Waktu publikasi & Comment ID dari #published-time-text a
      const timeLink = el.querySelector('#published-time-text a') || el.querySelector('a[href*="lc="]');
      const publishedTime = (timeLink?.innerText || timeLink?.textContent || '').trim();
      const href = timeLink?.getAttribute('href') || '';
      let commentId = '';
      if (href) {
        const match = href.match(/(?:[?&]|&amp;)lc=([^&"]+)/);
        if (match) commentId = match[1];
      }

      if (!commentId) {
        commentId = el.getAttribute('data-comment-id') || el.closest('ytd-comment-thread-renderer')?.getAttribute('id');
      }
      if (!commentId) {
        commentId = `yt_${author}_${text.substring(0, 25)}`.replace(/\s+/g, '_');
      }

      // 4. Jumlah Likes
      const likes = parseLikesCount(el);

      // 5. Pinned status
      const isPinned = !!el.querySelector('#pinned-comment-badge ytw-pinned-comment-badge-renderer') ||
                       !!el.querySelector('ytw-pinned-comment-badge-renderer') ||
                       el.hasAttribute('pinned');

      // 6. Avatar
      const avatarImg = el.querySelector('#author-thumbnail img') || el.querySelector('yt-img-shadow img');
      const avatarUrl = avatarImg?.getAttribute('src') || '';

      return {
        id: commentId,
        author: author,
        author_url: authorUrl,
        text: text,
        likes: likes,
        published_time: publishedTime,
        is_pinned: isPinned,
        avatar_url: avatarUrl,
        video_url: window.location.href,
        video_title: document.title.replace(' - YouTube', '').trim()
      };
    } catch (err) {
      return null;
    }
  }

  // Scan elemen-elemen komentar yang ada di DOM saat ini
  function scanExistingComments() {
    const elements = document.querySelectorAll('ytd-comment-view-model, ytd-comment-renderer, #comment.ytd-comment-thread-renderer');
    let added = 0;

    elements.forEach(el => {
      const comment = extractCommentFromElement(el);
      if (comment && comment.text && !capturedComments.has(comment.id)) {
        capturedComments.set(comment.id, comment);
        added++;
      }
    });

    if (added > 0) {
      syncToStorage();
      flashYTHud(added);
    }
    return { added, total: capturedComments.size };
  }

  function scheduleAutoScan() {
    if (!isCapturingYT) return;
    if (scanDebounceTimer) clearTimeout(scanDebounceTimer);
    scanDebounceTimer = setTimeout(() => {
      scanExistingComments();
    }, 300);
  }

  function syncToStorage() {
    const list = Array.from(capturedComments.values());
    chrome.storage.local.set({ capturedYTComments: list });
    updateYTHud(list.length);
  }

  // Mulai Auto-Scraping (Observer + Scroll Listener)
  function startYTObserver() {
    isCapturingYT = true;
    showYTHud();
    scanExistingComments();

    // 1. Observer DOM untuk mendeteksi penambahan ytd-comment-thread-renderer baru
    if (!observer) {
      observer = new MutationObserver(() => {
        scheduleAutoScan();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // 2. Scroll Listener: Menangkap komentar baru saat user scroll ke bawah
    if (!scrollHandler) {
      scrollHandler = () => {
        scheduleAutoScan();
      };
      window.addEventListener('scroll', scrollHandler, { passive: true });
    }

    console.log("⚡ [Social Scraper] YouTube comment auto-capture STARTED.");
  }

  function stopYTObserver() {
    isCapturingYT = false;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler);
      scrollHandler = null;
    }
    hideYTHud();
    console.log("⏹ [Social Scraper] YouTube comment capture STOPPED.");
  }

  // Floating on-page HUD for YouTube (Pojok Kanan Bawah)
  function showYTHud() {
    let hud = document.getElementById('__yt_scraper_hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = '__yt_scraper_hud';
      hud.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        background: #121318;
        border: 1px solid #38bdf8;
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        padding: 8px 14px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        gap: 8px;
        pointer-events: none;
        transition: all 0.25s ease;
      `;
      hud.innerHTML = `
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#34d399; animation:pulse 1.5s infinite;"></span>
        <span style="font-weight:600; color:#38bdf8;">YouTube Scraper:</span>
        <span id="__yt_scraper_count" style="font-family:monospace; font-weight:700;">${capturedComments.size} komentar</span>
        <span id="__yt_scraper_badge" style="display:none; font-size:10px; background:#059669; color:#fff; padding:1px 5px; border-radius:4px;"></span>
      `;
      document.body.appendChild(hud);
    }
    hud.style.display = 'flex';
    updateYTHud(capturedComments.size);
  }

  function updateYTHud(count) {
    const el = document.getElementById('__yt_scraper_count');
    if (el) el.textContent = `${count} komentar`;
  }

  function flashYTHud(addedCount) {
    const badge = document.getElementById('__yt_scraper_badge');
    if (badge) {
      badge.textContent = `+${addedCount} baru`;
      badge.style.display = 'inline-block';
      setTimeout(() => {
        if (badge) badge.style.display = 'none';
      }, 1800);
    }
  }

  function hideYTHud() {
    const hud = document.getElementById('__yt_scraper_hud');
    if (hud) hud.style.display = 'none';
  }

  // SINKRONISASI TOTAL DENGAN EXTENSION (Task 3)
  // 1. Inisialisasi awal saat tab dibuka / refresh
  chrome.storage.local.get(['isCapturing', 'capturedYTComments'], (res) => {
    const list = res.capturedYTComments || [];
    capturedComments.clear();
    list.forEach(c => capturedComments.set(c.id, c));

    if (res.isCapturing === true) {
      startYTObserver();
    } else {
      updateYTHud(capturedComments.size);
    }
  });

  // 2. Mendengarkan perubahan storage dari Popup Ekstensi secara real-time
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      // Sinkronisasi status capture ON / OFF
      if (changes.isCapturing !== undefined) {
        const shouldCapture = changes.isCapturing.newValue === true;
        if (shouldCapture !== isCapturingYT) {
          if (shouldCapture) startYTObserver();
          else stopYTObserver();
        }
      }

      // Sinkronisasi data komentar (misal saat user klik "Scan Halaman Saat Ini" atau "Reset Buffer")
      if (changes.capturedYTComments !== undefined) {
        const newList = changes.capturedYTComments.newValue || [];
        capturedComments.clear();
        newList.forEach(c => capturedComments.set(c.id, c));
        updateYTHud(newList.length);
        if (isCapturingYT) showYTHud();
      }
    }
  });

  // 3. YouTube SPA navigation handler (jika berpindah video tanpa reload)
  window.addEventListener('yt-navigate-finish', () => {
    if (isCapturingYT) {
      scanExistingComments();
    }
  });

  // Listen for messages directly from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'SCAN_NOW') {
      const res = scanExistingComments();
      sendResponse({ status: 'scanned', added: res.added, total: res.total, comments: Array.from(capturedComments.values()) });
    } else if (message.action === 'START_YT_CAPTURE') {
      startYTObserver();
      sendResponse({ status: 'started', count: capturedComments.size });
    } else if (message.action === 'STOP_YT_CAPTURE') {
      stopYTObserver();
      sendResponse({ status: 'stopped', count: capturedComments.size });
    } else if (message.action === 'RESET_YT_CAPTURE') {
      capturedComments.clear();
      chrome.storage.local.set({ capturedYTComments: [] });
      updateYTHud(0);
      sendResponse({ status: 'reset' });
    } else if (message.action === 'GET_YT_COUNT') {
      sendResponse({ count: capturedComments.size, comments: Array.from(capturedComments.values()) });
    }
    return true;
  });
})();
