/**
 * Konversi file JSON tweets ke format CSV
 * JavaScript Engine (Node.js & Browser compatible)
 * Input: File JSON dengan array of tweet objects
 * Output: File CSV dengan kolom-kolom tweet
 */

const fs = require('fs');
const path = require('path');

const CSV_COLUMNS = [
  'id',
  'full_text',
  'created_at',
  'username',
  'user_name',
  'likes',
  'retweets',
  'replies',
  'views',
  'tweet_url'
];

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function tweetsToCsvString(tweets, columns = CSV_COLUMNS) {
  if (!Array.isArray(tweets) || tweets.length === 0) return '';
  const header = columns.join(',');
  const rows = tweets.map(tweet => {
    return columns.map(col => escapeCsvField(tweet[col])).join(',');
  });
  return [header, ...rows].join('\n');
}

function jsonToCsv(inputFile, outputFile) {
  if (!outputFile) {
    const ext = path.extname(inputFile);
    outputFile = inputFile.replace(ext, '.csv');
  }

  console.log(`📄 Input file: ${inputFile}`);
  console.log(`💾 Output file: ${outputFile}`);

  try {
    const raw = fs.readFileSync(inputFile, 'utf-8');
    const tweets = JSON.parse(raw);

    if (!Array.isArray(tweets)) {
      console.error("❌ Error: File JSON harus berisi array of tweets");
      return false;
    }

    if (tweets.length === 0) {
      console.warn("⚠️  Warning: File JSON kosong, tidak ada tweets");
      return false;
    }

    const csvContent = tweetsToCsvString(tweets, CSV_COLUMNS);
    const outDir = path.dirname(outputFile);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(outputFile, csvContent, 'utf-8');
    console.log(`✅ Sukses mengonversi ${tweets.length} tweets ke CSV!`);
    console.log(`💾 File CSV disimpan di: ${outputFile}`);
    return true;
  } catch (err) {
    console.error(`❌ Gagal mengonversi ke CSV: ${err.message}`);
    return false;
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const inF = args[0] || "extracted_json/all_tweets_combined.json";
  const outF = args[1] || null;
  jsonToCsv(inF, outF);
}

module.exports = {
  CSV_COLUMNS,
  tweetsToCsvString,
  jsonToCsv
};
