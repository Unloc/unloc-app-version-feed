import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Locale, Platform, State } from './types.ts';

const NOTES_DIR = path.join(process.cwd(), 'data', 'notes');
const LOCALES: Locale[] = ['en', 'no', 'sv', 'da'];

export type Overrides = Partial<Record<Platform, Record<string, Partial<Record<Locale, string>>>>>;

function parseSections(text: string): Partial<Record<Locale, string>> {
  const sections: Partial<Record<Locale, string>> = {};
  let current: Locale | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (current !== null) {
      const value = buf.join('\n').trim();
      if (value) sections[current] = value;
    }
    buf = [];
  };
  for (const line of text.split('\n')) {
    const m = line.match(/^#\s+([a-z]+)\s*$/);
    if (m && (LOCALES as string[]).includes(m[1])) {
      flush();
      current = m[1] as Locale;
    } else if (current !== null) {
      buf.push(line);
    }
  }
  flush();
  return sections;
}

export async function loadOverrides(): Promise<Overrides> {
  let files: string[];
  try {
    files = await fs.readdir(NOTES_DIR);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw err;
  }
  const result: Overrides = {};
  for (const file of files) {
    const m = file.match(/^(ios|android)-(.+)\.md$/);
    if (!m) continue;
    const platform = m[1] as Platform;
    const version = m[2];
    const text = await fs.readFile(path.join(NOTES_DIR, file), 'utf8');
    const sections = parseSections(text);
    if (Object.keys(sections).length === 0) continue;
    if (!result[platform]) result[platform] = {};
    result[platform]![version] = sections;
  }
  return result;
}

export function applyOverrides(state: State, overrides: Overrides): State {
  const history = state.history.map((e) => {
    const versionOverrides = overrides[e.platform]?.[e.version];
    if (!versionOverrides) return e;
    const localizations = e.localizations.map((l) => {
      const override = versionOverrides[l.locale];
      return override ? { ...l, releaseNotes: override } : l;
    });
    return { ...e, localizations };
  });
  return { history };
}
