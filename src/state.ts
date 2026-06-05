import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Platform, State, VersionEntry } from './types.ts';

const STATE_PATH = path.join(process.cwd(), 'data', 'versions.json');

export async function loadState(): Promise<State> {
  try {
    const text = await fs.readFile(STATE_PATH, 'utf8');
    const parsed = JSON.parse(text) as Partial<State>;
    if (!Array.isArray(parsed.history)) {
      throw new Error('versions.json: history is not an array');
    }
    return { history: parsed.history };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { history: [] };
    }
    throw err;
  }
}

export async function saveState(state: State): Promise<void> {
  await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

function findExisting(
  state: State,
  platform: Platform,
  version: string,
): VersionEntry | undefined {
  return state.history.find((e) => e.platform === platform && e.version === version);
}

export function appendIfNew(state: State, entry: VersionEntry): boolean {
  if (findExisting(state, entry.platform, entry.version)) {
    return false;
  }
  state.history.unshift(entry);
  return true;
}
