import { collect, defaultDeps } from './collect.ts';
import { renderRest, renderState } from './render.ts';

process.exitCode = 0; // never fail the session

try {
  const deps = defaultDeps();
  // STATE.md first, before any gh call, so it still shows if a later call stalls.
  let state = '(docs/STATE.md missing)';
  try {
    state = deps.readText('docs/STATE.md');
  } catch {
    /* keep placeholder */
  }
  console.log(renderState(state).join('\n'));
  console.log(renderRest(collect(deps)).join('\n'));
} catch (e) {
  console.log(`resume failed: ${(e as Error).message}`);
}
