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
    filter_all: 'All',
  },
  no: {
    title: 'Unloc – nye appversjoner',
    lede: 'Nye versjoner av Unloc-appen for iOS og Android, med endringslogger – rett fra App Store og Play Store.',
    subscribe_atom: 'Abonner via Atom',
    view_store: 'Se i butikken →',
    footer_intro: 'Oppdateres automatisk.',
    footer_sources: 'Kilder:',
    picker_label: 'Språk',
    filter_all: 'Alle',
  },
  sv: {
    title: 'Unloc – nya appversioner',
    lede: 'Nya versioner av Unloc-appen för iOS och Android, med ändringsloggar – direkt från App Store och Play Store.',
    subscribe_atom: 'Prenumerera via Atom',
    view_store: 'Visa i butiken →',
    footer_intro: 'Uppdateras automatiskt.',
    footer_sources: 'Källor:',
    picker_label: 'Språk',
    filter_all: 'Alla',
  },
  da: {
    title: 'Unloc – nye appversioner',
    lede: 'Nye versioner af Unloc-appen til iOS og Android, med ændringsnoter – direkte fra App Store og Play Store.',
    subscribe_atom: 'Abonnér via Atom',
    view_store: 'Se i butikken →',
    footer_intro: 'Opdateres automatisk.',
    footer_sources: 'Kilder:',
    picker_label: 'Sprog',
    filter_all: 'Alle',
  },
};

