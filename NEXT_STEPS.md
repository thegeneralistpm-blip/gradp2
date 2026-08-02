# Blinkit discovery engine — next steps

## Deferred but required before final deployment

- Push the project to GitHub.
- Add regenerated `GEMINI_API_KEY` and `GROQ_API_KEY` as GitHub Actions secrets.
- Enable and manually test:
  - `.github/workflows/daily-ai-review-screening.yml`
  - `.github/workflows/weekly-review-collection.yml`
- Confirm that AI classifications, dashboard rebuilds, weekly archives, and emerging-theme output are committed successfully.
- Deploy the dashboard to Railway or Render after the scheduled workflows pass.

The automation code is already present; activation is intentionally deferred.
