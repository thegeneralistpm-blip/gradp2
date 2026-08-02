const fs = require('fs');
const path = require('path');
const https = require('https');

const dataDir = path.join(__dirname, 'data');
const endpoints = [
  'https://www.reddit.com/r/blinkit/new.json?limit=100&raw_json=1',
  'https://www.reddit.com/r/FuckBlinkit/new.json?limit=100&raw_json=1',
  'https://www.reddit.com/search.json?q=blinkit&sort=new&limit=100&raw_json=1'
];

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'BlinkitResearchDashboard/1.0 (public research)' } }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => body += chunk);
      response.on('end', () => {
        if (response.statusCode !== 200) return reject(new Error(`Reddit returned HTTP ${response.statusCode}`));
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    }).on('error', reject);
  });
}

(async () => {
  const responses = await Promise.all(endpoints.map(getJson));
  const unique = new Map();
  responses.flatMap(response => response.data.children).forEach(({ data }) => {
    if (!data.id || unique.has(data.id) || data.stickied || data.removed_by_category) return;
    unique.set(data.id, {
      source: `Reddit r/${data.subreddit}`,
      review_id: `reddit_${data.id}`,
      date: new Date(data.created_utc * 1000).toISOString(),
      rating: 0,
      title: data.title || '',
      text: data.selftext || data.title || '',
      url: `https://www.reddit.com${data.permalink}`,
      post_score: data.score || 0,
      comment_count: data.num_comments || 0,
      content_type: 'Public Reddit discussion'
    });
  });
  const records = [...unique.values()];
  fs.writeFileSync(path.join(dataDir, 'blinkit_reddit_discussions.json'), JSON.stringify(records, null, 2));
  console.log(`Saved ${records.length} public Reddit discussions.`);
})().catch(error => { console.error(error); process.exit(1); });
