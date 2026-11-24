/**
 * Content Bridge Script (Isolated World)
 * Menghubungkan komunikasi antara MAIN World (x_interceptor.js), chrome.storage, dan Popup Ekstensi.
 */
(function() {
  // 1. Terima payload yang di-capture dari MAIN world
  window.addEventListener('SOCIAL_SCRAPER_PAYLOAD_CAPTURED', (e) => {
    const detail = e.detail;
    if (!detail) return;

    chrome.storage.local.get(['capturedResponses', 'isCapturing'], (res) => {
      if (res.isCapturing) {
        const list = res.capturedResponses || [];
        if (detail.data) {
          list.push(detail.data);
        } else if (Array.isArray(detail.tweets)) {
          // Merge DOM tweets
          const seen = new Set(list.map(item => item.id || (item.data ? 'raw' : '')));
          detail.tweets.forEach(tw => {
            if (!seen.has(tw.id)) {
              seen.add(tw.id);
              list.push(tw);
            }
          });
        }
        chrome.storage.local.set({ capturedResponses: list });
      }
    });
  });

  // 2. SINKRONISASI TOTAL: Dengarkan perubahan storage dan teruskan ke MAIN world HUD
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      const syncDetail = {};
      if (changes.isCapturing !== undefined) {
        syncDetail.isCapturing = changes.isCapturing.newValue === true;
      }
      if (changes.capturedResponses !== undefined) {
        syncDetail.count = (changes.capturedResponses.newValue || []).length;
      }
      window.dispatchEvent(new CustomEvent('SOCIAL_SCRAPER_STORAGE_SYNC', { detail: syncDetail }));
    }
  });

  // 3. Sinkronisasi awal saat tab dibuka
  chrome.storage.local.get(['isCapturing', 'capturedResponses'], (res) => {
    const isCapturing = res.isCapturing === true;
    const count = (res.capturedResponses || []).length;
    window.dispatchEvent(new CustomEvent('SOCIAL_SCRAPER_STORAGE_SYNC', {
      detail: { isCapturing: isCapturing, count: count }
    }));
  });

  // 4. Listen for control messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'START_CAPTURE') {
      window.dispatchEvent(new CustomEvent('SOCIAL_SCRAPER_COMMAND', { detail: { action: 'START' } }));
      sendResponse({ status: 'started' });
    } else if (message.action === 'STOP_CAPTURE') {
      window.dispatchEvent(new CustomEvent('SOCIAL_SCRAPER_COMMAND', { detail: { action: 'STOP' } }));
      sendResponse({ status: 'stopped' });
    } else if (message.action === 'RESET_CAPTURE') {
      window.dispatchEvent(new CustomEvent('SOCIAL_SCRAPER_COMMAND', { detail: { action: 'RESET' } }));
      sendResponse({ status: 'reset' });
    }
    return true;
  });
})();
