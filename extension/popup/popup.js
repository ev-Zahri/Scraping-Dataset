/**
 * Popup Script Controller
 * Manages platform selection, recording state, storage synchronization, and export.
 * Default isCapturing: FALSE (OFF) per user requirement.
 * Includes "Scan Halaman Saat Ini (Tanpa Reload)" direct DOM execution for Twitter & YouTube.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const activePlatformName = document.getElementById('active-platform-name');
  const pageDetectBadge = document.getElementById('page-detect-badge');
  const countResponses = document.getElementById('count-responses');
  const countTweets = document.getElementById('count-tweets');
  const statName1 = document.getElementById('stat-name-1');
  const statName2 = document.getElementById('stat-name-2');
  const monitorHint = document.getElementById('monitor-hint');
  const btnScanNow = document.getElementById('btn-scan-now');
  const btnScanText = document.getElementById('btn-scan-text');
  const btnToggleCapture = document.getElementById('btn-toggle-capture');
  const btnToggleIcon = document.getElementById('btn-toggle-icon');
  const btnToggleText = document.getElementById('btn-toggle-text');
  const btnSaveJson = document.getElementById('btn-save-json');
  const btnClearBuffer = document.getElementById('btn-clear-buffer');
  const btnOpenDashboard = document.getElementById('btn-open-dashboard');
  const platformCards = document.querySelectorAll('.platform-card');

  // Default values
  let currentPlatform = 'twitter';
  let isCapturing = false; // DEFAULT OFF
  let responsesBuffer = [];
  let ytCommentsBuffer = [];
  let activeTabId = null;
  let activeTabUrl = '';

  // Check active tab domain & sync platform
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (!currentTab) return;
    activeTabId = currentTab.id;
    activeTabUrl = currentTab.url || '';

    if (activeTabUrl.includes('twitter.com') || activeTabUrl.includes('x.com')) {
      selectPlatform('twitter');
      pageDetectBadge.textContent = '✓ Tab X/Twitter Terdeteksi';
      pageDetectBadge.style.color = '#34d399';
      monitorHint.innerHTML = 'Status: <b>OFF</b>. Buka pencarian <code>x.com/search</code> lalu klik <b>Mulai Capture</b> atau <b>Scan</b>.';
    } else if (activeTabUrl.includes('youtube.com')) {
      selectPlatform('youtube');
      pageDetectBadge.textContent = '✓ Tab YouTube Terdeteksi';
      pageDetectBadge.style.color = '#34d399';
      monitorHint.innerHTML = 'Status: <b>OFF</b>. Buka kolom komentar video lalu klik <b>Scan Halaman Saat Ini</b> atau <b>Mulai Capture</b>.';
    } else {
      pageDetectBadge.textContent = 'Tab Platform Lain';
      pageDetectBadge.style.color = '#94a3b8';
      monitorHint.innerHTML = 'Buka <code>x.com/search</code> atau <code>youtube.com/watch</code> untuk mulai scraping.';
    }

    syncState();
  });

  function selectPlatform(platform) {
    currentPlatform = platform;
    platformCards.forEach(card => {
      if (card.getAttribute('data-platform') === platform) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    if (platform === 'twitter') {
      activePlatformName.textContent = 'X (Twitter)';
      statName1.textContent = 'Data Terkumpul';
      statName2.textContent = 'Tweets Est.';
    } else if (platform === 'youtube') {
      activePlatformName.textContent = 'YouTube (Komentar)';
      statName1.textContent = 'Komentar Terambil';
      statName2.textContent = 'Akun Unik';
    }

    chrome.storage.local.set({ activePlatform: platform });
    updateUI();
  }

  // Sync state from storage
  function syncState() {
    chrome.storage.local.get(['isCapturing', 'capturedResponses', 'capturedYTComments', 'activePlatform'], (res) => {
      isCapturing = res.isCapturing === true;
      responsesBuffer = res.capturedResponses || [];
      ytCommentsBuffer = res.capturedYTComments || [];
      
      if (res.activePlatform) {
        currentPlatform = res.activePlatform;
      }

      updateUI();
    });
  }

  function updateUI() {
    // Status Indicator
    if (isCapturing) {
      statusDot.classList.add('active');
      statusText.textContent = 'STREAMING';
      statusText.style.color = '#34d399';
      btnToggleIcon.textContent = '⏸';
      btnToggleText.textContent = 'Jeda Capture';
      btnToggleCapture.style.backgroundColor = '#1e1f25';
      btnToggleCapture.style.color = '#e3e1e9';
      btnToggleCapture.style.border = '1px solid #232733';
      monitorHint.innerHTML = '<span style="color:#34d399;">● SEDANG MEREKAM DATA:</span> Scroll halaman ke bawah untuk auto-capture konten baru.';
    } else {
      statusDot.classList.remove('active');
      statusText.textContent = 'OFF';
      statusText.style.color = '#94a3b8';
      btnToggleIcon.textContent = '▶';
      btnToggleText.textContent = 'Mulai Capture';
      btnToggleCapture.style.backgroundColor = '#38bdf8';
      btnToggleCapture.style.color = '#00354a';
      btnToggleCapture.style.border = 'none';
      if (currentPlatform === 'youtube') {
        monitorHint.innerHTML = 'Status: <b>OFF</b>. Klik <b>Scan Halaman Saat Ini</b> atau <b>Mulai Capture</b> untuk auto-scrape saat scroll.';
      } else {
        monitorHint.innerHTML = 'Status: <b>OFF</b>. Klik <b>Scan Halaman Saat Ini</b> atau <b>Mulai Capture</b> lalu scroll feed.';
      }
    }

    // Counts display
    if (currentPlatform === 'twitter') {
      const respCount = responsesBuffer.length;
      countResponses.textContent = respCount;
      const isDirectTweets = responsesBuffer.length > 0 && responsesBuffer[0].full_text;
      const tweetCount = isDirectTweets ? responsesBuffer.length : (respCount * 18);
      countTweets.textContent = tweetCount.toLocaleString();
      btnSaveJson.disabled = respCount === 0;
    } else if (currentPlatform === 'youtube') {
      const count = ytCommentsBuffer.length;
      countResponses.textContent = count;
      const uniqueAuthors = new Set(ytCommentsBuffer.map(c => c.author)).size;
      countTweets.textContent = uniqueAuthors.toLocaleString();
      btnSaveJson.disabled = count === 0;
    }
  }

  // ==========================================
  // BUTTON: Scan Halaman Saat Ini (Tanpa Reload)
  // ==========================================
  btnScanNow.addEventListener('click', async () => {
    if (!activeTabId) {
      alert('Tidak menemukan tab aktif browser.');
      return;
    }

    const originalText = btnScanText.textContent;
    btnScanText.textContent = 'Sedang memindai tab aktif...';
    btnScanNow.style.opacity = '0.7';

    try {
      if (currentPlatform === 'youtube') {
        // Eksekusi fungsi scraper langsung di DOM tab YouTube
        const results = await chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          func: extractYouTubeCommentsDirectFromDOM
        });

        const data = results?.[0]?.result;
        if (data && Array.isArray(data.comments)) {
          const newComments = data.comments;
          let addedCount = 0;

          const existingIds = new Set(ytCommentsBuffer.map(c => c.id));
          newComments.forEach(comment => {
            if (!existingIds.has(comment.id)) {
              existingIds.add(comment.id);
              ytCommentsBuffer.push(comment);
              addedCount++;
            }
          });

          await chrome.storage.local.set({ capturedYTComments: ytCommentsBuffer });
          updateUI();

          if (addedCount > 0) {
            btnScanText.textContent = `✓ Berhasil! +${addedCount} Komentar baru didapat`;
            btnScanNow.style.borderColor = '#34d399';
          } else if (ytCommentsBuffer.length > 0) {
            btnScanText.textContent = `✓ Semua (${ytCommentsBuffer.length}) komentar sudah terambil`;
          } else {
            if (data.commentsSectionPresent) {
              btnScanText.textContent = '⚠️ Belum dimuat. Scroll tab ke bawah ke komentar!';
            } else {
              btnScanText.textContent = '⚠️ Bagian komentar YouTube belum tampak di tab.';
            }
          }
        } else {
          btnScanText.textContent = '⚠️ Gagal membaca komentar di halaman ini.';
        }
      } else if (currentPlatform === 'twitter') {
        // Eksekusi fungsi scraper tweet langsung dari DOM <article> Twitter (sesuai sample timeline-search.html)
        const results = await chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          func: extractTwitterTweetsDirectFromDOM
        });

        const data = results?.[0]?.result;
        if (data && Array.isArray(data.tweets)) {
          const newTweets = data.tweets;
          let addedCount = 0;

          const existingIds = new Set(responsesBuffer.map(t => t.id || JSON.stringify(t)));
          newTweets.forEach(tw => {
            if (!existingIds.has(tw.id)) {
              existingIds.add(tw.id);
              responsesBuffer.push(tw);
              addedCount++;
            }
          });

          await chrome.storage.local.set({ capturedResponses: responsesBuffer });
          updateUI();

          if (addedCount > 0) {
            btnScanText.textContent = `✓ Berhasil! +${addedCount} Tweet baru diambil dari DOM`;
            btnScanNow.style.borderColor = '#34d399';
          } else if (responsesBuffer.length > 0) {
            btnScanText.textContent = `✓ Semua (${responsesBuffer.length}) tweet sudah terambil`;
          } else {
            btnScanText.textContent = '⚠️ Belum ada tweet di timeline. Silakan scroll timeline!';
          }
        } else {
          btnScanText.textContent = '⚠️ Tidak menemukan tweet di halaman ini.';
        }
      }
    } catch (err) {
      console.error("Scan error:", err);
      btnScanText.textContent = '⚠️ Pastikan Anda berada di halaman Twitter atau YouTube!';
    }

    setTimeout(() => {
      btnScanText.textContent = originalText;
      btnScanNow.style.opacity = '1';
      btnScanNow.style.borderColor = '';
    }, 3000);
  });

  // Ekstraksi DOM YouTube (diinjeksi langsung ke tab)
  function extractYouTubeCommentsDirectFromDOM() {
    const results = [];
    const elements = document.querySelectorAll('ytd-comment-view-model, ytd-comment-renderer, #comment.ytd-comment-thread-renderer');

    function parseFormattedNumber(str) {
      if (!str) return 0;
      const cleanStr = str.toLowerCase().replace(/\s+/g, '');
      let multiplier = 1;
      if (cleanStr.includes('rb') || cleanStr.includes('k')) multiplier = 1000;
      else if (cleanStr.includes('jt') || cleanStr.includes('m')) multiplier = 1000000;
      const numPart = cleanStr.replace(/[^\d.,]/g, '').replace(/,/g, '.');
      const val = parseFloat(numPart) || 0;
      return Math.round(val * multiplier);
    }

    function parseLikes(el) {
      const voteMiddle = el.querySelector('#vote-count-middle');
      if (voteMiddle) {
        const txt = (voteMiddle.innerText || voteMiddle.textContent || '').trim();
        if (txt) {
          const num = parseFormattedNumber(txt);
          if (num > 0) return num;
        }
      }
      const likeBtn = el.querySelector('#like-button button') || el.querySelector('ytd-toggle-button-renderer#like-button button');
      if (likeBtn) {
        const aria = likeBtn.getAttribute('aria-label') || '';
        let match = aria.match(/bersama\s+([\d.,KkMm]+)\s+orang/i) || aria.match(/([\d.,KkMm]+)\s+suka/i) ||
                    aria.match(/along with ([\d.,KkMm]+) other/i) || aria.match(/([\d.,KkMm]+) like/i) ||
                    aria.match(/^([\d.,KkMm]+)/);
        if (match) return parseFormattedNumber(match[1]);
      }
      return 0;
    }

    elements.forEach((el) => {
      try {
        const textEl = el.querySelector('#content-text') || el.querySelector('.yt-core-attributed-string') || el.querySelector('yt-attributed-string');
        if (!textEl) return;
        const text = (textEl.innerText || textEl.textContent || '').trim();
        if (!text) return;

        const authorEl = el.querySelector('#author-text') || el.querySelector('a[href*="/@"]') || el.querySelector('a.yt-simple-endpoint');
        const author = (authorEl?.innerText || authorEl?.textContent || '').trim();
        const authorHref = authorEl?.getAttribute('href') || '';
        const authorUrl = authorHref ? (authorHref.startsWith('http') ? authorHref : `https://www.youtube.com${authorHref}`) : '';

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

        const likes = parseLikes(el);
        const isPinned = !!el.querySelector('#pinned-comment-badge ytw-pinned-comment-badge-renderer') ||
                         !!el.querySelector('ytw-pinned-comment-badge-renderer') ||
                         el.hasAttribute('pinned');
        const avatarImg = el.querySelector('#author-thumbnail img') || el.querySelector('yt-img-shadow img');
        const avatarUrl = avatarImg?.getAttribute('src') || '';

        results.push({
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
        });
      } catch (e) {}
    });

    const commentsSectionPresent = !!(document.querySelector('ytd-comments#comments') || document.querySelector('#comments'));
    return {
      comments: results,
      commentsSectionPresent: commentsSectionPresent
    };
  }

  // Ekstraksi DOM Twitter / X (diinjeksi langsung ke tab, sesuai struktur timeline-search.html)
  function extractTwitterTweetsDirectFromDOM() {
    const results = [];
    const articles = document.querySelectorAll('article');

    function parseMetricNumber(str) {
      if (!str) return 0;
      const clean = str.toLowerCase().replace(/\s+/g, '');
      let mult = 1;
      if (clean.includes('rb') || clean.includes('k')) mult = 1000;
      else if (clean.includes('jt') || clean.includes('m')) mult = 1000000;
      const num = clean.replace(/[^\d.,]/g, '').replace(/,/g, '.');
      return Math.round((parseFloat(num) || 0) * mult);
    }

    articles.forEach((art) => {
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

        let username = '';
        const handleEl = art.querySelector('a[href*="/"] span[class*="text-secondary"]') ||
                         art.querySelector('[data-testid="User-Name"]');
        const handleTxt = (handleEl?.innerText || handleEl?.textContent || '').trim();
        const hMatch = handleTxt.match(/@([a-zA-Z0-9_]+)/);
        if (hMatch) username = `@${hMatch[1]}`;

        let user_name = '';
        const nameEl = art.querySelector('div[class*="font-bold"][class*="truncate"]') ||
                       art.querySelector('[data-testid="User-Name"] span');
        user_name = (nameEl?.innerText || nameEl?.textContent || '').trim();
        if (!user_name && username) user_name = username.replace('@', '');

        const textEl = art.querySelector('div[class*="text-body"][class*="whitespace-pre-wrap"]') ||
                       art.querySelector('[data-testid="tweetText"]');
        const text = (textEl?.innerText || textEl?.textContent || '').trim();
        if (!text) return;

        if (!tweetId) {
          tweetId = `x_${username}_${text.substring(0, 25)}`.replace(/\s+/g, '_');
        }

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

        const timeEl = art.querySelector('time') || linkEl;
        const createdAt = timeEl?.getAttribute('datetime') || timeEl?.innerText?.trim() || '';

        const avatarImg = art.querySelector('div[data-post-avatar="true"] img') ||
                          art.querySelector('[data-testid="Tweet-User-Avatar"] img') ||
                          art.querySelector('img[alt^="@"]');
        const avatarUrl = avatarImg?.getAttribute('src') || '';

        results.push({
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
        });
      } catch (e) {}
    });

    return { tweets: results };
  }

  // ==========================================
  // Toggle Capture Button (Click Mulai Capture)
  // ==========================================
  btnToggleCapture.addEventListener('click', () => {
    isCapturing = !isCapturing;
    // Simpan ke storage - ini otomatis memicu onChanged di yt_comment_scraper & content_bridge
    chrome.storage.local.set({ isCapturing: isCapturing }, () => {
      updateUI();
    });

    if (!activeTabId) return;

    if (currentPlatform === 'twitter') {
      const action = isCapturing ? 'START_CAPTURE' : 'STOP_CAPTURE';
      chrome.tabs.sendMessage(activeTabId, { action: action }, () => {
        if (chrome.runtime.lastError) {
          // Direct execution fallback jika content script belum termuat
          chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            world: "MAIN",
            func: (active) => {
              window._socialScraperActive = active;
              window.dispatchEvent(new CustomEvent('SOCIAL_SCRAPER_COMMAND', {
                detail: { action: active ? 'START' : 'STOP' }
              }));
            },
            args: [isCapturing]
          });
        }
      });
    } else if (currentPlatform === 'youtube') {
      const action = isCapturing ? 'START_YT_CAPTURE' : 'STOP_YT_CAPTURE';
      chrome.tabs.sendMessage(activeTabId, { action: action }, () => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            files: ['content/yt_comment_scraper.js']
          }).then(() => {
            chrome.tabs.sendMessage(activeTabId, { action: action });
          }).catch(() => {});
        }
      });
    }
  });

  // ==========================================
  // Stop & Save JSON
  // ==========================================
  btnSaveJson.addEventListener('click', () => {
    isCapturing = false;
    chrome.storage.local.set({ isCapturing: false }, () => {
      updateUI();
    });

    if (activeTabId) {
      if (currentPlatform === 'twitter') {
        chrome.tabs.sendMessage(activeTabId, { action: 'STOP_CAPTURE' });
      } else if (currentPlatform === 'youtube') {
        chrome.tabs.sendMessage(activeTabId, { action: 'STOP_YT_CAPTURE' });
      }
    }

    if (currentPlatform === 'twitter') {
      if (responsesBuffer.length === 0) return;
      const isDirectTweets = responsesBuffer[0].full_text !== undefined;
      const filename = isDirectTweets
        ? `twitter_tweets_${responsesBuffer.length}_records.json`
        : `twitter_bulk_${responsesBuffer.length}_responses.json`;
      downloadJson(responsesBuffer, filename);
    } else if (currentPlatform === 'youtube') {
      if (ytCommentsBuffer.length === 0) return;
      downloadJson(ytCommentsBuffer, `youtube_comments_${ytCommentsBuffer.length}_records.json`);
    }
  });

  function downloadJson(dataObject, filename) {
    const blob = new Blob([JSON.stringify(dataObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    if (chrome.downloads) {
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      });
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    }
  }

  // ==========================================
  // Reset Buffer Button
  // ==========================================
  btnClearBuffer.addEventListener('click', () => {
    if (confirm('Hapus seluruh buffer data yang terkumpul untuk platform ini?')) {
      if (currentPlatform === 'twitter') {
        responsesBuffer = [];
        chrome.storage.local.set({ capturedResponses: [] });
        if (activeTabId) chrome.tabs.sendMessage(activeTabId, { action: 'RESET_CAPTURE' });
      } else if (currentPlatform === 'youtube') {
        ytCommentsBuffer = [];
        chrome.storage.local.set({ capturedYTComments: [] });
        if (activeTabId) chrome.tabs.sendMessage(activeTabId, { action: 'RESET_YT_CAPTURE' });
      }
      updateUI();
    }
  });

  // Platform Cards Click Handler
  platformCards.forEach(card => {
    card.addEventListener('click', () => {
      const platform = card.getAttribute('data-platform');
      if (platform !== 'twitter' && platform !== 'youtube') {
        alert(`Platform ${platform.toUpperCase()} sedang dalam antrean integrasi.`);
        return;
      }
      selectPlatform(platform);
    });
  });

  // Open Web Dashboard
  btnOpenDashboard.addEventListener('click', () => {
    const dashboardUrl = chrome.runtime.getURL('../index.html');
    chrome.tabs.create({ url: dashboardUrl });
  });

  // Listen for storage changes in real-time
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.isCapturing !== undefined) {
        isCapturing = changes.isCapturing.newValue === true;
      }
      if (changes.capturedResponses !== undefined) {
        responsesBuffer = changes.capturedResponses.newValue || [];
      }
      if (changes.capturedYTComments !== undefined) {
        ytCommentsBuffer = changes.capturedYTComments.newValue || [];
      }
      updateUI();
    }
  });
});
