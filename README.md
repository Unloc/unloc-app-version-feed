# Unloc app version feed

Automated changelog of new Unloc iOS and Android releases, pulled from the App Store and Play Store, published as a browsable page, an Atom feed, and a JSON feed.

## Live

- Page: <https://unloc.github.io/unloc-app-version-feed/>
- Atom feed: <https://unloc.github.io/unloc-app-version-feed/feed.xml>
- JSON: <https://unloc.github.io/unloc-app-version-feed/versions.json>

Customers can point any RSS reader at `feed.xml` or poll `versions.json` from their own systems.

## How it works

1. A GitHub Actions workflow runs every six hours (and on every push to `main`).
2. The fetcher hits the iTunes Lookup API for iOS and `google-play-scraper` for Android, in four locales each (`en`, `no`, `sv`, `da`), so localized release notes are preserved.
3. If a version not seen before shows up, it's appended to `data/versions.json` (the durable state, committed back by the workflow) and the rendered outputs in `public/` are regenerated.
4. The workflow uploads `public/` as a GitHub Pages artifact and the deploy job ships it.

If the Play Store scrape ever breaks (missing fields, "Varies with device", network error), the run fails non-zero and GitHub emails the repo owner. iTunes lag is tolerated silently.

## Local development

```sh
npm install
npm run check        # fetch + render into public/
npm run typecheck
open public/index.html
```

State is read from and written to `data/versions.json`; if it's missing, the run starts from an empty history.

## Layout

- `src/fetch-ios.ts` — iTunes Lookup, one request per country (`us`/`no`/`se`/`dk`)
- `src/fetch-android.ts` — Play Store via `google-play-scraper`, one call per locale
- `src/state.ts` — load/append/save `data/versions.json`
- `src/render.ts` — Atom, JSON, and HTML output; UI strings, palette, and the inline Unloc logo live here
- `src/index.ts` — orchestrator
- `.github/workflows/check.yml` — cron, deploy, and failure email

## Editing translations

The page chrome (header, lede, subscribe label, footer, "View in store", empty-notes fallback) is translated inside `src/render.ts` — see the `I18N` and `NO_NOTES` objects near the top. Release notes themselves come straight from the stores.
