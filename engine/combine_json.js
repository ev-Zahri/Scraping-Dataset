/**
 * Script untuk menggabungkan multiple file JSON hasil scraping
 * dan menghapus duplikat berdasarkan tweet ID (JS Engine)
 */

const fs = require('fs');
const path = require('path');
const { extractTweetsFromResponse, removeDuplicates } = require('./extract_bulk');

const DEFAULT_INPUT_FOLDER = "raw_json";
const DEFAULT_OUTPUT_FILE = "extracted_json/all_tweets_combined.json";

function loadExistingTweets(outputFile) {
  if (fs.existsSync(outputFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
      if (Array.isArray(data)) {
        console.log(`📥 Memuat tweets yang sudah ada: ${data.length} tweets`);
        return data;
      }
    } catch (err) {
      console.warn(`⚠️  Gagal membaca file output yang ada: ${err.message}`);
    }
  }
  return [];
}

function combineFiles(inputFolder = DEFAULT_INPUT_FOLDER, outputFile = DEFAULT_OUTPUT_FILE) {
  console.log("=".repeat(60));
  console.log("🔗 PENGGABUNGAN & DEDUPLIKASI TWEETS (JS ENGINE)");
  console.log("=".repeat(60));

  if (!fs.existsSync(inputFolder)) {
    console.error(`❌ Folder input '${inputFolder}' tidak ditemukan.`);
    return false;
  }

  const files = fs.readdirSync(inputFolder)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(inputFolder, f));

  if (files.length === 0) {
    console.log(`⚠️ Tidak ada file .json di folder '${inputFolder}'.`);
    return false;
  }

  console.log(`📁 Ditemukan ${files.length} file untuk diproses:`);
  files.forEach(f => console.log(`  - ${f}`));

  let allTweets = loadExistingTweets(outputFile);
  let totalExtracted = 0;

  files.forEach(file => {
    try {
      const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
      let extractedCount = 0;

      if (Array.isArray(content)) {
        content.forEach(item => {
          if (item?.data) {
            const tweets = extractTweetsFromResponse(item);
            allTweets.push(...tweets);
            extractedCount += tweets.length;
          } else if (item?.id && item?.full_text) {
            allTweets.push(item);
            extractedCount++;
          }
        });
      } else if (content?.data) {
        const tweets = extractTweetsFromResponse(content);
        allTweets.push(...tweets);
        extractedCount += tweets.length;
      }

      totalExtracted += extractedCount;
      console.log(`  ✓ ${file}: diekstrak ${extractedCount} tweets`);
    } catch (err) {
      console.error(`  ✗ Gagal membaca ${file}: ${err.message}`);
    }
  });

  const uniqueTweets = removeDuplicates(allTweets);
  const outDir = path.dirname(outputFile);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(uniqueTweets, null, 2), 'utf-8');

  console.log("\n" + "=".repeat(60));
  console.log("✨ PENGGABUNGAN SELESAI!");
  console.log("=".repeat(60));
  console.log(`📊 Total tweets diekstrak: ${totalExtracted}`);
  console.log(`✨ Total tweets unik tersimpan: ${uniqueTweets.length}`);
  console.log(`💾 File output: ${outputFile}`);
  console.log("=".repeat(60));

  return true;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const inDir = args[0] || DEFAULT_INPUT_FOLDER;
  const outFile = args[1] || DEFAULT_OUTPUT_FILE;
  combineFiles(inDir, outFile);
}

module.exports = { combineFiles };
