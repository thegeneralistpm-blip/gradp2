# Weekly review-collection scheduler

The scheduler is defined in `.github/workflows/weekly-review-collection.yml`.

Every Monday it:

1. Downloads the newest 500 public Blinkit reviews from each India storefront.
2. Screens them against the category-discovery study themes.
3. Rebuilds the review library.
4. Saves a timestamped dataset snapshot in `data/history/`.
5. Commits the new files to the repository.

## Activate it

1. Create a GitHub repository and push this project.
2. In the GitHub repository, open **Actions** and enable workflows if prompted.
3. Open **Weekly Blinkit review collection** and choose **Run workflow** to test it now.
4. The weekly schedule then runs automatically. GitHub Actions may delay scheduled workflows during heavy platform usage; use **Run workflow** whenever an immediate refresh is required.

## Deployment

Deploy the same GitHub repository to Railway or Render. Each new weekly dataset commit triggers a normal redeploy, so the online dashboard stays current.

## Scope and ethics

This automation uses the public App Store and Google Play review endpoints only. Add other platforms only through their official APIs or a permitted manual/export process.
