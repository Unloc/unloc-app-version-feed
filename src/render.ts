import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Locale, State, VersionEntry } from './types.ts';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SITE_URL = process.env.SITE_URL ?? 'https://example.invalid';
const FEED_TITLE = 'Unloc app version feed';
const FEED_AUTHOR = 'Unloc';

const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  no: 'Norsk',
  sv: 'Svenska',
  da: 'Dansk',
};

const LOCALE_FLAGS: Record<Locale, string> = {
  en: '\u{1F1EC}\u{1F1E7}',
  no: '\u{1F1F3}\u{1F1F4}',
  sv: '\u{1F1F8}\u{1F1EA}',
  da: '\u{1F1E9}\u{1F1F0}',
};

const NO_NOTES: Record<Locale, string> = {
  en: '(no release notes provided)',
  no: '(ingen endringslogg tilgjengelig)',
  sv: '(ingen ändringslogg tillgänglig)',
  da: '(ingen ændringsnoter tilgængelige)',
};

const I18N: Record<Locale, Record<string, string>> = {
  en: {
    title: 'Unloc app version feed',
    lede: 'New iOS and Android releases of the Unloc app, with release notes — straight from the App Store and Play Store.',
    subscribe_atom: 'Subscribe via Atom',
    view_store: 'View in store →',
    footer_intro: 'Updated automatically every few hours.',
    footer_sources: 'Sources:',
    picker_label: 'Language',
  },
  no: {
    title: 'Unloc – nye appversjoner',
    lede: 'Nye versjoner av Unloc-appen for iOS og Android, med endringslogger – rett fra App Store og Play Store.',
    subscribe_atom: 'Abonner via Atom',
    view_store: 'Se i butikken →',
    footer_intro: 'Oppdateres automatisk.',
    footer_sources: 'Kilder:',
    picker_label: 'Språk',
  },
  sv: {
    title: 'Unloc – nya appversioner',
    lede: 'Nya versioner av Unloc-appen för iOS och Android, med ändringsloggar – direkt från App Store och Play Store.',
    subscribe_atom: 'Prenumerera via Atom',
    view_store: 'Visa i butiken →',
    footer_intro: 'Uppdateras automatiskt.',
    footer_sources: 'Källor:',
    picker_label: 'Språk',
  },
  da: {
    title: 'Unloc – nye appversioner',
    lede: 'Nye versioner af Unloc-appen til iOS og Android, med ændringsnoter – direkte fra App Store og Play Store.',
    subscribe_atom: 'Abonnér via Atom',
    view_store: 'Se i butikken →',
    footer_intro: 'Opdateres automatisk.',
    footer_sources: 'Kilder:',
    picker_label: 'Sprog',
  },
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function entryId(e: VersionEntry): string {
  const date = e.releaseDate.slice(0, 10);
  return `tag:unloc.ai,${date}:${e.platform}-${e.version}`;
}

function entryTitle(e: VersionEntry): string {
  const label = e.platform === 'ios' ? 'iOS' : 'Android';
  return `${e.appName} ${label} ${e.version}`;
}

function localizationsHtml(e: VersionEntry): string {
  return e.localizations
    .map((l) => {
      const name = LOCALE_NAMES[l.locale] ?? l.locale;
      const notes = l.releaseNotes.trim() || '(no release notes provided)';
      return `<section lang="${l.locale}"><h3>${escapeHtml(name)}</h3><pre>${escapeHtml(notes)}</pre></section>`;
    })
    .join('');
}

function entryContentHtml(e: VersionEntry): string {
  const date = escapeHtml(e.releaseDate.slice(0, 10));
  const link = escapeHtml(e.storeUrl);
  return `<p>Released ${date} · <a href="${link}">View in store</a></p>${localizationsHtml(e)}`;
}

function renderAtom(state: State, generatedAt: string): string {
  const updated = generatedAt;
  const entries = state.history
    .slice(0, 50)
    .map(
      (e) => `  <entry>
    <id>${entryId(e)}</id>
    <title>${escapeXml(entryTitle(e))}</title>
    <updated>${e.detectedAt}</updated>
    <published>${e.releaseDate}</published>
    <link href="${escapeXml(e.storeUrl)}"/>
    <category term="${e.platform}"/>
    <author><name>${FEED_AUTHOR}</name></author>
    <content type="html">${escapeXml(entryContentHtml(e))}</content>
  </entry>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(FEED_TITLE)}</title>
  <id>${SITE_URL}/feed.xml</id>
  <link href="${SITE_URL}/feed.xml" rel="self"/>
  <link href="${SITE_URL}/"/>
  <updated>${updated}</updated>
  <author><name>${FEED_AUTHOR}</name></author>
${entries}
</feed>
`;
}

function pageArticleHtml(e: VersionEntry): string {
  const platformLabel = e.platform === 'ios' ? 'iOS' : 'Android';
  const date = escapeHtml(e.releaseDate.slice(0, 10));
  const link = escapeHtml(e.storeUrl);
  const locales = e.localizations
    .map((l) => {
      const name = LOCALE_NAMES[l.locale] ?? l.locale;
      const notes = l.releaseNotes.trim() || NO_NOTES[l.locale];
      return `      <section class="locale" lang="${l.locale}">
        <h3>${escapeHtml(name)}</h3>
        <pre>${escapeHtml(notes)}</pre>
      </section>`;
    })
    .join('\n');

  return `  <article class="card">
    <div class="meta">
      <span class="pill pill-${e.platform}">${platformLabel}</span>
      <time datetime="${escapeHtml(e.releaseDate)}">${date}</time>
    </div>
    <h2>${escapeHtml(e.appName)} <span class="version">${escapeHtml(e.version)}</span></h2>
    <p class="store-link"><a href="${link}" data-i18n="view_store">${escapeHtml(I18N.en.view_store)}</a></p>
    <div class="locales">
${locales}
    </div>
  </article>`;
}

function renderHtml(state: State): string {
  const items = state.history.map(pageArticleHtml).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(FEED_TITLE)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="alternate" type="application/atom+xml" href="feed.xml" title="${escapeHtml(FEED_TITLE)}">
  <script>
    (function () {
      var root = document.documentElement;
      root.classList.add('has-js');
      var saved;
      try { saved = localStorage.getItem('lang'); } catch (e) {}
      root.dataset.activeLang = saved || 'en';
    })();
  </script>
  <style>
    :root {
      --bg: #f1ecd7;
      --ink: #112a0a;
      --ink-soft: #4a5a3e;
      --accent: #4d65ff;
      --lime: #c4ee4d;
      --card: #fffdf4;
      --border: rgba(17, 42, 10, 0.12);
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }
    .wrap { max-width: 760px; margin: 0 auto; padding: 4rem 1.5rem 6rem; }
    header { margin-bottom: 3rem; }
    header .brand { font-weight: 600; letter-spacing: -0.01em; font-size: 0.95rem; color: var(--ink-soft); }
    header h1 {
      font-size: clamp(2.2rem, 5vw, 3.2rem);
      line-height: 1.05;
      letter-spacing: -0.025em;
      margin: 0.5rem 0 1rem;
      font-weight: 700;
    }
    header .lede { font-size: 1.1rem; color: var(--ink-soft); max-width: 56ch; margin: 0 0 1.5rem; }
    .subscribe { display: inline-flex; gap: 0.5rem; flex-wrap: wrap; }
    .subscribe a {
      display: inline-block;
      padding: 0.55rem 1.1rem;
      border-radius: 999px;
      background: var(--ink);
      color: var(--bg);
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 500;
      transition: transform 0.1s ease, background 0.15s ease;
    }
    .subscribe a:hover { transform: translateY(-1px); background: var(--accent); }
    .subscribe a.secondary { background: transparent; color: var(--ink); border: 1px solid var(--border); }
    .subscribe a.secondary:hover { background: var(--lime); border-color: var(--ink); color: var(--ink); }

    .lang-picker {
      display: none;
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 10;
      align-items: center;
      gap: 0.5rem;
    }
    html.has-js .lang-picker { display: inline-flex; }
    @media (max-width: 480px) {
      .lang-picker label { display: none; }
    }
    .lang-picker label {
      font-size: 0.85rem;
      color: var(--ink-soft);
      font-weight: 500;
    }
    .lang-picker select {
      padding: 0.5rem 2.25rem 0.5rem 1rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      background-color: var(--card);
      color: var(--ink);
      font: inherit;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%23112a0a' d='M6 8 0 0h12z'/></svg>");
      background-repeat: no-repeat;
      background-position: right 0.9rem center;
      background-size: 0.65rem;
    }
    .lang-picker select:hover { border-color: var(--ink); }
    .lang-picker select:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1.5rem;
      padding: 2rem;
      margin: 1.25rem 0;
    }
    .meta { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; color: var(--ink-soft); }
    .meta time { font-variant-numeric: tabular-nums; }
    .pill {
      display: inline-block;
      padding: 0.2rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .pill-ios { background: var(--ink); color: var(--bg); }
    .pill-android { background: var(--lime); color: var(--ink); }
    .card h2 {
      margin: 0.75rem 0 0.25rem;
      font-size: 1.6rem;
      letter-spacing: -0.015em;
      font-weight: 600;
    }
    .card h2 .version { color: var(--accent); font-variant-numeric: tabular-nums; }
    .store-link { margin: 0.5rem 0 1.25rem; }
    .store-link a {
      color: var(--accent);
      text-decoration: none;
      font-weight: 500;
    }
    .store-link a:hover { text-decoration: underline; }
    .locales { display: grid; gap: 0.5rem; }
    .locale h3 {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ink-soft);
      margin: 0.75rem 0 0.35rem;
      font-weight: 600;
    }
    html.has-js .locale h3 { display: none; }
    html.has-js .locale { display: none; }
    html.has-js[data-active-lang="en"] .locale[lang="en"],
    html.has-js[data-active-lang="no"] .locale[lang="no"],
    html.has-js[data-active-lang="sv"] .locale[lang="sv"],
    html.has-js[data-active-lang="da"] .locale[lang="da"] { display: block; }
    .locale pre {
      background: var(--bg);
      padding: 0.85rem 1rem;
      border-radius: 0.75rem;
      font-family: inherit;
      font-size: 0.98rem;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
      color: var(--ink);
    }
    footer {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      font-size: 0.85rem;
      color: var(--ink-soft);
    }
    footer a { color: var(--ink); }

    @media (max-width: 480px) {
      .wrap { padding: 2.5rem 1rem 4rem; }
      .card { padding: 1.5rem; border-radius: 1.25rem; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="brand">Unloc</div>
      <h1 data-i18n="title">${escapeHtml(I18N.en.title)}</h1>
      <p class="lede" data-i18n="lede">${escapeHtml(I18N.en.lede)}</p>
      <div class="subscribe">
        <a href="feed.xml" data-i18n="subscribe_atom">${escapeHtml(I18N.en.subscribe_atom)}</a>
        <a class="secondary" href="versions.json">JSON</a>
      </div>
      <div class="lang-picker">
        <label for="lang-select" data-i18n="picker_label">${escapeHtml(I18N.en.picker_label)}</label>
        <select id="lang-select">
          <option value="en">${LOCALE_FLAGS.en}&nbsp; English</option>
          <option value="no">${LOCALE_FLAGS.no}&nbsp; Norsk</option>
          <option value="sv">${LOCALE_FLAGS.sv}&nbsp; Svenska</option>
          <option value="da">${LOCALE_FLAGS.da}&nbsp; Dansk</option>
        </select>
      </div>
    </header>
${items}
    <footer>
      <span data-i18n="footer_intro">${escapeHtml(I18N.en.footer_intro)}</span>
      <span data-i18n="footer_sources">${escapeHtml(I18N.en.footer_sources)}</span>
      <a href="https://apps.apple.com/no/app/unloc/id1361534440">App Store</a> ·
      <a href="https://play.google.com/store/apps/details?id=ai.unloc.unloc">Google Play</a>.
    </footer>
  </div>
  <script>
    (function () {
      var root = document.documentElement;
      var select = document.getElementById('lang-select');
      var I18N = ${JSON.stringify(I18N)};
      var TITLES = {};
      Object.keys(I18N).forEach(function (k) { TITLES[k] = I18N[k].title; });
      function apply(lang) {
        if (!I18N[lang]) lang = 'en';
        root.dataset.activeLang = lang;
        root.lang = lang;
        try { localStorage.setItem('lang', lang); } catch (e) {}
        document.title = TITLES[lang];
        var strings = I18N[lang];
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
          var key = el.getAttribute('data-i18n');
          if (strings[key]) el.textContent = strings[key];
        });
        if (select.value !== lang) select.value = lang;
      }
      select.addEventListener('change', function () { apply(select.value); });
      apply(root.dataset.activeLang || 'en');
    })();
  </script>
</body>
</html>
`;
}

export async function render(state: State, generatedAt: string): Promise<void> {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  const publicJson = { generatedAt, history: state.history };
  await Promise.all([
    fs.writeFile(path.join(PUBLIC_DIR, 'feed.xml'), renderAtom(state, generatedAt), 'utf8'),
    fs.writeFile(
      path.join(PUBLIC_DIR, 'versions.json'),
      JSON.stringify(publicJson, null, 2) + '\n',
      'utf8',
    ),
    fs.writeFile(path.join(PUBLIC_DIR, 'index.html'), renderHtml(state), 'utf8'),
  ]);
}
