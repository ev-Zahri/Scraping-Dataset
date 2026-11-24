/**
 * Popup Script Controller (Minimalist Architecture)
 * Mendukung Twitter/X, YouTube, dan Threads dengan auto-detection, direct DOM scan, dan sinkronisasi 2-arah.
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
  const btnToggleText = document.getElementById('btn-toggle-text');
  const btnSaveJson = document.getElementById('btn-save-json');
  const btnClearBuffer = document.getElementById('btn-clear-buffer');
  const btnOpenDashboard = document.getElementById('btn-open-dashboard');
  const platformCards = document.querySelectorAll('.platform-card');

  // State
  let currentPlatform = 'twitter';
  let isCapturing = false;
  let responsesBuffer = [];
  let ytCommentsBuffer = [];
  let threadsBuffer = [];
  let activeTabId = null;
  let activeTabUrl = '';

  // 1. Cek tab aktif saat popup dibuka
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (!currentTab) return;
    activeTabId = currentTab.id;
    activeTabUrl = currentTab.url || '';

    if (activeTabUrl.includes('twitter.com') || activeTabUrl.includes('x.com')) {
      selectPlatform('twitter');
      pageDetectBadge.textContent = 'x.com';
      pageDetectBadge.style.color = '#10b981';
      monitorHint.textContent = 'Tab X terdeteksi. Klik Scan untuk menyisir tweet terlihat, atau Mulai Capture saat scrolling.';
    } else if (activeTabUrl.includes('youtube.com')) {
      selectPlatform('youtube');
      pageDetectBadge.textContent = 'youtube.com';
      pageDetectBadge.style.color = '#10b981';
      monitorHint.textContent = 'Tab YouTube terdeteksi. Buka bagian komentar lalu klik Scan atau Mulai Capture.';
    } else if (activeTabUrl.includes('threads.net')) {
      selectPlatform('threads');
      pageDetectBadge.textContent = 'threads.net';
      pageDetectBadge.style.color = '#10b981';
      monitorHint.textContent = 'Tab Threads terdeteksi. Klik Scan untuk mengambil postingan terlihat, atau Mulai Capture saat scrolling.';
    } else {
      pageDetectBadge.textContent = 'Tab Luar Target';
      pageDetectBadge.style.color = '#64748b';
      monitorHint.textContent = 'Buka x.com, youtube.com, atau threads.net untuk memulai ekstraksi data.';
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
      statName2.textContent = 'Estimasi Item';
    } else if (platform === 'youtube') {
      activePlatformName.textContent = 'YouTube';
      statName1.textContent = 'Komentar';
      statName2.textContent = 'Akun Unik';
    } else if (platform === 'threads') {
      activePlatformName.textContent = 'Threads';
      statName1.textContent = 'Postingan';
      statName2.textContent = 'Akun Unik';
    }

    chrome.storage.local.set({ activePlatform: platform });
    updateUI();
  }

  function syncState() {
    chrome.storage.local.get(['isCapturing', 'capturedResponses', 'capturedYTComments', 'capturedThreadsPosts', 'activePlatform'], (res) => {
      isCapturing = res.isCapturing === true;
      responsesBuffer = res.capturedResponses || [];
      ytCommentsBuffer = res.capturedYTComments || [];
      threadsBuffer = res.capturedThreadsPosts || [];

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
      statusText.textContent = 'RECORDING';
      statusText.style.color = '#10b981';
      btnToggleText.textContent = 'Jeda Capture';
      btnToggleCapture.style.backgroundColor = '#161922';
      btnToggleCapture.style.color = '#e2e8f0';
      btnToggleCapture.style.border = '1px solid #283042';
      monitorHint.textContent = 'Sedang merekam. Scroll halaman target untuk auto-capture konten baru secara real-time.';
    } else {
      statusDot.classList.remove('active');
      statusText.textContent = 'IDLE';
      statusText.style.color = '#64748b';
      btnToggleText.textContent = 'Mulai Capture';
      btnToggleCapture.style.backgroundColor = '#38bdf8';
      btnToggleCapture.style.color = '#09131d';
      btnToggleCapture.style.border = 'none';
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
    } else if (currentPlatform === 'threads') {
      const count = threadsBuffer.length;
      countResponses.textContent = count;
      const uniqueUsers = new Set(threadsBuffer.map(p => p.username)).size;
      countTweets.textContent = uniqueUsers.toLocaleString();
      btnSaveJson.disabled = count === 0;
    }
  }

  // ==========================================
  // BUTTON: Scan Tab Aktif (Tanpa Reload)
  // ==========================================
  btnScanNow.addEventListener('click', async () => {
    if (!activeTabId) {
      alert('Tidak menemukan tab aktif browser.');
      return;
    }

    const originalText = btnScanText.textContent;
    btnScanText.textContent = 'Memindai tab aktif...';
    btnScanNow.style.opacity = '0.7';

    try {
      if (currentPlatform === 'youtube') {
        const results = await chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          func: extractYouTubeCommentsDirect
        });

        const data = results?.[0]?.result;
        if (data && Array.isArray(data.comments)) {
          let addedCount = 0;
          const existingIds = new Set(ytCommentsBuffer.map(c => c.id));
          data.comments.forEach(c => {
            if (!existingIds.has(c.id)) {
              existingIds.add(c.id);
              ytCommentsBuffer.push(c);
              addedCount++;
            }
          });

          await chrome.storage.local.set({ capturedYTComments: ytCommentsBuffer });
          updateUI();
          btnScanText.textContent = addedCount > 0 ? `+${addedCount} komentar baru` : `Semua (${ytCommentsBuffer.length}) telah terambil`;
        } else {
          btnScanText.textContent = 'Komentar belum tampak. Scroll ke bawah!';
        }
      } else if (currentPlatform === 'twitter') {
        const results = await chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          func: extractTwitterTweetsDirect
        });

        const data = results?.[0]?.result;
        if (data && Array.isArray(data.tweets)) {
          let addedCount = 0;
          const existingIds = new Set(responsesBuffer.map(t => t.id || JSON.stringify(t)));
          data.tweets.forEach(tw => {
            if (!existingIds.has(tw.id)) {
              existingIds.add(tw.id);
              responsesBuffer.push(tw);
              addedCount++;
            }
          });

          await chrome.storage.local.set({ capturedResponses: responsesBuffer });
          updateUI();
          btnScanText.textContent = addedCount > 0 ? `+${addedCount} tweet baru` : `Semua (${responsesBuffer.length}) telah terambil`;
        } else {
          btnScanText.textContent = 'Tidak menemukan tweet. Scroll timeline!';
        }
      } else if (currentPlatform === 'threads') {
        const results = await chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          func: extractThreadsPostsDirect
        });

        const data = results?.[0]?.result;
        if (data && Array.isArray(data.posts)) {
          let addedCount = 0;
          const existingIds = new Set(threadsBuffer.map(p => p.id));
          data.posts.forEach(p => {
            if (!existingIds.has(p.id)) {
              existingIds.add(p.id);
              threadsBuffer.push(p);
              addedCount++;
            }
          });

          await chrome.storage.local.set({ capturedThreadsPosts: threadsBuffer });
          updateUI();
          btnScanText.textContent = addedCount > 0 ? `+${addedCount} post Threads baru` : `Semua (${threadsBuffer.length}) telah terambil`;
        } else {
          btnScanText.textContent = 'Tidak menemukan postingan. Buka threads.net!';
        }
      }
    } catch (err) {
      console.error("Scan error:", err);
      btnScanText.textContent = 'Pastikan tab target sesuai platform!';
    }

    setTimeout(() => {
      btnScanText.textContent = originalText;
      btnScanNow.style.opacity = '1';
    }, 2800);
  });

  // Direct Injected Parsers
  function extractYouTubeCommentsDirect() {
    const results = [];
    const elements = document.querySelectorAll('ytd-comment-view-model, ytd-comment-renderer, #comment.ytd-comment-thread-renderer');
    elements.forEach((el) => {
      try {
        const textEl = el.querySelector('#content-text') || el.querySelector('.yt-core-attributed-string');
        const text = (textEl?.innerText || textEl?.textContent || '').trim();
        if (!text) return;

        const authorEl = el.querySelector('#author-text') || el.querySelector('a[href*="/@"]');
        const author = (authorEl?.innerText || authorEl?.textContent || '').trim();
        const timeLink = el.querySelector('#published-time-text a') || el.querySelector('a[href*="lc="]');
        const publishedTime = (timeLink?.innerText || timeLink?.textContent || '').trim();
        const href = timeLink?.getAttribute('href') || '';
        let commentId = '';
        if (href) {
          const match = href.match(/(?:[?&]|&amp;)lc=([^&"]+)/);
          if (match) commentId = match[1];
        }
        if (!commentId) commentId = el.getAttribute('data-comment-id') || `yt_${author}_${text.substring(0, 20)}`.replace(/\s+/g, '_');

        results.push({
          id: commentId,
          author: author,
          text: text,
          published_time: publishedTime,
          likes: 0,
          video_url: window.location.href
        });
      } catch (e) {}
    });
    return { comments: results };
  }

  function extractTwitterTweetsDirect() {
    const results = [];
    const articles = document.querySelectorAll('article');
    articles.forEach((art) => {
      try {
        const linkEl = art.querySelector('a[href*="/status/"]');
        const href = linkEl?.getAttribute('href') || '';
        const match = href.match(/\/status\/(\d+)/);
        const tweetId = match ? match[1] : '';

        const handleEl = art.querySelector('a[href*="/"] span[class*="text-secondary"]') || art.querySelector('[data-testid="User-Name"]');
        const hMatch = (handleEl?.innerText || '').match(/@([a-zA-Z0-9_]+)/);
        const username = hMatch ? `@${hMatch[1]}` : '';

        const textEl = art.querySelector('div[class*="text-body"][class*="whitespace-pre-wrap"]') || art.querySelector('[data-testid="tweetText"]');
        const text = (textEl?.innerText || textEl?.textContent || '').trim();
        if (!text) return;

        results.push({
          id: tweetId || `x_${username}_${text.substring(0, 20)}`.replace(/\s+/g, '_'),
          full_text: text,
          username: username,
          tweet_url: href.startsWith('http') ? href : `https://x.com${href}`
        });
      } catch (e) {}
    });
    return { tweets: results };
  }

  function extractThreadsPostsDirect() {
    const results = [];
    const postLinks = document.querySelectorAll('a[href*="/post/"]');
    postLinks.forEach((linkEl) => {
      try {
        const href = linkEl.getAttribute('href') || '';
        const match = href.match(/\/@([^\/"'\s]+)\/post\/([a-zA-Z0-9_\-]+)/);
        if (!match) return;

        const handle = match[1];
        const postId = match[2];
        let postContainer = linkEl.closest('div[data-pressable-container="true"]') || linkEl.parentElement?.parentElement?.parentElement?.parentElement;
        const timeEl = postContainer ? postContainer.querySelector('time') : linkEl.querySelector('time');
        const createdAt = timeEl?.getAttribute('datetime') || timeEl?.innerText?.trim() || '';

        let fullText = '';
        if (postContainer) {
          const spans = postContainer.querySelectorAll('span[dir="auto"]');
          const paragraphs = [];
          spans.forEach(s => {
            const txt = (s.innerText || s.textContent || '').trim();
            if (txt && txt.length > 1 && !txt.match(/^\d+\s*(?:jam|hari|m|h|d|detik|menit)$/i) && txt !== 'Lainnya') {
              if (!paragraphs.some(p => p === txt || p.includes(txt))) paragraphs.push(txt);
            }
          });
          fullText = paragraphs.join('\n\n').trim();
        }

        if (!fullText) return;

        results.push({
          id: postId,
          full_text: fullText,
          created_at: createdAt,
          username: `@${handle}`,
          user_name: handle,
          likes: 0,
          retweets: 0,
          replies: 0,
          views: 0,
          tweet_url: href.startsWith('http') ? href : `https://www.threads.net${href}`
        });
      } catch (e) {}
    });
    return { posts: results };
  }

  // ==========================================
  // Toggle Capture (Start / Stop)
  // ==========================================
  btnToggleCapture.addEventListener('click', () => {
    isCapturing = !isCapturing;
    chrome.storage.local.set({ isCapturing: isCapturing }, () => {
      updateUI();
    });

    if (!activeTabId) return;

    if (currentPlatform === 'twitter') {
      const action = isCapturing ? 'START_CAPTURE' : 'STOP_CAPTURE';
      chrome.tabs.sendMessage(activeTabId, { action: action }, () => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            world: "MAIN",
            func: (active) => {
              window._socialScraperActive = active;
              window.dispatchEvent(new CustomEvent('SOCIAL_SCRAPER_COMMAND', { detail: { action: active ? 'START' : 'STOP' } }));
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
    } else if (currentPlatform === 'threads') {
      const action = isCapturing ? 'START_THREADS_CAPTURE' : 'STOP_THREADS_CAPTURE';
      chrome.tabs.sendMessage(activeTabId, { action: action }, () => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            files: ['content/threads_scraper.js']
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
      if (currentPlatform === 'twitter') chrome.tabs.sendMessage(activeTabId, { action: 'STOP_CAPTURE' });
      else if (currentPlatform === 'youtube') chrome.tabs.sendMessage(activeTabId, { action: 'STOP_YT_CAPTURE' });
      else if (currentPlatform === 'threads') chrome.tabs.sendMessage(activeTabId, { action: 'STOP_THREADS_CAPTURE' });
    }

    if (currentPlatform === 'twitter') {
      if (responsesBuffer.length === 0) return;
      const filename = responsesBuffer[0].full_text ? `twitter_tweets_${responsesBuffer.length}_records.json` : `twitter_bulk_${responsesBuffer.length}_responses.json`;
      downloadJson(responsesBuffer, filename);
    } else if (currentPlatform === 'youtube') {
      if (ytCommentsBuffer.length === 0) return;
      downloadJson(ytCommentsBuffer, `youtube_comments_${ytCommentsBuffer.length}_records.json`);
    } else if (currentPlatform === 'threads') {
      if (threadsBuffer.length === 0) return;
      downloadJson(threadsBuffer, `threads_posts_${threadsBuffer.length}_records.json`);
    }
  });

  function downloadJson(dataObject, filename) {
    const blob = new Blob([JSON.stringify(dataObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    if (chrome.downloads) {
      chrome.downloads.download({ url: url, filename: filename, saveAs: true });
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
      } else if (currentPlatform === 'threads') {
        threadsBuffer = [];
        chrome.storage.local.set({ capturedThreadsPosts: [] });
        if (activeTabId) chrome.tabs.sendMessage(activeTabId, { action: 'RESET_THREADS_CAPTURE' });
      }
      updateUI();
    }
  });

  // ==========================================
  // Platform Cards Click Handler
  // ==========================================
  platformCards.forEach(card => {
    card.addEventListener('click', () => {
      const platform = card.getAttribute('data-platform');
      if (platform !== 'twitter' && platform !== 'youtube' && platform !== 'threads') {
        alert(`Platform ${platform.toUpperCase()} sedang dalam antrean pengembangan.`);
        return;
      }
      selectPlatform(platform);
    });
  });

  // ==========================================
  // Buka Dashboard Link (Task 3: Vercel Production Link)
  // ==========================================
  btnOpenDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://scraping-dataset-zeta.vercel.app/' });
  });

  // Storage listener real-time
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.isCapturing !== undefined) isCapturing = changes.isCapturing.newValue === true;
      if (changes.capturedResponses !== undefined) responsesBuffer = changes.capturedResponses.newValue || [];
      if (changes.capturedYTComments !== undefined) ytCommentsBuffer = changes.capturedYTComments.newValue || [];
      if (changes.capturedThreadsPosts !== undefined) threadsBuffer = changes.capturedThreadsPosts.newValue || [];
      updateUI();
    }
  });
});
