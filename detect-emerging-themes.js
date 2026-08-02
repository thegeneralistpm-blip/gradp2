const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const historyDir = path.join(dataDir, 'history');
const outputPath = path.join(dataDir, 'emerging_themes.json');
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function readSnapshot(directory) {
  const file = path.join(directory, 'review_screening.json');
  if (!fs.existsSync(file)) return null;
  const records = JSON.parse(fs.readFileSync(file));
  const themes = {};
  records.forEach(record => (record.matched_themes || []).forEach(theme => themes[theme] = (themes[theme] || 0) + 1));
  return { snapshot: path.basename(directory), records: records.length, themes };
}

async function askModel(prompt) {
  if (process.env.GEMINI_API_KEY) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      })
    });
    if (response.ok) { const body = await response.json(); return { provider: 'gemini', text: body.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') }; }
  }
  if (process.env.GROQ_API_KEY) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: JSON.stringify({
        model: GROQ_MODEL, temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: prompt + '\nReturn one JSON object only.' }]
      })
    });
    if (response.ok) { const body = await response.json(); return { provider: 'groq', text: body.choices?.[0]?.message?.content }; }
  }
  throw new Error('No configured provider completed the emerging-theme analysis.');
}

(async () => {
  const snapshots = fs.existsSync(historyDir) ? fs.readdirSync(historyDir).map(name => readSnapshot(path.join(historyDir, name))).filter(Boolean).sort((a, b) => a.snapshot.localeCompare(b.snapshot)).slice(-8) : [];
  const current = readSnapshot(dataDir);
  if (!current) throw new Error('Current screened dataset is missing.');
  snapshots.push({ ...current, snapshot: 'current' });
  const evidence = JSON.stringify(snapshots);
  const prompt = `You are a product-research analyst for Blinkit. Compare these timestamped weekly theme counts: ${evidence}\nReturn JSON with keys: data_sufficiency (insufficient|adequate), emerging_themes (array of objects with theme, direction, evidence, risk_statement, recommended_monitor), new_problem_hypotheses (array), caveat. Only flag an emerging theme when supported by a change across at least two distinct weekly snapshots. Do not predict facts; phrase outputs as risks or hypotheses. If the history is too short or same-day, say insufficient and explain what should be collected next.`;
  const result = await askModel(prompt);
  const analysis = JSON.parse((result.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim());
  fs.writeFileSync(outputPath, JSON.stringify({ generated_at: new Date().toISOString(), provider: result.provider, snapshots_used: snapshots, analysis }, null, 2));
  console.log(`Saved emerging-theme analysis using ${result.provider}.`);
})().catch(error => { console.error(error.message); process.exit(1); });
