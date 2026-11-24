/**
 * Threads Scraper Content Script
 * 1. Mengekstrak postingan Threads dari DOM secara real-time.
 * 2. Auto-scraping postingan baru saat scrolling (debounced scroll & MutationObserver).
 * 3. Sinkronisasi penuh dengan HUD kanan bawah dan storage ekstensi.
 */
(function() {
  if (window.__threadsScraperInstalled) return;
  window.__threadsScraperInstalled = true;

  let isCapturingThreads = false;
  let capturedPosts = new Map(); // id -> post object
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

  function scanExistingPosts() {
    const postLinkElements = document.querySelectorAll('a[href*="/post/"]');
    let added = 0;

    postLinkElements.forEach((linkEl) => {
      try {
        const href = linkEl.getAttribute('href') || '';
        const match = href.match(/\/@([^\/"'\s]+)\/post\/([a-zA-Z0-9_\-]+)/);
        if (!match) return;

        const handle = match[1];
        const postId = match[2];
        if (capturedPosts.has(postId)) return;

        // Cari parent post container
        let postContainer = linkEl.closest('div[data-pressable-container="true"]') ||
                            linkEl.closest('div[class*="x1a6qonq"]') ||
                            linkEl.parentElement?.parentElement?.parentElement?.parentElement;
        
        // Datetime
        const timeEl = postContainer ? postContainer.querySelector('time') : linkEl.querySelector('time');
        const createdAt = timeEl?.getAttribute('datetime') || timeEl?.innerText?.trim() || '';

        // Teks postingan
        let fullText = '';
        if (postContainer) {
          const spans = postContainer.querySelectorAll('span[dir="auto"]');
          const paragraphs = [];
          spans.forEach(s => {
            const txt = (s.innerText || s.textContent || '').trim();
            if (txt && txt.length > 1 && !txt.match(/^\d+\s*(?:jam|hari|m|h|d|detik|menit)$/i) && txt !== 'Lainnya') {
              if (!paragraphs.some(p => p === txt || p.includes(txt))) {
                paragraphs.push(txt);
              }
            }
          });
          fullText = paragraphs.join('\n\n').trim();
        }

        if (!fullText) return;

        // Metrics
        let likes = 0, replies = 0, retweets = 0;
        if (postContainer) {
          const actionButtons = postContainer.querySelectorAll('div[role="button"]');
          actionButtons.forEach(btn => {
            const svgTitle = btn.querySelector('svg title')?.textContent || '';
            const countSpan = btn.querySelector('span');
            const countText = countSpan ? countSpan.innerText.trim() : '';

            if (svgTitle.match(/Suka|Like/i)) likes = parseMetric(countText);
            else if (svgTitle.match(/Balas|Reply/i)) replies = parseMetric(countText);
            else if (svgTitle.match(/Posting ulang|Repost/i)) retweets = parseMetric(countText);
          });
        }

        const postObj = {
          id: postId,
          full_text: fullText,
          created_at: createdAt,
          username: `@${handle}`,
          user_name: handle,
          likes: likes,
          retweets: retweets,
          replies: replies,
          views: 0,
          tweet_url: href.startsWith('http') ? href : `https://www.threads.net${href}`
        };

        capturedPosts.set(postId, postObj);
        added++;
      } catch (e) {}
    });

    if (added > 0) {
      syncToStorage();
      flashThreadsHud(added);
    }
    return { added, total: capturedPosts.size };
  }

  function scheduleAutoScan() {
    if (!isCapturingThreads) return;
    if (scanDebounceTimer) clearTimeout(scanDebounceTimer);
    scanDebounceTimer = setTimeout(scanExistingPosts, 350);
  }

  function syncToStorage() {
    const list = Array.from(capturedPosts.values());
    chrome.storage.local.set({ capturedThreadsPosts: list });
    updateThreadsHud(list.length);
  }

  function startThreadsObserver() {
    isCapturingThreads = true;
    showThreadsHud();
    scanExistingPosts();

    if (!observer) {
      observer = new MutationObserver(scheduleAutoScan);
      observer.observe(document.body, { childList: true, subtree: true });
    }

    if (!scrollHandler) {
      scrollHandler = scheduleAutoScan;
      window.addEventListener('scroll', scrollHandler, { passive: true });
    }

    console.log("⚡ [Social Scraper] Threads auto-capture STARTED.");
  }

  function stopThreadsObserver() {
    isCapturingThreads = false;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler);
      scrollHandler = null;
    }
    hideThreadsHud();
    console.log("⏹ [Social Scraper] Threads capture STOPPED.");
  }

  // Floating HUD (Pojok Kanan Bawah)
  function showThreadsHud() {
    let hud = document.getElementById('__threads_scraper_hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = '__threads_scraper_hud';
      hud.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        background: #111216;
        border: 1px solid #2a2d39;
        color: #f1f3f7;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11px;
        padding: 6px 12px;
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        gap: 8px;
        pointer-events: none;
      `;
      hud.innerHTML = `
        <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10b981;"></span>
        <span style="font-weight:600; color:#38bdf8;">Threads:</span>
        <span id="__threads_scraper_count" style="font-family:monospace; font-weight:700;">${capturedPosts.size} posts</span>
        <span id="__threads_scraper_badge" style="display:none; font-size:10px; background:#059669; color:#fff; padding:1px 5px; border-radius:3px;"></span>
      `;
      document.body.appendChild(hud);
    }
    hud.style.display = 'flex';
    updateThreadsHud(capturedPosts.size);
  }

  function updateThreadsHud(count) {
    const el = document.getElementById('__threads_scraper_count');
    if (el) el.textContent = `${count} posts`;
  }

  function flashThreadsHud(addedCount) {
    const badge = document.getElementById('__threads_scraper_badge');
    if (badge) {
      badge.textContent = `+${addedCount} baru`;
      badge.style.display = 'inline-block';
      setTimeout(() => {
        if (badge) badge.style.display = 'none';
      }, 1800);
    }
  }

  function hideThreadsHud() {
    const hud = document.getElementById('__threads_scraper_hud');
    if (hud) hud.style.display = 'none';
  }

  // SINKRONISASI DENGAN STORAGE
  chrome.storage.local.get(['isCapturing', 'capturedThreadsPosts'], (res) => {
    const list = res.capturedThreadsPosts || [];
    capturedPosts.clear();
    list.forEach(p => capturedPosts.set(p.id, p));

    if (res.isCapturing === true) {
      startThreadsObserver();
    } else {
      updateThreadsHud(capturedPosts.size);
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.isCapturing !== undefined) {
        const active = changes.isCapturing.newValue === true;
        if (active !== isCapturingThreads) {
          if (active) startThreadsObserver();
          else stopThreadsObserver();
        }
      }
      if (changes.capturedThreadsPosts !== undefined) {
        const list = changes.capturedThreadsPosts.newValue || [];
        capturedPosts.clear();
        list.forEach(p => capturedPosts.set(p.id, p));
        updateThreadsHud(list.length);
        if (isCapturingThreads) showThreadsHud();
      }
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'SCAN_NOW') {
      const res = scanExistingPosts();
      sendResponse({ status: 'scanned', added: res.added, total: res.total, posts: Array.from(capturedPosts.values()) });
    } else if (message.action === 'START_THREADS_CAPTURE') {
      startThreadsObserver();
      sendResponse({ status: 'started', count: capturedPosts.size });
    } else if (message.action === 'STOP_THREADS_CAPTURE') {
      stopThreadsObserver();
      sendResponse({ status: 'stopped', count: capturedPosts.size });
    } else if (message.action === 'RESET_THREADS_CAPTURE') {
      capturedPosts.clear();
      chrome.storage.local.set({ capturedThreadsPosts: [] });
      updateThreadsHud(0);
      sendResponse({ status: 'reset' });
    }
    return true;
  });
})();
