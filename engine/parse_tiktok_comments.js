/**
 * TikTok Comments HTML Parser Engine
 * Obsidian Precision // Universal Multi-Platform Engine
 * 
 * Supports hierarchical comment extraction:
 * - Level 1: Top-level comments (data-e2e="comment-level-1")
 * - Level 2+: Nested reply comments (data-e2e="comment-level-2")
 * - Handles text comments, sticker/media replies, timestamps, user handles, and likes.
 */

const fs = require('fs');
const path = require('path');

function parseMetricNumber(str) {
  if (!str) return 0;
  const clean = String(str).toLowerCase().replace(/\s+/g, '');
  let mult = 1;
  if (clean.includes('rb') || clean.includes('k')) mult = 1000;
  else if (clean.includes('jt') || clean.includes('m')) mult = 1000000;
  const num = clean.replace(/[^\d.,]/g, '').replace(/,/g, '.');
  return Math.round((parseFloat(num) || 0) * mult);
}

function parseTikTokCommentsHtml(htmlContent) {
  const comments = [];
  const seenIds = new Set();

  // Split by comment item wrapper
  const chunks = htmlContent.split(/(?=<div[^>]*class="[^"]*DivCommentItemWrapper)/i);

  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Determine comment depth level
    let level = 1;
    if (chunk.includes('data-e2e="comment-level-2"') || chunk.includes('comment-username-2')) {
      level = 2;
    }

    // Handle & Profile URL
    const handleMatch = chunk.match(/href="\/@([^"?#\s]+)"/i);
    const handle = handleMatch ? `@${handleMatch[1]}` : '';

    // Display Name
    const nameMatch = chunk.match(/data-e2e="comment-username-\d"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
    const userName = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : (handle ? handle.replace('@', '') : '');

    // Comment Text
    const textMatch = chunk.match(/data-e2e="comment-level-\d"[^>]*>([\s\S]*?)<\/span>/i);
    let text = '';
    if (textMatch) {
      text = textMatch[1]
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    }

    // Fallback for sticker / image media reply
    if (!text) {
      const stickerMatch = chunk.match(/data-e2e="comment-sticker-reply"[\s\S]*?<img[^>]*src="([^"]+)"/i);
      if (stickerMatch) {
        text = '[Sticker / Media Reply]';
      }
    }

    if (!text && !handle) continue;

    // Timestamp
    const dateMatch = chunk.match(/class="[^"]*DivCommentSubContentWrapper[^"]*"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i);
    let timestamp = '';
    if (dateMatch) {
      timestamp = dateMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // Likes count
    let likes = 0;
    const spanMatch = chunk.match(/<span[^>]*class="[^"]*TUXText[^"]*"[^>]*>([\d.,KkMmbjt]+)<\/span><\/div>/i);
    const ariaMatch = chunk.match(/aria-label="[^"]*?\n([\d.,KkMmbjt]+)\s*(?:likes|suka)?/i) || 
                      chunk.match(/([\d.,KkMmbjt]+)\s*(?:likes|suka)/i);
    if (spanMatch) {
      likes = parseMetricNumber(spanMatch[1]);
    } else if (ariaMatch) {
      likes = parseMetricNumber(ariaMatch[1]);
    }

    // Unique Identifier
    const commentId = `tiktok_c${level}_${handle.replace('@', '')}_${i}`.replace(/[\s\W]/g, '_');
    if (seenIds.has(commentId)) continue;
    seenIds.add(commentId);

    comments.push({
      id: commentId,
      level: level,
      is_reply: level > 1,
      full_text: text,
      created_at: timestamp,
      username: handle,
      user_name: userName,
      likes: likes,
      retweets: 0,
      replies: level === 1 ? 1 : 0,
      views: likes,
      tweet_url: handle ? `https://www.tiktok.com/${handle}` : ''
    });
  }

  return comments;
}

// CLI Execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputPath = args[0] || path.join(__dirname, '../docs/sample-bone/tiktok-timeline.html');
  const outputPath = args[1] || path.join(__dirname, '../extracted_json/tiktok_comments_extracted.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`[ERROR] File input tidak ditemukan: ${inputPath}`);
    process.exit(1);
  }

  console.log(`[INFO] Membaca file TikTok: ${inputPath}`);
  const html = fs.readFileSync(inputPath, 'utf8');
  const items = parseTikTokCommentsHtml(html);

  console.log(`[SUCCESS] Berhasil mengekstrak ${items.length} komentar TikTok (Level 1 & Level 2)!`);
  
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(items, null, 2), 'utf8');
  console.log(`[INFO] Hasil disimpan ke: ${outputPath}`);
}

module.exports = {
  parseTikTokCommentsHtml,
  parseMetricNumber
};
