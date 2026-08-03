const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
if (!inputPath) throw new Error('Pass the CSV path. Example: node import-codex-export.js C:\\path\\to\\codex_export.csv');
const dataDir = path.join(__dirname, 'data');
const outputPath = path.join(dataDir, 'blinkit_external_discussions.json');

function parseCsv(text) {
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]; const next = text[i + 1];
    if (ch === '"' && quoted && next === '"') { field += '"'; i += 1; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) { row.push(field); field = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(field); if (row.some(value => value !== '')) rows.push(row); row = []; field = '';
    } else field += ch;
  }
  row.push(field); if (row.some(value => value !== '')) rows.push(row);
  const [rawHeaders, ...values] = rows;
  const headers = rawHeaders.map(header => header.replace(/^\uFEFF/, '').trim());
  return values.map(rowData => Object.fromEntries(headers.map((header, index) => [header, rowData[index] || ''])));
}

function decodeHtml(text) {
  return String(text || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#32;/g, ' ');
}
function toDate(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 1000000000) return new Date(numeric * 1000).toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

fs.mkdirSync(dataDir, { recursive: true });
const incoming = parseCsv(fs.readFileSync(inputPath, 'utf8')).map(row => ({
  source: decodeHtml(row.source).trim() || 'External discussion',
  review_id: `${decodeHtml(row.source).trim() || 'External'}:${decodeHtml(row.record_id).trim()}`,
  date: toDate(row.date),
  rating: Number(row.rating) || 0,
  title: decodeHtml(row.title).trim(),
  text: decodeHtml(row.body).trim(),
  url: decodeHtml(row.url).trim()
})).filter(row => row.review_id && (row.title || row.text));
// Remove only the malformed first import made before BOM-safe header parsing.
const existing = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, 'utf8')).filter(row => row.source !== 'External discussion')
  : [];
const merged = new Map(existing.map(row => [row.review_id, row]));
incoming.forEach(row => merged.set(row.review_id, row));
const records = [...merged.values()].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
const report = { imported_at: new Date().toISOString(), input_file: path.basename(inputPath), rows_in_file: incoming.length, new_unique_records: records.length - existing.length, total_external_records: records.length, sources: Object.fromEntries([...new Set(records.map(r => r.source))].map(source => [source, records.filter(r => r.source === source).length])) };
fs.writeFileSync(path.join(dataDir, 'codex_export_import_report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
