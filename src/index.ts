import { fetchAndroid } from './fetch-android.ts';
import { fetchIos } from './fetch-ios.ts';
import { render } from './render.ts';
import { appendIfNew, loadState, saveState } from './state.ts';
import type { Locale } from './types.ts';

const LOCALES: Locale[] = ['en', 'no', 'sv', 'da'];
const IOS_APP_ID = '1361534440';
const ANDROID_APP_ID = 'ai.unloc.unloc';

async function main(): Promise<void> {
  const state = await loadState();

  const [ios, android] = await Promise.all([
    fetchIos(IOS_APP_ID, LOCALES),
    fetchAndroid(ANDROID_APP_ID, LOCALES),
  ]);

  const iosNew = appendIfNew(state, ios);
  const androidNew = appendIfNew(state, android);

  state.generatedAt = new Date().toISOString();

  await saveState(state);
  await render(state);

  console.log(`iOS     ${ios.version.padEnd(10)} ${iosNew ? 'NEW' : 'unchanged'}`);
  console.log(`Android ${android.version.padEnd(10)} ${androidNew ? 'NEW' : 'unchanged'}`);
}

main().catch((err: unknown) => {
  console.error('Run failed:', err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
