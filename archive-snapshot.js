const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const archiveDir = path.join(dataDir, 'history', timestamp);
const files = [
  'blinkit_app_store_last_500.json',
  'blinkit_google_play_last_500.json',
  'blinkit_app_store_last_1000.json',
  'blinkit_google_play_last_1000.json',
  'blinkit_google_play_last_5000.json',
  'blinkit_google_play_last_20000.json',
  'blinkit_app_store_global_last_2000.json',
  'blinkit_app_store_global_last_2500.json',
  'app_store_global_collection_report.json',
  'app_store_global_2500_collection_report.json',
  'google_play_5000_collection_report.json',
  'google_play_20000_collection_report.json',
  'ai_classifications.json',
  'emerging_themes.json',
  'collection_report.json',
  'review_screening.json',
  'screening_report.json'
];

fs.mkdirSync(archiveDir, { recursive: true });
files.forEach(file => {
  const source = path.join(dataDir, file);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(archiveDir, file));
});
console.log(`Archived current collection to ${archiveDir}`);
