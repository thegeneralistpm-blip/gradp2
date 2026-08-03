const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const sourcePath = path.join(dataDir, 'review_screening.json');
const outputPath = path.join(dataDir, 'ai_classifications.json');
const BATCH_SIZE = Number(process.env.AI_BATCH_SIZE || 10);
const MAX_REVIEWS_PER_RUN = Number(process.env.AI_MAX_REVIEWS_PER_RUN || 200);
const AI_SCOPE = process.env.AI_SCOPE || 'keyword_relevant';
const AI_SOURCE_FILTER = (process.env.AI_SOURCE_FILTER || '').split('|').map(value => value.trim()).filter(Boolean);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const raw = JSON.parse(fs.readFileSync(sourcePath));
const saved = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath)) : {};
const scopeReviews = AI_SCOPE === 'all' ? raw : raw.filter(review => review.study_relevant);
const candidateReviews = AI_SOURCE_FILTER.length ? scopeReviews.filter(review => AI_SOURCE_FILTER.includes(review.source)) : scopeReviews;
const unclassified = candidateReviews.filter(review => !saved[review.review_id]);
const skippedAlreadyClassified = candidateReviews.length - unclassified.length;
const pending = unclassified.slice(0, MAX_REVIEWS_PER_RUN);

const systemPrompt = `You are classifying public Blinkit customer feedback for a product-management research project. Return JSON only. For every review, return an object with exactly: review_id, relevant (boolean), themes (array chosen only from ["Discovery or navigation","Habit or repeat purchase","Category or product exploration","Trial confidence","Availability or substitution"]), segment (short label), categories (array), barrier (short label or null), sentiment (positive, neutral, or negative), reason (one short sentence). Mark relevant only if the review helps study why users do or do not discover, trust, try, or repeatedly buy new product categories. Do not treat delivery-person tracking, generic customer service, or generic coupons as discovery unless the review explicitly links them to product/category exploration.`;

function parseJson(text) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  const value = JSON.parse(cleaned);
  if (!Array.isArray(value)) throw new Error('Model did not return a JSON array.');
  return value;
}

async function askGemini(batch) {
  if (!process.env.GEMINI_API_KEY) throw new Error('Gemini key is not configured.');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: JSON.stringify(batch.map(r => ({ review_id: r.review_id, title: r.title, text: r.text, source: r.source, rating: r.rating }))) }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
  }) });
  if (!response.ok) { const error = new Error(`Gemini HTTP ${response.status}`); error.status = response.status; error.retryAfter = response.headers.get('retry-after'); throw error; }
  const body = await response.json();
  return parseJson(body.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '');
}

async function askGroq(batch) {
  if (!process.env.GROQ_API_KEY) throw new Error('Groq key is not configured.');
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: JSON.stringify({
    model: GROQ_MODEL, temperature: 0.1, response_format: { type: 'json_object' }, messages: [
      { role: 'system', content: systemPrompt + ' Wrap the array in an object with a "reviews" key.' },
      { role: 'user', content: JSON.stringify(batch.map(r => ({ review_id: r.review_id, title: r.title, text: r.text, source: r.source, rating: r.rating }))) }
    ]
  }) });
  if (!response.ok) { const error = new Error(`Groq HTTP ${response.status}`); error.status = response.status; error.retryAfter = response.headers.get('retry-after'); throw error; }
  const body = await response.json();
  const value = JSON.parse(body.choices?.[0]?.message?.content || '{}');
  if (!Array.isArray(value.reviews)) throw new Error('Groq did not return reviews array.');
  return value.reviews;
}

async function classify(batch, preferredProvider) {
  const configuredProviders = [
    ...(process.env.GEMINI_API_KEY ? ['gemini'] : []),
    ...(process.env.GROQ_API_KEY ? ['groq'] : []),
  ];
  const providers = preferredProvider
    ? [preferredProvider, ...configuredProviders.filter(provider => provider !== preferredProvider)]
    : configuredProviders;
  let lastError;
  for (const provider of providers) {
    if (provider === 'groq' && !process.env.GROQ_API_KEY) continue;
    try { return { provider, results: provider === 'gemini' ? await askGemini(batch) : await askGroq(batch) }; }
    catch (error) { lastError = error; if (error.status === 429) await sleep(Number(error.retryAfter || 10) * 1000); }
  }
  throw lastError || new Error('No AI provider key is configured.');
}

(async () => {
  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) throw new Error('Set GEMINI_API_KEY and/or GROQ_API_KEY privately before running this script.');
  if (!Number.isInteger(BATCH_SIZE) || BATCH_SIZE < 1 || BATCH_SIZE > 25) throw new Error('AI_BATCH_SIZE must be a whole number from 1 to 25.');
  if (!Number.isInteger(MAX_REVIEWS_PER_RUN) || MAX_REVIEWS_PER_RUN < 1) throw new Error('AI_MAX_REVIEWS_PER_RUN must be a positive whole number.');
  const providers = [
    ...(process.env.GEMINI_API_KEY ? ['gemini'] : []),
    ...(process.env.GROQ_API_KEY ? ['groq'] : []),
  ];
  console.log(`AI run scope: ${AI_SCOPE}; candidates: ${candidateReviews.length}; skipped already classified: ${skippedAlreadyClassified}; remaining: ${unclassified.length}; this run: ${pending.length}; batch size: ${BATCH_SIZE}.`);
  for (let index = 0; index < pending.length; index += BATCH_SIZE) {
    const batch = pending.slice(index, index + BATCH_SIZE);
    const preferredProvider = providers[Math.floor(index / BATCH_SIZE) % providers.length];
    const { provider, results } = await classify(batch, preferredProvider);
    results.forEach(result => { if (result.review_id) saved[result.review_id] = { ...result, provider, classified_at: new Date().toISOString() }; });
    fs.writeFileSync(outputPath, JSON.stringify(saved, null, 2));
    console.log(`Classified ${Math.min(index + BATCH_SIZE, pending.length)}/${pending.length} pending reviews via ${provider}.`);
    await sleep(provider === 'gemini' ? 3000 : 2200);
  }
})().catch(error => { console.error(error.message); process.exit(1); });
