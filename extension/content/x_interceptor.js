/**
 * Twitter/X Interceptor & DOM Parser running in MAIN World context.
 * 1. Mendukung ekstraksi tweet langsung dari DOM HTML modern (<article>) seperti docs/sample-bone/timeline-search.html.
 * 2. Meng-intercept XHR SearchTimeline & Fetch.
 * 3. Auto-scraping tweet baru saat scrolling.
 * 4. Sinkronisasi penuh dengan HUD pojok kanan bawah dan storage ekstensi.
 */
(function() {
  if (window.__socialScraperMainInjected) return;
  window.__socialScraperMainInjected = true;

  window.responseCount = window.responseCount || 0;
  window.allResponses = window.allResponses || [];
  window.capturedDomTweets = new Map();
  window._socialScraperActive = false;

  let domObserver = null;
  let scrollHandler = null;
  let scanTimer = null;

  function parseMetricNumber(str) {
    if (!str) return 0;
    const clean = str.toLowerCase().replace(/\s+/g, '');
    let mult = 1;
    if (clean.includes('rb') || clean.includes('k')) mult = 1000;
    else if (clean.includes('jt') || clean.includes('m')) mult = 1000000;
    const num = clean.replace(/[^\d.,]/g, '').replace(/,/g, '.');
    return Math.round((parseFloat(num) || 0) * mult);
  }

  // Ekstraksi tweet dari elemen <article> di DOM (identik dengan timeline-search.html)
  function extractTweetFromArticle(art) {
    try {
      const linkEl = art.querySelector('a[href*="/status/"]');
      let tweetUrl = '';
      let tweetId = '';
      if (linkEl) {
        const href = linkEl.getAttribute('href') || '';
        tweetUrl = href.startsWith('http') ? href : `https://x.com${href}`;
        const match = href.match(/\/status\/(\d+)/);
        if (match) tweetId = match[1];
      }

      // Handle username (@...)
      let username = '';
      const handleEl = art.querySelector('a[href*="/"] span[class*="text-secondary"]') ||
                       art.querySelector('[data-testid="User-Name"]');
      const handleTxt = (handleEl?.innerText || handleEl?.textContent || '').trim();
      const hMatch = handleTxt.match(/@([a-zA-Z0-9_]+)/);
      if (hMatch) username = `@${hMatch[1]}`;

      // User display name
      let user_name = '';
      const nameEl = art.querySelector('div[class*="font-bold"][class*="truncate"]') ||
                     art.querySelector('[data-testid="User-Name"] span');
      user_name = (nameEl?.innerText || nameEl?.textContent || '').trim();
      if (!user_name && username) user_name = username.replace('@', '');

      // Tweet Text
      const textEl = art.querySelector('div[class*="text-body"][class*="whitespace-pre-wrap"]') ||
                     art.querySelector('[data-testid="tweetText"]');
      const text = (textEl?.innerText || textEl?.textContent || '').trim();
      if (!text) return null;

      if (!tweetId) {
        tweetId = `x_${username}_${text.substring(0, 25)}`.replace(/\s+/g, '_');
      }

      // Metrics dari aria-label grup aksi
      let likes = 0, retweets = 0, replies = 0, views = 0;
      const groupEl = art.querySelector('div[role="group"][aria-label]');
      if (groupEl) {
        const aria = groupEl.getAttribute('aria-label') || '';
        const repM = aria.match(/([\d.,KkMmbjt]+)\s*(?:balasan|replies|reply)/i);
        if (repM) replies = parseMetricNumber(repM[1]);
        const rtM = aria.match(/([\d.,KkMmbjt]+)\s*(?:posting ulang|reposts|retweets|repost|retweet)/i);
        if (rtM) retweets = parseMetricNumber(rtM[1]);
        const likeM = aria.match(/([\d.,KkMmbjt]+)\s*(?:suka|likes|like)/i);
        if (likeM) likes = parseMetricNumber(likeM[1]);
        const viewM = aria.match(/([\d.,KkMmbjt]+)\s*(?:tampilan|views|view)/i);
        if (viewM) views = parseMetricNumber(viewM[1]);
      }

      // Relative time / Created At
      const timeEl = art.querySelector('time') || linkEl;
      const createdAt = timeEl?.getAttribute('datetime') || timeEl?.innerText?.trim() || '';

      // Avatar
      const avatarImg = art.querySelector('div[data-post-avatar="true"] img') ||
                        art.querySelector('[data-testid="Tweet-User-Avatar"] img') ||
                        art.querySelector('img[alt^="@"]');
      const avatarUrl = avatarImg?.getAttribute('src') || '';

      return {
        id: tweetId,
        full_text: text,
        created_at: createdAt,
        username: username,
        user_name: user_name,
        likes: likes,
        retweets: retweets,
        replies: replies,
        views: views,
        tweet_url: tweetUrl,
        avatar_url: avatarUrl
      };
    } catch (e) {
      return null;
    }
  }

  // Scan elemen DOM artikel yang sedang terlihat di layar
  function scanDomTweets() {
    if (!window._socialScraperActive) return;
    const articles = document.querySelectorAll('article');
    let added = 0;
    const newlyCaptured = [];

    articles.forEach(art => {
      const tweet = extractTweetFromArticle(art);
      if (tweet && !window.capturedDomTweets.has(tweet.id)) {
        window.capturedDomTweets.set(tweet.id, tweet);
        newlyCaptured.push(tweet);
        added++;
      }
    });

    if (added > 0) {
      const totalCount = window.capturedDomTweets.size + window.allResponses.length;
      updateFloatingIndicator(totalCount);
      flashFloatingIndicator(added);

      window.dispatchEvent(new CustomEvent('SOCIAL_SCRAPER_PAYLOAD_CAPTURED', {
        detail: {
          platform: 'twitter',
          source: 'dom_html',
          tweets: newlyCaptured,
          totalCount: totalCount
        }
      }));
    }
  }

  function scheduleDomScan() {
    if (!window._socialScraperActive) return;
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(scanDomTweets, 300);
  }

  function startTwitterScraper() {
    window._socialScraperActive = true;
    showFloatingIndicator();
    scanDomTweets();

    if (!domObserver) {
      domObserver = new MutationObserver(scheduleDomScan);
      domObserver.observe(document.body, { childList: true, subtree: true });
    }

    if (!scrollHandler) {
      scrollHandler = scheduleDomScan;
      window.addEventListener('scroll', scrollHandler, { passive: true });
    }
  }

  function stopTwitterScraper() {
    window._socialScraperActive = false;
    if (domObserver) {
      domObserver.disconnect();
      domObserver = null;
    }
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler);
      scrollHandler = null;
    }
    hideFloatingIndicator();
  }

  // Intercept XMLHttpRequest (SearchTimeline)
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function() {
    this.addEventListener('load', function() {
      if (
        this._url &&
        (this._url.includes('SearchTimeline') || this._url.includes('UserTweets') || this._url.includes('TweetDetail')) &&
        this.status === 200
      ) {
        try {
          const data = JSON.parse(this.responseText);
          if (window._socialScraperActive) {
            window.responseCount++;
            window.allResponses.push(data);
            const totalCount = window.capturedDomTweets.size + window.allResponses.length;
            updateFloatingIndicator(totalCount);

            window.dispatchEvent(new CustomEvent('SOCIAL_SCRAPER_PAYLOAD_CAPTURED', {
              detail: {
                platform: 'twitter',
                source: 'xhr_json',
                data: data,
                count: totalCount
              }
            }));
          }
        } catch (e) {}
      }
    });
    return originalSend.apply(this, arguments);
  };

  // Intercept fetch API sebagai fallback
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      if (
        url &&
        (url.includes('SearchTimeline') || url.includes('UserTweets') || url.includes('TweetDetail')) &&
        response.status === 200
      ) {
        const clone = response.clone();
        clone.json().then(data => {
          if (window._socialScraperActive) {
            window.responseCount++;
            window.allResponses.push(data);
            const totalCount = window.capturedDomTweets.size + window.allResponses.length;
            updateFloatingIndicator(totalCount);

            window.dispatchEvent(new CustomEvent('SOCIAL_SCRAPER_PAYLOAD_CAPTURED', {
              detail: {
                platform: 'twitter',
                source: 'fetch_json',
                data: data,
                count: totalCount
              }
            }));
          }
        }).catch(() => {});
      }
    } catch (e) {}
    return response;
  };

  // SINKRONISASI TOTAL: Dengarkan sync dari content_bridge (storage change)
  window.addEventListener('SOCIAL_SCRAPER_STORAGE_SYNC', (e) => {
    const detail = e.detail;
    if (!detail) return;
    if (detail.isCapturing !== undefined) {
      if (detail.isCapturing && !window._socialScraperActive) {
        startTwitterScraper();
      } else if (!detail.isCapturing && window._socialScraperActive) {
        stopTwitterScraper();
      }
    }
    if (detail.count !== undefined) {
      updateFloatingIndicator(detail.count);
    }
  });

  // Perintah kontrol dari Popup Ekstensi
  window.addEventListener('SOCIAL_SCRAPER_COMMAND', (e) => {
    const cmd = e.detail?.action;
    if (cmd === 'START') {
      startTwitterScraper();
    } else if (cmd === 'STOP') {
      stopTwitterScraper();
    } else if (cmd === 'RESET') {
      window.responseCount = 0;
      window.allResponses = [];
      window.capturedDomTweets.clear();
      updateFloatingIndicator(0);
    }
  });

  // Floating on-page HUD badge Twitter (Pojok Kanan Bawah)
  function showFloatingIndicator() {
    let hud = document.getElementById('__social_scraper_hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = '__social_scraper_hud';
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
        <span style="font-weight:600; color:#38bdf8;">Twitter Scraper:</span>
        <span id="__social_scraper_count" style="font-family:monospace; font-weight:700;">0 items</span>
        <span id="__social_scraper_badge" style="display:none; font-size:10px; background:#059669; color:#fff; padding:1px 5px; border-radius:4px;"></span>
      `;
      document.body.appendChild(hud);
    }
    hud.style.display = 'flex';
  }

  function updateFloatingIndicator(count) {
    const el = document.getElementById('__social_scraper_count');
    if (el) el.textContent = `${count} items`;
  }

  function flashFloatingIndicator(addedCount) {
    const badge = document.getElementById('__social_scraper_badge');
    if (badge) {
      badge.textContent = `+${addedCount} baru`;
      badge.style.display = 'inline-block';
      setTimeout(() => {
        if (badge) badge.style.display = 'none';
      }, 1800);
    }
  }

  function hideFloatingIndicator() {
    const hud = document.getElementById('__social_scraper_hud');
    if (hud) hud.style.display = 'none';
  }
})();
