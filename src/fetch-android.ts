import gplay from 'google-play-scraper';
import type { Locale, LocaleNotes, VersionEntry } from './types.ts';

const LOCALE_TO_REGION: Record<Locale, { lang: string; country: string }> = {
  en: { lang: 'en', country: 'us' },
  no: { lang: 'no', country: 'no' },
  sv: { lang: 'sv', country: 'se' },
  da: { lang: 'da', country: 'dk' },
};

interface PlayResult {
  title?: string;
  version?: string;
  recentChanges?: string;
  url?: string;
  updated?: number;
}

async function lookup(appId: string, locale: Locale): Promise<PlayResult> {
  const { lang, country } = LOCALE_TO_REGION[locale];
  let result: PlayResult;
  try {
    result = (await gplay.app({ appId, lang, country })) as PlayResult;
  } catch (err) {
    throw new Error(
      `Play Store scrape failed for locale=${locale} (lang=${lang}, country=${country}): ${
        (err as Error).message
      }`,
    );
  }

  const missing = (['title', 'version', 'url'] as const).filter((k) => !result[k]);
  if (missing.length > 0) {
    throw new Error(
      `Play Store scrape for locale=${locale}: response missing fields ${missing.join(', ')} ` +
        `(got: ${Object.keys(result).join(', ')}) — page structure may have changed`,
    );
  }
  if (result.version === 'Varies with device') {
    throw new Error(
      `Play Store scrape for locale=${locale}: version reported as "Varies with device" — ` +
        `cannot track changes. Check Play Console release configuration.`,
    );
  }

  return result;
}

export async function fetchAndroid(appId: string, locales: Locale[]): Promise<VersionEntry> {
  const results = await Promise.all(
    locales.map(async (locale) => ({ locale, data: await lookup(appId, locale) })),
  );

  const primary = results[0].data;
  for (const { locale, data } of results) {
    if (data.version !== primary.version) {
      console.warn(
        `Android version mismatch across locales: ${locale} reports ${data.version}, ` +
          `primary reports ${primary.version} — using primary`,
      );
    }
  }

  const localizations: LocaleNotes[] = results.map(({ locale, data }) => ({
    locale,
    storeRegion: LOCALE_TO_REGION[locale].country.toUpperCase(),
    releaseNotes: data.recentChanges ?? '',
  }));

  const releaseDate = primary.updated
    ? new Date(primary.updated).toISOString()
    : new Date().toISOString();

  return {
    platform: 'android',
    appId,
    appName: primary.title!,
    version: primary.version!,
    releaseDate,
    detectedAt: new Date().toISOString(),
    storeUrl: primary.url!,
    localizations,
  };
}
