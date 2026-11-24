/**
 * Parser Komentar YouTube (HTML DOM / Bone & JSON stream)
 * Mengekstrak komentar dari struktur HTML seperti docs/sample-bone/yt-comment-bone.html
 */

const fs = require('fs');
const path = require('path');

function extractYouTubeCommentsFromHtml(htmlContent) {
  const comments = [];
  
  // Pisahkan per blok ytd-comment-view-model
  const blocks = htmlContent.split(/<ytd-comment-view-model\b/i);
  
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    
    // 1. Ekstrak teks komentar (id="content-text")
    const textMatch = block.match(/id="content-text"[^>]*>([\s\S]*?)<\/yt-attributed-string>/i);
    if (!textMatch) continue;
    const rawText = textMatch[1].replace(/<[^>]+>/g, '').trim();
    if (!rawText) continue;

    // 2. Ekstrak author handle / name (id="author-text")
    let author = '';
    const authorMatch = block.match(/id="author-text"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    if (authorMatch) {
      author = authorMatch[2].replace(/<[^>]+>/g, '').trim();
    }

    // 3. Ekstrak waktu publikasi & comment ID (id="published-time-text")
    let publishedTime = '';
    let commentId = '';
    const timeMatch = block.match(/id="published-time-text"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    if (timeMatch) {
      const href = timeMatch[1];
      publishedTime = timeMatch[2].replace(/<[^>]+>/g, '').trim();
      const lcMatch = href.match(/(?:[?&]|&amp;)lc=([^&"]+)/);
      if (lcMatch) {
        commentId = lcMatch[1];
      }
    }

    // 4. Ekstrak likes (dari aria-label tombol suka)
    let likes = 0;
    const likeMatch = block.match(/id="like-button"[\s\S]*?aria-label="([^"]*)"/i);
    if (likeMatch) {
      const aria = likeMatch[1];
      const numMatch = aria.match(/bersama\s+([\d.,]+)\s+orang/i) || aria.match(/([\d.,]+)\s+suka/i);
      if (numMatch) {
        likes = parseInt(numMatch[1].replace(/\./g, ''), 10) || 0;
      }
    }

    // 5. Pinned status
    const isPinned = block.includes('id="pinned-comment-badge"') && block.includes('ytw-pinned-comment-badge-renderer');

    // 6. Avatar
    let avatarUrl = '';
    const avatarMatch = block.match(/id="author-thumbnail"[\s\S]*?src="([^"]*)"/i);
    if (avatarMatch) {
      avatarUrl = avatarMatch[1];
    }

    // Fallback comment ID jika tidak ada di URL
    if (!commentId) {
      commentId = `yt_${i}_${Date.now()}`;
    }

    comments.push({
      id: commentId,
      author: author,
      author_url: author ? `https://www.youtube.com/${author}` : '',
      text: rawText,
      likes: likes,
      published_time: publishedTime,
      is_pinned: isPinned,
      avatar_url: avatarUrl
    });
  }

  return comments;
}

// CLI test
if (require.main === module) {
  const targetFile = process.argv[2] || 'docs/sample-bone/yt-comment-bone.html';
  if (fs.existsSync(targetFile)) {
    console.log(`📄 Membaca sample YouTube: ${targetFile}`);
    const html = fs.readFileSync(targetFile, 'utf-8');
    const results = extractYouTubeCommentsFromHtml(html);
    console.log(`✅ Berhasil mengekstrak ${results.length} komentar YouTube:\n`);
    results.slice(0, 5).forEach((c, idx) => {
      console.log(`[${idx + 1}] Author: ${c.author} | ID: ${c.id} | Likes: ${c.likes}`);
      console.log(`    Waktu: ${c.published_time} | Pinned: ${c.is_pinned}`);
      console.log(`    Teks: "${c.text.substring(0, 100)}..."\n`);
    });
  }
}

module.exports = { extractYouTubeCommentsFromHtml };
