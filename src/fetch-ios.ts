import type { Locale, LocaleNotes, VersionEntry } from './types.ts';

const LOCALE_TO_COUNTRY: Record<Locale, string> = {
  en: 'us',
  no: 'no',
  sv: 'se',
  da: 'dk',
};

interface ITunesResult {
  version: string;
  trackName: string;
  releaseNotes?: string;
  currentVersionReleaseDate: string;
  trackViewUrl: string;
  bundleId: string;
}

async function lookup(appId: string, country: string): Promise<ITunesResult> {
  const url = `https://itunes.apple.com/lookup?id=${appId}&country=${country}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'unloc-app-version-feed/0.1 (+https://unloc.ai)' },
  });
  if (!res.ok) {
    throw new Error(`iTunes lookup country=${country} returned HTTP ${res.status}`);
  }
  const data = (await res.json()) as { resultCount?: number; results?: unknown[] };
  const results = Array.isArray(data.results) ? data.results : [];
  if (results.length === 0) {
    throw new Error(`iTunes lookup country=${country}: no results for app id ${appId}`);
  }
  const r = results[0] as Partial<ITunesResult>;
  const missing = (
    ['version', 'trackName', 'currentVersionReleaseDate', 'trackViewUrl'] as const
  ).filter((k) => !r[k]);
  if (missing.length > 0) {
    throw new Error(
      `iTunes lookup country=${country}: response missing fields ${missing.join(', ')} ` +
        `(got: ${Object.keys(r).join(', ')})`,
    );
  }
  return r as ITunesResult;
}

export async function fetchIos(appId: string, locales: Locale[]): Promise<VersionEntry> {
  const results = await Promise.all(
    locales.map(async (locale) => ({
      locale,
      country: LOCALE_TO_COUNTRY[locale],
      data: await lookup(appId, LOCALE_TO_COUNTRY[locale]),
    })),
  );

  const primary = results[0].data;
  for (const { country, data } of results) {
    if (data.version !== primary.version) {
      console.warn(
        `iOS version mismatch across stores: country=${country} reports ${data.version}, ` +
          `primary reports ${primary.version} — using primary`,
      );
    }
  }

  const localizations: LocaleNotes[] = results.map(({ locale, country, data }) => ({
    locale,
    storeRegion: country.toUpperCase(),
    releaseNotes: data.releaseNotes ?? '',
  }));

  return {
    platform: 'ios',
    appId,
    appName: primary.trackName,
    version: primary.version,
    releaseDate: primary.currentVersionReleaseDate,
    detectedAt: new Date().toISOString(),
    storeUrl: primary.trackViewUrl,
    localizations,
  };
}
