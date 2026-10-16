import { launch, close, terminalCard } from './capture.mjs';
import { runApp } from './scenarios.mjs';
import { serve } from './serve.mjs';
const { REPO, EV, S } = process.env;
await launch();
await terminalCard(`${EV}/issue-7/terminal.png`, {
  title: 'Issue #7 · Promise, element refs, Composition API', maxLines: 70,
  commands: [
    { cmd: 'npx vitest run test/api.test.js --reporter=verbose 2>&1 | grep -E "✓|×|Tests"', cwd: REPO, display: 'npx vitest run test/api.test.js --reporter=verbose' },
    { cmd: 'npx vitest run 2>&1 | grep -E "Test Files|Tests"', cwd: REPO, display: 'npm test' },
    { cmd: 'npm run build >/dev/null 2>&1 && npm run test:smoke | tail -1', cwd: REPO, display: 'npm run build && npm run test:smoke' },
    { cmd: `node -e "import('vue-html-to-paper').then(m => console.log('ESM exports:', Object.keys(m).join(', ')))"; node -e "console.log('CJS exports:', Object.keys(require('vue-html-to-paper')).join(', '))"`, cwd: REPO, display: 'node -e "import(\'vue-html-to-paper\')"  /  require(\'vue-html-to-paper\')' },
  ],
});
const srv = await serve(`${S}/dogfood/cdn`, 5730);
for (const [slug, name, file, scenarios] of [
  ['cdn-vue27', 'Vue 2.7.16 (CDN)', 'vue27', ['composable', 'ref']],
  ['cdn-vue3', 'Vue 3.5.43 (CDN)', 'vue3', ['composable', 'ref']],
  ['cdn-vue26', 'Vue 2.6.14 (CDN)', 'vue26', ['ref']],
]) await runApp({ url: `http://127.0.0.1:5730/${file}.html`, app: { slug, name, versions: name }, outDir: `${EV}/issue-7`, scenarios });
await close(); srv.close();
