const fs = require('fs');
const path = require('path');
const https = require('https');
const gplay = require('google-play-scraper');

const APP_ID = 'com.grofers.customerapp';
const APPLE_ID = '960335206';
const MAX_REVIEWS = 1000;
const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - 30);
const outputDir = path.join(__dirname, 'data');
fs.mkdirSync(outputDir, { recursive: true });

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => body += chunk);
      response.on('end', () => {
        if (response.statusCode !== 200) return reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    }).on('error', reject);
  });
}

async function appleReviews() {
  const all = [];
  // Apple's public customer-review RSS feed exposes only 10 pages (500 reviews).
  for (let page = 1; page <= 10 && all.length < MAX_REVIEWS; page += 1) {
    const url = `https://itunes.apple.com/in/rss/customerreviews/page=${page}/id=${APPLE_ID}/sortby=mostrecent/json`;
    const feed = await getJson(url);
    const entries = (feed.feed.entry || []).filter(item => item['im:rating']);
    if (!entries.length) break;
    all.push(...entries.map(item => ({
      source: 'Apple App Store (India)',
      review_id: item.id?.label || '',
      date: item.updated?.label || '',
      rating: Number(item['im:rating']?.label || 0),
      title: item.title?.label || '',
      text: item.content?.label || '',
      url: item.link?.attributes?.href || url
    })));
  }
  return all.slice(0, MAX_REVIEWS);
}

async function playReviews() {
  const reviews = await gplay.reviews({
    appId: APP_ID,
    sort: gplay.sort.NEWEST,
    num: MAX_REVIEWS,
    lang: 'en',
    country: 'in'
  });
  return reviews.data.map(item => ({
    source: 'Google Play (India)',
    review_id: item.id || '',
    date: item.date ? new Date(item.date).toISOString() : '',
    rating: item.score || 0,
    title: '',
    text: item.text || '',
    url: `https://play.google.com/store/apps/details?id=${APP_ID}`
  }));
}

function writeJson(fileName, records) {
  fs.writeFileSync(path.join(outputDir, fileName), JSON.stringify(records, null, 2));
}

function previousRecords(fileName) {
  const filePath = path.join(outputDir, fileName);
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath)) : [];
}

function mergeByReviewId(existing, fresh) {
  const unique = new Map();
  [...existing, ...fresh].forEach(record => unique.set(record.review_id, record));
  return [...unique.values()]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, MAX_REVIEWS);
}

(async () => {
  const [freshApple, freshPlay] = await Promise.all([appleReviews(), playReviews()]);
  const apple = mergeByReviewId(
    previousRecords('blinkit_app_store_last_1000.json').length ? previousRecords('blinkit_app_store_last_1000.json') : previousRecords('blinkit_app_store_last_500.json'),
    freshApple
  );
  const play = mergeByReviewId(
    previousRecords('blinkit_google_play_last_1000.json').length ? previousRecords('blinkit_google_play_last_1000.json') : previousRecords('blinkit_google_play_last_500.json'),
    freshPlay
  );
  const recentApple = apple.filter(item => new Date(item.date) >= cutoff);
  const recentPlay = play.filter(item => new Date(item.date) >= cutoff);
  writeJson('blinkit_app_store_last_1000.json', apple);
  writeJson('blinkit_google_play_last_1000.json', play);
  writeJson('blinkit_app_store_last_30_days.json', recentApple);
  writeJson('blinkit_google_play_last_30_days.json', recentPlay);
  const report = {
    collected_at: new Date().toISOString(),
    cutoff_date: cutoff.toISOString(),
    cap_per_store: MAX_REVIEWS,
    app_store: { newest_reviews_collected: apple.length, reviews_in_last_30_days: recentApple.length },
    google_play: { newest_reviews_collected: play.length, reviews_in_last_30_days: recentPlay.length },
    note: 'Counts reflect reviews publicly retrievable from India storefronts at collection time; store APIs may paginate, regionalize, rate-limit, or omit content.'
  };
  fs.writeFileSync(path.join(outputDir, 'collection_report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
