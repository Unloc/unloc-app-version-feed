export type Platform = 'ios' | 'android';

export type Locale = 'en' | 'no' | 'sv' | 'da';

export interface LocaleNotes {
  locale: Locale;
  storeRegion: string;
  releaseNotes: string;
}

export interface VersionEntry {
  platform: Platform;
  appId: string;
  appName: string;
  version: string;
  releaseDate: string;
  detectedAt: string;
  storeUrl: string;
  localizations: LocaleNotes[];
}

export interface State {
  history: VersionEntry[];
}
