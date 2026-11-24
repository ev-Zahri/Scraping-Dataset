/**
 * Parser Tweet HTML untuk Twitter / X
 * Mengekstrak tweet dari struktur HTML modern (seperti docs/sample-bone/timeline-search.html)
 * serta mendukung fallback format legacy (article[data-testid="tweet"]).
 */

const fs = require('fs');

function parseMetricNumber(str) {
  if (!str) return 0;
  const clean = str.toLowerCase().replace(/\s+/g, '');
  let mult = 1;
  if (clean.includes('rb') || clean.includes('k')) mult = 1000;
  else if (clean.includes('jt') || clean.includes('m')) mult = 1000000;
  const num = clean.replace(/[^\d.,]/g, '').replace(/,/g, '.');
  return Math.round((parseFloat(num) || 0) * mult);
}

function parseEngagementMetrics(str) {
  const metrics = { replies: 0, retweets: 0, likes: 0, bookmarks: 0, views: 0 };
  if (!str) return metrics;

  // Format Indo: "49 balasan, 592 posting ulang, 8494 suka, 579 markah, 475157 tampilan"
  // Format English: "49 replies, 592 reposts, 8494 likes, 579 bookmarks, 475157 views"
  const replyMatch = str.match(/([\d.,KkMmbjt]+)\s*(?:balasan|replies|reply)/i);
  if (replyMatch) metrics.replies = parseMetricNumber(replyMatch[1]);

  const rtMatch = str.match(/([\d.,KkMmbjt]+)\s*(?:posting ulang|reposts|retweets|repost|retweet)/i);
  if (rtMatch) metrics.retweets = parseMetricNumber(rtMatch[1]);

  const likeMatch = str.match(/([\d.,KkMmbjt]+)\s*(?:suka|likes|like)/i);
  if (likeMatch) metrics.likes = parseMetricNumber(likeMatch[1]);

  const bookmarkMatch = str.match(/([\d.,KkMmbjt]+)\s*(?:markah|bookmarks|bookmark)/i);
  if (bookmarkMatch) metrics.bookmarks = parseMetricNumber(bookmarkMatch[1]);

  const viewMatch = str.match(/([\d.,KkMmbjt]+)\s*(?:tampilan|views|view)/i);
  if (viewMatch) metrics.views = parseMetricNumber(viewMatch[1]);

  return metrics;
}

function extractTweetsFromXHtml(htmlContent) {
  const tweets = [];
  const seenIds = new Set();

  // Pisahkan per tag <article
  const articles = htmlContent.split(/<article\b/i);

  for (let i = 1; i < articles.length; i++) {
    const art = articles[i];

    // 1. Tweet status link & Tweet ID
    let tweetId = '';
    let tweetUrl = '';
    const statusMatch = art.match(/href="([^"]*\/status\/(\d+)[^"]*)"/i);
    if (statusMatch) {
      tweetUrl = statusMatch[1].startsWith('http') ? statusMatch[1] : `https://x.com${statusMatch[1]}`;
      tweetId = statusMatch[2];
    }

    // 2. Username handle (misal @MajorStarMan)
    let username = '';
    const handleMatch = art.match(/@([a-zA-Z0-9_]{1,15})/);
    if (handleMatch) {
      username = `@${handleMatch[1]}`;
    }

    // 3. User display name
    let user_name = '';
    const nameMatch = art.match(/class="[^"]*font-bold[^"]*truncate[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                      art.match(/class="[^"]*truncate[^"]*font-bold[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                      art.match(/data-testid="User-Name"[\s\S]*?<span[^>]*>([^<]+)<\/span>/i);
    if (nameMatch) {
      user_name = nameMatch[1].replace(/<[^>]+>/g, '').trim();
    } else if (username) {
      user_name = username.replace('@', '');
    }

    // 4. Tweet Text
    let full_text = '';
    // Format modern Tailwind/Base-UI
    const textMatch = art.match(/class="[^"]*text-body[^"]*whitespace-pre-wrap[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                      art.match(/data-testid="tweetText"[^>]*>([\s\S]*?)<\/div>/i);
    if (textMatch) {
      full_text = textMatch[1]
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    }

    if (!full_text) continue; // Jangan masukkan jika tidak ada teks tweet

    // Fallback tweet ID jika tidak ketemu link status
    if (!tweetId) {
      tweetId = `x_${username}_${full_text.substring(0, 20)}`.replace(/\s+/g, '_');
    }

    if (seenIds.has(tweetId)) continue;
    seenIds.add(tweetId);

    // 5. Engagement Metrics (Aria label)
    const metricMatch = art.match(/aria-label="([^"]*(?:balasan|posting ulang|suka|tampilan|replies|reposts|likes|views)[^"]*)"/i);
    const metrics = parseEngagementMetrics(metricMatch ? metricMatch[1] : '');

    // 6. Avatar URL
    let avatarUrl = '';
    const avatarMatch = art.match(/data-post-avatar="true"[\s\S]*?src="([^"]*)"/i) ||
                        art.match(/data-testid="Tweet-User-Avatar"[\s\S]*?src="([^"]*)"/i) ||
                        art.match(/<img[^>]*alt="@[^"]*"[^>]*src="([^"]*)"/i);
    if (avatarMatch) {
      avatarUrl = avatarMatch[1];
    }

    // 7. Created at (relative time / text)
    let created_at = '';
    const timeMatch = art.match(/<time[^>]*datetime="([^"]*)"/i) ||
                      art.match(/href="[^"]*\/status\/\d+"[^>]*>([^<]+)<\/a>/i);
    if (timeMatch) {
      created_at = timeMatch[1].trim();
    }

    tweets.push({
      id: tweetId,
      full_text: full_text,
      created_at: created_at,
      username: username,
      user_name: user_name,
      likes: metrics.likes,
      retweets: metrics.retweets,
      replies: metrics.replies,
      views: metrics.views,
      tweet_url: tweetUrl,
      avatar_url: avatarUrl
    });
  }

  return tweets;
}

module.exports = {
  extractTweetsFromXHtml,
  parseEngagementMetrics,
  parseMetricNumber
};

// CLI test
if (require.main === module) {
  const targetFile = process.argv[2] || 'docs/sample-bone/timeline-search.html';
  if (fs.existsSync(targetFile)) {
    console.log(`📄 Membaca berkas sample X: ${targetFile}`);
    const html = fs.readFileSync(targetFile, 'utf8');
    const results = extractTweetsFromXHtml(html);
    console.log(`✅ Berhasil mengekstrak ${results.length} tweets dari HTML:\n`);
    results.forEach((t, idx) => {
      console.log(`[${idx + 1}] ID: ${t.id} | ${t.username} (${t.user_name}) | Waktu: ${t.created_at}`);
      console.log(`    Metrics: Suka=${t.likes}, RT=${t.retweets}, Balasan=${t.replies}, Views=${t.views}`);
      console.log(`    URL: ${t.tweet_url}`);
      console.log(`    Teks: "${t.full_text.substring(0, 120)}..."\n`);
    });
  }
}
