const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const appStoreFile = fs.existsSync(path.join(dataDir, 'blinkit_app_store_global_last_2500.json'))
  ? 'blinkit_app_store_global_last_2500.json'
  : (fs.existsSync(path.join(dataDir, 'blinkit_app_store_global_last_2000.json'))
  ? 'blinkit_app_store_global_last_2000.json'
  : (fs.existsSync(path.join(dataDir, 'blinkit_app_store_last_1000.json')) ? 'blinkit_app_store_last_1000.json' : 'blinkit_app_store_last_500.json'));
const playStoreFile = fs.existsSync(path.join(dataDir, 'blinkit_google_play_last_20000.json'))
  ? 'blinkit_google_play_last_20000.json'
  : (fs.existsSync(path.join(dataDir, 'blinkit_google_play_last_5000.json'))
  ? 'blinkit_google_play_last_5000.json'
  : (fs.existsSync(path.join(dataDir, 'blinkit_google_play_last_1000.json')) ? 'blinkit_google_play_last_1000.json' : 'blinkit_google_play_last_500.json'));
const appStore = JSON.parse(fs.readFileSync(path.join(dataDir, appStoreFile)));
const playStore = JSON.parse(fs.readFileSync(path.join(dataDir, playStoreFile)));
const redditPath = path.join(dataDir, 'blinkit_reddit_discussions.json');
const reddit = fs.existsSync(redditPath) ? JSON.parse(fs.readFileSync(redditPath)) : [];
const externalPath = path.join(dataDir, 'blinkit_external_discussions.json');
const external = fs.existsSync(externalPath) ? JSON.parse(fs.readFileSync(externalPath)) : [];
const aiPath = path.join(dataDir, 'ai_classifications.json');
const aiClassifications = fs.existsSync(aiPath) ? JSON.parse(fs.readFileSync(aiPath)) : {};

const themes = [
  { name: 'Discovery or navigation', terms: ['discover', 'browse', 'category', 'categories', 'recommendation', 'recommendations', 'suggestion', 'suggestions', 'homepage', 'home page', 'navigation', 'interface', 'app layout', 'scrolling'] },
  { name: 'Habit or repeat purchase', terms: ['reorder', 're-order', 'repeat', 'regularly', 'every day', 'every week', 'daily', 'usual', 'routine', 'always order'] },
  { name: 'Category or product exploration', terms: ['grocery', 'groceries', 'snack', 'beverage', 'personal care', 'skincare', 'skin care', 'cosmetic', 'baby', 'diaper', 'pet', 'dog food', 'cat food', 'household', 'cleaning', 'electronics', 'medicine', 'product range', 'variety', 'brand'] },
  { name: 'Trial confidence', terms: ['quality', 'genuine', 'original', 'fake', 'expiry', 'expired', 'fresh', 'damaged', 'wrong item', 'wrong product', 'price', 'expensive', 'overpriced', 'rating', 'review'] },
  { name: 'Availability or substitution', terms: ['available', 'availability', 'out of stock', 'stock', 'missing', 'cancel', 'cancelled', 'substitut', 'not delivered'] }
];

function screen(review) {
  const text = `${review.title || ''} ${review.text || ''}`.toLowerCase();
  const hasTerm = term => new RegExp('(^|[^a-z])' + term.replace(/[.*+?^$()|[\]\\]/g, '\\$&') + '($|[^a-z])', 'i').test(text);
  const isDeliveryPersonSearch = /search\s+(him|her|driver|rider|delivery)/i.test(text);
  const matched = themes.filter(theme => {
    if (theme.name === 'Discovery or navigation') {
      return theme.terms.some(hasTerm) || (hasTerm('search') && !isDeliveryPersonSearch);
    }
    return theme.terms.some(hasTerm);
  }).map(theme => theme.name);
  return {
    ...review,
    study_relevant: matched.length > 0,
    matched_themes: matched,
    screening_reason: matched.length ? `Matched: ${matched.join('; ')}` : 'No mention of discovery, repeat behaviour, category/product exploration, trial confidence, or availability.'
  };
}

const records = [...appStore, ...playStore, ...reddit, ...external].map(review => {
  const base = screen(review);
  const ai = aiClassifications[base.review_id];
  return ai ? { ...base, study_relevant: Boolean(ai.relevant), matched_themes: ai.themes || [], screening_reason: `AI (${ai.provider}): ${ai.reason || 'Classified review.'}`, ai } : base;
});
const relevant = records.filter(item => item.study_relevant);
const excluded = records.filter(item => !item.study_relevant);
const bySource = Object.fromEntries([...new Set(records.map(item => item.source))].map(source => [source, {
  downloaded: records.filter(item => item.source === source).length,
  in_scope: relevant.filter(item => item.source === source).length,
  excluded: excluded.filter(item => item.source === source).length
}]));
const report = {
  screened_at: new Date().toISOString(),
  total_downloaded: records.length,
  in_scope_for_category_discovery_analysis: relevant.length,
  excluded_from_themed_analysis: excluded.length,
  exclusion_policy: 'Excluded only from the category-discovery analysis when no theme keyword was present. Raw reviews are retained and remain visible.',
  source_breakdown: bySource,
  theme_definitions: themes.map(({ name, terms }) => ({ name, terms }))
};
fs.writeFileSync(path.join(dataDir, 'review_screening.json'), JSON.stringify(records, null, 2));
fs.writeFileSync(path.join(dataDir, 'screening_report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