const UNLOC_LOGO_SVG = `<svg viewBox="0 0 107 29" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M77.7534 8.97813C77.7534 5.923 77.7534 4.39541 78.3478 3.22853C78.8709 2.20213 79.7054 1.36762 80.7317 0.844548C81.8983 0.25 83.4255 0.25 86.4806 0.25H97.5231C100.578 0.25 102.105 0.25 103.272 0.844548C104.298 1.36762 105.133 2.20213 105.656 3.22853C106.25 4.39541 106.25 5.923 106.25 8.97813V20.0219C106.25 23.077 106.25 24.6046 105.656 25.7715C105.133 26.7979 104.298 27.6324 103.272 28.1555C102.105 28.75 100.578 28.75 97.5231 28.75H86.4806C83.4255 28.75 81.8983 28.75 80.7317 28.1555C79.7054 27.6324 78.8709 26.7979 78.3478 25.7715C77.7534 24.6046 77.7534 23.077 77.7534 20.0219V8.97813Z" fill="#C4EE4D"/>
  <path d="M93.437 18.6785C93.437 18.4816 93.5066 18.291 93.6335 18.1404L95.3344 16.1224C95.4128 16.0294 95.5105 15.9547 95.6208 15.9034C95.7311 15.8522 95.8512 15.8256 95.9728 15.8256H99.4909C99.7375 15.8256 99.9707 15.9342 100.129 16.1224L101.83 18.1404C101.957 18.291 102.027 18.4815 102.027 18.6785V23.5252C102.027 23.9863 101.653 24.3602 101.192 24.3602H94.2725C93.811 24.3602 93.4376 23.9864 93.4376 23.5253L93.437 18.6785ZM82.1162 16.7762C82.1162 15.9836 82.9923 15.5048 83.659 15.9331L85.7852 17.2987C85.9468 17.4025 86.1347 17.4576 86.3267 17.4576C86.5187 17.4576 86.7067 17.4025 86.8683 17.2987L88.9944 15.9331C89.6612 15.5048 90.5372 15.9836 90.5372 16.7762V23.4025C90.5372 23.9558 90.0886 24.4044 89.5354 24.4044H83.1181C82.5648 24.4044 82.1162 23.9558 82.1162 23.4025V16.7762ZM82.1162 7.49868C82.1162 7.34185 82.153 7.18721 82.2237 7.04721C82.2943 6.90721 82.3969 6.78577 82.5231 6.69266L85.7162 4.33479C85.8884 4.20757 86.097 4.13892 86.3111 4.13892C86.5253 4.13892 86.7338 4.20757 86.9061 4.33479L90.0992 6.69266C90.2254 6.78577 90.328 6.90721 90.3986 7.04721C90.4693 7.18721 90.5061 7.34185 90.5061 7.49868V12.0043C90.5061 12.5577 90.0575 13.0062 89.5042 13.0062H83.1181C82.5648 13.0062 82.1162 12.5577 82.1162 12.0043V7.49868ZM93.4927 8.55012C93.4927 6.19286 95.4034 4.28197 97.7605 4.28197C100.117 4.28197 102.028 6.19286 102.028 8.55012V12.3435C102.028 12.7051 101.735 12.9983 101.373 12.9983H94.1472C93.786 12.9983 93.4927 12.7051 93.4927 12.3435V8.55012Z" fill="black"/>
  <path d="M5.52012 24.8144C7.84301 24.8144 9.04644 23.737 9.74612 22.4043C9.66213 22.8296 9.60614 23.3116 9.60614 23.737V24.304H12.9925V10.4675H9.5782V18.6333C9.5782 20.7031 8.34676 22.0358 6.52764 22.0358C4.79251 22.0358 3.95291 20.618 3.95291 18.6617V10.4675H0.538574V19.2287C0.538574 22.8864 2.69354 24.8144 5.52012 24.8144ZM19.5715 24.304V16.2233C19.5715 14.2669 20.8029 12.7641 22.538 12.7641C24.2172 12.7641 25.1688 14.0684 25.1688 16.1099V24.304H28.6111V15.5995C28.6111 12.1971 26.792 10.0138 23.7135 10.0138C21.5026 10.0138 20.2152 11.0629 19.4595 12.4522C19.5435 11.9135 19.5715 11.4883 19.5715 11.0913V10.4675H16.1571V24.304H19.5715ZM35.4815 4.45654H29.4925V7.20685H32.0672V22.3863C32.0672 23.4454 32.9084 24.304 33.946 24.304H38.4334V21.5537H35.4815V4.45654ZM46.797 24.8144C50.9112 24.8144 53.8215 22.0358 53.8215 17.4425C53.8215 12.9059 50.9112 10.0138 46.797 10.0138C42.7111 10.0138 39.8005 12.9059 39.8005 17.4425C39.8005 22.0358 42.6833 24.8144 46.797 24.8144ZM46.797 22.0924C44.6703 22.0924 43.271 20.3912 43.271 17.4425C43.271 14.437 44.7259 12.7641 46.797 12.7641C48.8958 12.7641 50.3513 14.437 50.3513 17.4425C50.3513 20.3912 48.9242 22.0924 46.797 22.0924ZM62.4686 24.8144C66.5266 24.8144 68.6327 22.5461 69.1086 19.0303H65.7707C65.6027 20.6748 64.6231 22.0924 62.5526 22.0924C60.4532 22.0924 59.0261 20.1644 59.0261 17.4141C59.0261 14.4087 60.6491 12.7641 62.6361 12.7641C64.5674 12.7641 65.5192 14.1251 65.631 15.6845H68.9689C68.6327 12.4522 66.6106 10.0138 62.6361 10.0138C58.6621 10.0138 55.5558 12.7641 55.5558 17.3857C55.5558 21.979 58.1306 24.8144 62.4686 24.8144Z" fill="black"/>
</svg>`;

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

  return `  <article class="card" data-platform="${e.platform}">
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
      var lang, platforms;
      try { lang = localStorage.getItem('lang'); } catch (e) {}
      try { platforms = localStorage.getItem('platforms'); } catch (e) {}
      root.dataset.activeLang = lang || 'en';
      root.dataset.platforms = ['all', 'ios', 'android'].indexOf(platforms) > -1 ? platforms : 'all';
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
    header .brand { display: inline-block; line-height: 0; }
    header .brand svg { height: 26px; width: auto; display: block; }
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

    .filter {
      display: none;
      width: fit-content;
      margin: 1.75rem 0 0;
      border: 1px solid var(--ink);
      border-radius: 0.6rem;
      overflow: hidden;
      background: transparent;
    }
    html.has-js .filter { display: flex; }
    .filter button {
      border: 0;
      border-right: 1px solid var(--ink);
      background: transparent;
      padding: 0.45rem 1.1rem;
      font: inherit;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      color: var(--ink);
      transition: background 0.15s ease;
    }
    .filter button:last-child { border-right: 0; }
    .filter button:hover { background: rgba(17, 42, 10, 0.06); }
    .filter button[aria-pressed="true"] {
      background: var(--lime);
      color: var(--ink);
      font-weight: 600;
    }
    .filter button[aria-pressed="true"]:hover { background: var(--lime); }
    html.has-js[data-platforms="ios"] .card[data-platform="android"],
    html.has-js[data-platforms="android"] .card[data-platform="ios"] { display: none; }

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
      <a class="brand" href="https://www.unloc.app" aria-label="Unloc">${UNLOC_LOGO_SVG}</a>
      <h1 data-i18n="title">${escapeHtml(I18N.en.title)}</h1>
      <p class="lede" data-i18n="lede">${escapeHtml(I18N.en.lede)}</p>
      <div class="subscribe">
        <a href="feed.xml" data-i18n="subscribe_atom">${escapeHtml(I18N.en.subscribe_atom)}</a>
        <a class="secondary" href="versions.json">JSON</a>
      </div>
      <div class="filter" role="group" aria-label="Platform filter">
        <button type="button" data-platform-filter="all" data-i18n="filter_all" aria-pressed="true">${escapeHtml(I18N.en.filter_all)}</button>
        <button type="button" data-platform-filter="ios" aria-pressed="false">iOS</button>
        <button type="button" data-platform-filter="android" aria-pressed="false">Android</button>
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

      var filterButtons = document.querySelectorAll('[data-platform-filter]');
      function applyFilter(state) {
        if (['all', 'ios', 'android'].indexOf(state) === -1) state = 'all';
        root.dataset.platforms = state;
        try { localStorage.setItem('platforms', state); } catch (e) {}
        filterButtons.forEach(function (b) {
          var p = b.getAttribute('data-platform-filter');
          b.setAttribute('aria-pressed', p === state ? 'true' : 'false');
        });
      }
      filterButtons.forEach(function (b) {
        b.addEventListener('click', function () {
          applyFilter(b.getAttribute('data-platform-filter'));
        });
      });
      applyFilter(root.dataset.platforms || 'all');
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
