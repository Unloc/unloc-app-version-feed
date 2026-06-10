# Unloc app version feed

Automated changelog of new Unloc iOS and Android releases, pulled from the App Store and Play Store, published as a browsable page, an Atom feed, and a JSON feed.

## Live

- Page: <https://app-version-feed.unloc.app/>
- Atom (everything): <https://app-version-feed.unloc.app/feed.xml>
- Atom by platform: [iOS](https://app-version-feed.unloc.app/feed.ios.xml) · [Android](https://app-version-feed.unloc.app/feed.android.xml)
- Atom by language: [English](https://app-version-feed.unloc.app/feed.en.xml) · [Norsk](https://app-version-feed.unloc.app/feed.no.xml) · [Svenska](https://app-version-feed.unloc.app/feed.sv.xml) · [Dansk](https://app-version-feed.unloc.app/feed.da.xml)
- JSON: <https://app-version-feed.unloc.app/versions.json>

Customers can point any RSS reader at one of the Atom feeds or poll `versions.json` from their own systems.

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
- `src/overrides.ts` — load and apply hand-written release-note overrides from `data/notes/`
- `src/render.ts` — seven Atom slices, JSON, and HTML output; UI strings, palette, and the inline Unloc logo live here
- `src/index.ts` — orchestrator
- `data/versions.json` — durable version history, committed back by the workflow when a new release is detected
- `data/notes/` — editorial overrides for release notes; see `data/notes/README.md` for the file format
- `.github/workflows/check.yml` — cron, deploy, and failure email

## Editing translations

The page chrome (header, lede, subscribe label, footer, "View in store", empty-notes fallback) is translated inside `src/render.ts` — see the `I18N` and `NO_NOTES` objects near the top. Release notes themselves come straight from the stores.

## Email notifications

The system itself only publishes HTML, Atom, and JSON. If customers want email delivery, three options ranked by effort:

**A — Customers self-serve.** Point a free RSS-to-email service like [Blogtrottr](https://blogtrottr.com/) or [Feedrabbit](https://feedrabbit.com/) at one of the published feeds. Zero work on our side; each customer manages their own subscription.

**B — Outsource to a managed RSS-to-email service** like [Buttondown](https://buttondown.com/) or Mailchimp's RSS-driven campaigns (~$9/mo). Point it at `feed.en.xml` (or run one campaign per locale slice) and they handle signup forms, deliverability, and unsubscribe.

**C — Build it in-house.** Add a step to the GitHub Actions workflow that diffs new entries and POSTs them to a transactional provider (e.g. Resend, Postmark, SES). Subscribers would live in a committed YAML file with per-locale and per-platform preferences. Adds DNS setup (SPF/DKIM/DMARC on `unloc.app`), an API key in Actions secrets, and ongoing maintenance — in exchange for full control over branding and routing.

**Recommended:** **B** for the B2B audience here. Managed list and deliverability outweigh the small monthly cost, and the existing per-locale slices map cleanly onto one campaign per language. Choose **C** only if per-subscriber routing logic shows up that an RSS-to-email pipeline can't express.
