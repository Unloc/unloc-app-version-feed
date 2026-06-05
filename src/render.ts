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

function renderAtom(state: State): string {
  const updated = state.generatedAt;
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

function renderHtml(state: State): string {
  const items = state.history
    .map(
      (e) => `<article>
  <h2>${escapeHtml(entryTitle(e))}</h2>
  ${entryContentHtml(e)}
</article>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(FEED_TITLE)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="alternate" type="application/atom+xml" href="feed.xml" title="${escapeHtml(FEED_TITLE)}">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #222; line-height: 1.5; }
    header p { color: #555; }
    article { border-top: 1px solid #ddd; padding: 1.5rem 0; }
    article h2 { margin: 0 0 0.25rem; }
    section { margin: 1rem 0; }
    section h3 { font-size: 0.95rem; color: #555; margin: 0.75rem 0 0.25rem; }
    pre { background: #f5f5f5; padding: 0.75rem; border-radius: 4px; font-family: inherit; white-space: pre-wrap; word-break: break-word; margin: 0; }
    a { color: #0a58ca; }
    code { background: #f5f5f5; padding: 0 0.25rem; border-radius: 3px; }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(FEED_TITLE)}</h1>
    <p>New iOS and Android releases of the Unloc app, with release notes in English, Norwegian, Swedish, and Danish.</p>
    <p>Subscribe: <a href="feed.xml">Atom feed</a> · <a href="versions.json">JSON</a></p>
  </header>
  ${items}
</body>
</html>
`;
}

export async function render(state: State): Promise<void> {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(PUBLIC_DIR, 'feed.xml'), renderAtom(state), 'utf8'),
    fs.writeFile(
      path.join(PUBLIC_DIR, 'versions.json'),
      JSON.stringify(state, null, 2) + '\n',
      'utf8',
    ),
    fs.writeFile(path.join(PUBLIC_DIR, 'index.html'), renderHtml(state), 'utf8'),
  ]);
}
