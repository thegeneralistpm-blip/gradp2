const fs = require('fs');
const path = require('path');
const https = require('https');

const APPLE_ID = '960335206';
const STOREFRONTS = ['in', 'gb', 'us', 'au', 'ca', 'nz', 'de', 'fr', 'it', 'es', 'ae', 'sa', 'sg', 'hk', 'my', 'br', 'ch', 'se', 'nl', 'mx', 'id', 'ph', 'th', 'jp', 'kr', 'tr', 'pl', 'dk', 'no', 'be', 'at'];
const PAGES_PER_STOREFRONT = 10;
const LIMIT = Number(process.argv[2] || 2000);
if (!Number.isInteger(LIMIT) || LIMIT < 1 || LIMIT > 10000) {
  throw new Error('Pass a whole-number target from 1 to 10,000. Example: node scrape-app-store-global.js 2500');
}
const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'BlinkitResearchDashboard/1.0' } }, response => {
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

(async () => {
  const all = new Map();
  const breakdown = {};
  for (const storefront of STOREFRONTS) {
    let storefrontCount = 0;
    for (let page = 1; page <= PAGES_PER_STOREFRONT; page += 1) {
      const url = `https://itunes.apple.com/${storefront}/rss/customerreviews/page=${page}/id=${APPLE_ID}/sortby=mostrecent/json`;
      const feed = await getJson(url);
      const entries = (feed.feed.entry || []).filter(item => item['im:rating']);
      if (!entries.length) break;
      entries.forEach(item => {
        const reviewId = item.id?.label || `${storefront}-${item.updated?.label}-${item.title?.label}`;
        if (!all.has(reviewId)) {
          all.set(reviewId, {
            source: `Apple App Store (${storefront.toUpperCase()})`,
            storefront: storefront.toUpperCase(),
            review_id: reviewId,
            date: item.updated?.label || '',
            rating: Number(item['im:rating']?.label || 0),
            title: item.title?.label || '',
            text: item.content?.label || '',
            url: item.link?.attributes?.href || url
          });
          storefrontCount += 1;
        }
      });
    }
    breakdown[storefront.toUpperCase()] = storefrontCount;
  }
  const records = [...all.values()].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, LIMIT);
  fs.writeFileSync(path.join(dataDir, `blinkit_app_store_global_last_${LIMIT}.json`), JSON.stringify(records, null, 2));
  fs.writeFileSync(path.join(dataDir, `app_store_global_${LIMIT}_collection_report.json`), JSON.stringify({
    collected_at: new Date().toISOString(),
    limit: LIMIT,
    storefronts: STOREFRONTS.map(item => item.toUpperCase()),
    unique_reviews_collected: records.length,
    breakdown
  }, null, 2));
  console.log(JSON.stringify({ unique_reviews_collected: records.length, breakdown }, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
