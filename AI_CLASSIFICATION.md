# AI classification setup

The classifier processes only keyword-relevant reviews by default, in batches of ten. It matches each review by its stable `review_id`, skips any ID already present in `data/ai_classifications.json`, and processes only new/unclassified reviews. A run is capped at 200 reviews by default, saves every completed batch, and can be safely restarted without repeating completed reviews. If both providers are configured, it alternates Gemini and Groq batches, with the other provider as a rate-limit fallback.

## Configure keys privately

Set one or both environment variables in Railway/Render, or in your local terminal:

- `GEMINI_API_KEY`
- `GROQ_API_KEY`

Never put keys in `index.html`, `review-library.html`, Git, or chat messages.

## Run classification

```text
npm.cmd run classify:ai
```

For free-tier use, keep the default 200-review cap. To run a smaller validation pass, set `AI_MAX_REVIEWS_PER_RUN` (for example, `50`) in Railway/Render or in your local environment. Do not set `AI_SCOPE=all` unless you intentionally want to classify every raw review.

After completion, the dashboard dropdown and screening reasons use the AI result instead of the keyword rule wherever an AI classification exists.

## Emerging-risk detection

Run `npm.cmd run detect:emerging` after AI classification. It compares weekly snapshots and writes `data/emerging_themes.json`, containing AI-generated emerging-theme risks, evidence, and suggested monitoring actions. It labels the result as **insufficient** until at least two distinct weekly snapshots exist; it does not claim to predict future facts.
