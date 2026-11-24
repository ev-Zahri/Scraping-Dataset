/**
 * Shopee Product Reviews HTML Parser Engine
 * Obsidian Precision // Universal Multi-Platform Engine
 * 
 * Supports Shopee comment list DOM extraction:
 * - Review item container: .q2b7Oq (data-cmtid)
 * - Review text content: .YNedDV
 * - Author / Buyer handle: .InK5kS
 * - Star rating: count of .icon-rating-solid
 * - Date & Variant: .XYk98l
 * - Helpful / Likes count: .shopee-product-rating__like-count
 */

const fs = require('fs');
const path = require('path');

function parseShopeeReviewsHtml(htmlContent) {
  const reviews = [];
  const seenIds = new Set();

  const chunks = htmlContent.split(/(?=<div[^>]*class="q2b7Oq")/i);

  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Comment ID
    const idMatch = chunk.match(/data-cmtid="(\d+)"/i);
    const commentId = idMatch ? idMatch[1] : `shopee_rev_${i}`;

    // Author
    const userMatch = chunk.match(/class="InK5kS"[^>]*>([\s\S]*?)<\/(?:div|a)>/i);
    const username = userMatch ? userMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // Star Rating (1 - 5)
    const starsMatch = chunk.match(/class="shopee-svg-icon YBGCRA icon-rating-solid"/gi);
    const rating = starsMatch ? starsMatch.length : 5;

    // Review Date & Variation
    const metaMatch = chunk.match(/class="XYk98l"[^>]*>([\s\S]*?)<\/div>/i);
    let reviewDate = '';
    let variation = '';
    if (metaMatch) {
      const rawMeta = metaMatch[1].replace(/<[^>]+>/g, '').trim();
      const parts = rawMeta.split('|');
      reviewDate = parts[0] ? parts[0].trim() : '';
      variation = parts[1] ? parts[1].replace(/Variasi:/i, '').trim() : '';
    }

    // Full Review Text
    const textMatch = chunk.match(/class="YNedDV"[^>]*>([\s\S]*?)<\/div>/i);
    let reviewText = '';
    if (textMatch) {
      reviewText = textMatch[1]
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    }

    if (!reviewText && !username) continue;

    // Likes count
    const likeMatch = chunk.match(/class="shopee-product-rating__like-count"[^>]*>(\d+)<\/div>/i);
    const likes = likeMatch ? parseInt(likeMatch[1], 10) : 0;

    // Media
    const hasImages = chunk.includes('rating-media-list-image');
    const hasVideo = chunk.includes('rating-media-list__video-cover');

    if (seenIds.has(commentId)) continue;
    seenIds.add(commentId);

    reviews.push({
      id: commentId,
      full_text: reviewText,
      created_at: reviewDate,
      username: username,
      user_name: username,
      rating: rating,
      variation: variation,
      likes: likes,
      retweets: 0,
      replies: 0,
      views: likes,
      has_media: hasImages || hasVideo,
      tweet_url: ''
    });
  }

  return reviews;
}

// CLI Execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputPath = args[0] || path.join(__dirname, '../docs/sample-bone/shopee-review.html');
  const outputPath = args[1] || path.join(__dirname, '../extracted_json/shopee_reviews_extracted.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`[ERROR] File input tidak ditemukan: ${inputPath}`);
    process.exit(1);
  }

  console.log(`[INFO] Membaca file Shopee: ${inputPath}`);
  const html = fs.readFileSync(inputPath, 'utf8');
  const items = parseShopeeReviewsHtml(html);

  console.log(`[SUCCESS] Berhasil mengekstrak ${items.length} ulasan produk Shopee!`);
  
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(items, null, 2), 'utf8');
  console.log(`[INFO] Hasil disimpan ke: ${outputPath}`);
}

module.exports = {
  parseShopeeReviewsHtml
};
