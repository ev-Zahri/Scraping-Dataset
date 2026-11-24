/**
 * Ekstraksi Tweets dari Bulk JSON (Array of Responses)
 * JavaScript Engine (Node.js & Browser compatible)
 * Input: File JSON yang berisi array of response objects
 * Output: File JSON dengan tweets yang sudah diekstrak
 */

const fs = require('fs');
const path = require('path');

function extractTweetsFromResponse(data) {
  const tweets = [];
  try {
    const instructions = data?.data?.search_by_raw_query?.search_timeline?.timeline?.instructions || [];
    for (const instr of instructions) {
      if (instr?.type === 'TimelineAddEntries') {
        const entries = instr?.entries || [];
        for (const entry of entries) {
          const entryId = entry?.entryId || '';
          if (entryId.startsWith('tweet-')) {
            try {
              const content = entry?.content;
              const itemContent = content?.itemContent;
              const tweetResults = itemContent?.tweet_results?.result;
              if (!tweetResults) continue;

              const legacy = tweetResults.legacy || {};
              const userCore = tweetResults.core?.user_results?.result?.core || {};

              const username = userCore.screen_name || '';
              const userName = userCore.name || '';
              const tweetId = legacy.id_str || '';

              const tweetObj = {
                id: tweetId,
                full_text: legacy.full_text || '',
                created_at: legacy.created_at || '',
                username: username,
                user_name: userName,
                likes: legacy.favorite_count || 0,
                retweets: legacy.retweet_count || 0,
                replies: legacy.reply_count || 0,
                views: tweetResults.views?.count || '0',
                tweet_url: (username && tweetId) ? `https://twitter.com/${username}/status/${tweetId}` : ''
              };

              tweets.push(tweetObj);
            } catch (err) {
              continue;
            }
          }
        }
      }
    }
  } catch (err) {
    // Abaikan format yang tidak sesuai
  }
  return tweets;
}

function removeDuplicates(tweets) {
  const seenIds = new Set();
  const uniqueTweets = [];
  for (const tweet of tweets) {
    const tweetId = tweet.id;
    if (tweetId && !seenIds.has(tweetId)) {
      seenIds.add(tweetId);
      uniqueTweets.push(tweet);
    }
  }
  return uniqueTweets;
}

function processBulkFile(inputFile, outputFile) {
  console.log("=".repeat(60));
  console.log("🔧 EKSTRAKSI TWEETS DARI BULK JSON (JS ENGINE)");
  console.log("=".repeat(60));
  console.log(`📄 Input file: ${inputFile}`);
  console.log(`💾 Output file: ${outputFile}`);

  try {
    const rawData = fs.readFileSync(inputFile, 'utf-8');
    const responses = JSON.parse(rawData);

    if (!Array.isArray(responses)) {
      console.error("❌ Error: File harus berisi array of responses");
      return false;
    }

    console.log(`📊 Total responses: ${responses.length}`);
    console.log("\n🔄 Memproses responses...");

    const allTweets = [];
    let successfulResponses = 0;

    responses.forEach((resp, idx) => {
      try {
        const tweets = extractTweetsFromResponse(resp);
        if (tweets.length > 0) {
          allTweets.push(...tweets);
          successfulResponses++;
          console.log(`  ✓ Response #${idx + 1}: ${tweets.length} tweets`);
        } else {
          console.log(`  ✗ Response #${idx + 1}: Tidak ada tweets`);
        }
      } catch (err) {
        console.log(`  ✗ Response #${idx + 1}: Error - ${err.message}`);
      }
    });

    console.log("\n🔍 Menghapus duplikat...");
    const uniqueTweets = removeDuplicates(allTweets);

    const outDir = path.dirname(outputFile);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(outputFile, JSON.stringify(uniqueTweets, null, 2), 'utf-8');

    console.log("\n" + "=".repeat(60));
    console.log("✅ EKSTRAKSI SELESAI!");
    console.log("=".repeat(60));
    console.log(`📥 Total responses diproses: ${responses.length}`);
    console.log(`✓ Responses berhasil: ${successfulResponses}`);
    console.log(`📊 Total tweets ditemukan: ${allTweets.length}`);
    console.log(`✨ Tweets unik (setelah deduplikasi): ${uniqueTweets.length}`);
    console.log(`💾 Hasil disimpan di: ${outputFile}`);
    console.log("=".repeat(60));

    return true;
  } catch (err) {
    console.error(`❌ Error memproses file: ${err.message}`);
    return false;
  }
}

// CLI Execution
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("Penggunaan: node engine/extract_bulk.js <nama_file.json atau folder/>");
    process.exit(1);
  }

  const target = args[0];
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    const files = fs.readdirSync(target).filter(f => f.endsWith('.json') && !f.endsWith('_extracted.json'));
    console.log(`📁 Memproses ${files.length} file di folder ${target}...`);
    files.forEach(f => {
      const inFile = path.join(target, f);
      const outFile = path.join(target, f.replace('.json', '_extracted.json'));
      processBulkFile(inFile, outFile);
    });
  } else {
    const outFile = args[1] || target.replace('.json', '_extracted.json');
    processBulkFile(target, outFile);
  }
}

module.exports = {
  extractTweetsFromResponse,
  removeDuplicates,
  processBulkFile
};
