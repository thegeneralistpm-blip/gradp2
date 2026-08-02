const fs = require('fs');
const path = require('path');
const gplay = require('google-play-scraper');

const APP_ID = 'com.grofers.customerapp';
const LIMIT = Number(process.argv[2] || 5000);
const THROTTLE_MS = 1000;
const dataDir = path.join(__dirname, 'data');
if (!Number.isInteger(LIMIT) || LIMIT < 1 || LIMIT > 20000) {
  throw new Error('Pass a whole-number target from 1 to 20,000. Example: node scrape-google-play-5000.js 20000');
}
const outFile = path.join(dataDir, `blinkit_google_play_last_${LIMIT}.json`);

function readExisting(fileName) {
  const filePath = path.join(dataDir, fileName);
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
}

function normalize(item) {
  return {
    source: 'Google Play (India)',
    review_id: item.id || '',
    date: item.date ? new Date(item.date).toISOString() : '',
    rating: item.score || 0,
    title: '',
    text: item.text || '',
    url: item.url || `https://play.google.com/store/apps/details?id=${APP_ID}`,
  };
}

async function main() {
  fs.mkdirSync(dataDir, { recursive: true });
  const response = await gplay.reviews({
    appId: APP_ID,
    sort: gplay.sort.NEWEST,
    num: LIMIT,
    lang: 'en',
    country: 'in',
    throttle: THROTTLE_MS,
  });
  const oldRecords = readExisting('blinkit_google_play_last_1000.json');
  const recordsById = new Map();
  [...oldRecords, ...response.data.map(normalize)].forEach((record) => {
    if (record.review_id) recordsById.set(record.review_id, record);
  });
  const records = [...recordsById.values()]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, LIMIT);
  fs.writeFileSync(outFile, JSON.stringify(records, null, 2));
  const report = {
    collected_at: new Date().toISOString(),
    source: 'Google Play (India)',
    requested_reviews: LIMIT,
    unique_reviews_saved: records.length,
    throttle_ms_between_requests: THROTTLE_MS,
    file: path.basename(outFile),
    note: 'Collection uses publicly accessible Google Play review responses. The final count may be lower if the source has fewer retrievable results or enforces limits.',
  };
  fs.writeFileSync(path.join(dataDir, `google_play_${LIMIT}_collection_report.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
