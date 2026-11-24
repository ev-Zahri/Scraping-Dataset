/**
 * Parser Postingan Threads (HTML DOM / Bone)
 * Mengekstrak postingan dari struktur HTML Threads seperti docs/sample-bone/threads-timeline.html
 */

const fs = require('fs');

function parseMetric(str) {
  if (!str) return 0;
  const clean = str.replace(/&nbsp;/g, ' ').toLowerCase().trim();
  let mult = 1;
  if (clean.includes('rb') || clean.includes('k')) mult = 1000;
  else if (clean.includes('jt') || clean.includes('m')) mult = 1000000;
  const num = clean.replace(/[^\d.,]/g, '').replace(/,/g, '.');
  return Math.round((parseFloat(num) || 0) * mult);
}

function extractThreadsFromHtml(htmlContent) {
  const posts = [];
  const seenIds = new Set();

  // Cari semua anchor link post Threads: href="/@handle/post/postId"
  const postLinkRegex = /href="\/@([^\/"'\s]+)\/post\/([a-zA-Z0-9_\-]+)"/g;
  let match;
  const postIndices = [];

  while ((match = postLinkRegex.exec(htmlContent)) !== null) {
    const handle = match[1];
    const postId = match[2];
    if (!seenIds.has(postId)) {
      seenIds.add(postId);
      postIndices.push({
        handle: handle,
        postId: postId,
        index: match.index,
        postUrl: `https://www.threads.net/@${handle}/post/${postId}`
      });
    }
  }

  for (let i = 0; i < postIndices.length; i++) {
    const curr = postIndices[i];
    const nextIdx = (i + 1 < postIndices.length) ? postIndices[i + 1].index : htmlContent.length;

    // 1. Datetime: cari di sekitar link post
    const timeSnippet = htmlContent.substring(Math.max(0, curr.index - 500), curr.index + 500);
    let createdAt = '';
    const timeMatch = timeSnippet.match(/datetime="([^"]*)"/i);
    if (timeMatch) createdAt = timeMatch[1];

    // 2. Batas blok postingan: dari curr.index sampai nextIdx
    const postChunk = htmlContent.substring(curr.index, nextIdx);

    // Cari letak tombol aksi pertama (Suka / Like)
    let actionPos = postChunk.search(/title="(?:Suka|Like)"/i);
    if (actionPos === -1) actionPos = postChunk.indexOf('x4vbgl9');
    if (actionPos === -1) actionPos = postChunk.length;

    // Teks konten berada di antara curr.index hingga tombol aksi
    const contentChunk = postChunk.substring(0, actionPos);

    const paragraphs = [];
    const dirRegex = /dir="auto"[^>]*>([\s\S]*?)<\/span>/gi;
    let dMatch;
    while ((dMatch = dirRegex.exec(contentChunk)) !== null) {
      const clean = dMatch[1].replace(/<[^>]+>/g, '').trim();
      if (clean && clean.length > 1 && !clean.match(/^\d+\s*(?:jam|hari|m|h|d|detik|menit)$/i) && clean !== 'Lainnya') {
        if (!paragraphs.some(p => p === clean || p.includes(clean))) {
          paragraphs.push(clean);
        }
      }
    }
    const fullText = paragraphs.join('\n\n').trim();

    // 3. Metrics (Suka, Balas, Posting ulang)
    let likes = 0, replies = 0, retweets = 0;
    const actionsChunk = postChunk.substring(actionPos, Math.min(postChunk.length, actionPos + 3000));

    // Like
    const likeMatch = actionsChunk.match(/title="(?:Suka|Like)"[\s\S]*?<span[^>]*class="[^"]*(?:x1o0tod|x13vifvy)[^"]*"[^>]*>([^<]+)<\/span>/i);
    if (likeMatch) likes = parseMetric(likeMatch[1]);

    // Balas / Reply
    const replyMatch = actionsChunk.match(/title="(?:Balas|Reply)"[\s\S]*?<span[^>]*class="[^"]*(?:x1o0tod|x13vifvy)[^"]*"[^>]*>([^<]+)<\/span>/i);
    if (replyMatch) replies = parseMetric(replyMatch[1]);

    // Repost
    const repostMatch = actionsChunk.match(/title="(?:Posting ulang|Repost)"[\s\S]*?<span[^>]*class="[^"]*(?:x1o0tod|x13vifvy)[^"]*"[^>]*>([^<]+)<\/span>/i);
    if (repostMatch) retweets = parseMetric(repostMatch[1]);

    posts.push({
      id: curr.postId,
      full_text: fullText,
      created_at: createdAt,
      username: `@${curr.handle}`,
      user_name: curr.handle,
      likes: likes,
      retweets: retweets,
      replies: replies,
      views: 0,
      tweet_url: curr.postUrl
    });
  }

  return posts;
}

module.exports = {
  extractThreadsFromHtml
};

// CLI Test
if (require.main === module) {
  const targetFile = process.argv[2] || 'docs/sample-bone/threads-timeline.html';
  if (fs.existsSync(targetFile)) {
    console.log(`📄 Membaca sample Threads: ${targetFile}`);
    const html = fs.readFileSync(targetFile, 'utf8');
    const results = extractThreadsFromHtml(html);
    console.log(`✅ Berhasil mengekstrak ${results.length} postingan Threads:\n`);
    results.forEach((p, i) => {
      console.log(`[${i+1}] ID: ${p.id} | ${p.username} | Waktu: ${p.created_at}`);
      console.log(`    Likes: ${p.likes} | Replies: ${p.replies} | Reposts: ${p.retweets}`);
      console.log(`    URL: ${p.tweet_url}`);
      console.log(`    Teks: "${p.full_text.substring(0, 100)}..."\n`);
    });
  }
}
