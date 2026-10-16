import { launch, close, terminalCard } from './capture.mjs';
import { runApp } from './scenarios.mjs';
import { serve } from './serve.mjs';
const { REPO, EV, S } = process.env;
await launch();
await terminalCard(`${EV}/issue-6/terminal.png`, {
  title: 'Issue #6 · regression tests', maxLines: 70,
  commands: [
    { cmd: 'npx vitest run test/print.test.js --reporter=verbose 2>&1 | grep -E "✓|×|Tests"', cwd: REPO, display: 'npx vitest run test/print.test.js --reporter=verbose' },
    { cmd: 'git stash -q -- src && npx vitest run test/print.test.js 2>&1 | grep -E "×|Tests"; git stash pop -q', cwd: REPO, display: '# same tests against the previous src/index.js (feat/5-vue2-vue3)\ngit checkout feat/5-vue2-vue3 -- src && npx vitest run test/print.test.js' },
    { cmd: 'npx vitest run 2>&1 | grep -E "Test Files|Tests"', cwd: REPO, display: 'npm test' },
  ],
});
const before = await serve(`${S}/dogfood/cdn-before`, 5720);
const after = await serve(`${S}/dogfood/cdn`, 5721);
await runApp({ url: 'http://127.0.0.1:5720/vue3.html', app: { slug: 'before-master', name: 'BEFORE (master build)', versions: 'vue-html-to-paper@2.0.3 master · Vue 3.5.43' }, outDir: `${EV}/issue-6`, scenarios: ['default'],
  notes: ['Expected FAIL: master never calls document.close(), so the popup is still "loading" when print() runs — in desktop Chrome this is the endless spinner / no print dialog from upstream #126.', 'No doctype is written, so the popup renders in quirks mode (BackCompat).'] });
await runApp({ url: 'http://127.0.0.1:5721/vue3.html', app: { slug: 'after-fix', name: 'AFTER (this branch)', versions: 'fix/6-chrome-print · Vue 3.5.43' }, outDir: `${EV}/issue-6`, scenarios: ['default', 'keepOpen', 'title'] });
await close(); before.close(); after.close();
