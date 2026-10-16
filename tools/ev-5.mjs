import { launch, close, terminalCard } from './capture.mjs';
import { runApp } from './scenarios.mjs';
import { serve } from './serve.mjs';
const { REPO, EV, S } = process.env;
await launch();
await terminalCard(`${EV}/issue-5/terminal.png`, {
  title: 'Issue #5 · Vue 2 + Vue 3 from one package', maxLines: 70,
  commands: [
    { cmd: 'npm pkg get peerDependencies', cwd: REPO },
    { cmd: 'git diff test/4-vitest -- src/index.js', cwd: REPO, display: 'git diff test/4-vitest -- src/index.js' },
    { cmd: 'npx vitest run --reporter=verbose 2>&1 | grep -E "✓|✗|×|Test|Tests"', cwd: REPO, display: 'npm test -- --reporter=verbose' },
  ],
});
const srv = await serve(`${S}/dogfood/cdn`, 5710);
const notes = ['Same build/vue-html-to-paper.js file loaded via <script> on every Vue version; Vue itself from jsDelivr.'];
for (const [slug, name, file] of [['cdn-vue26', 'Vue 2.6.14 (CDN)', 'vue26'], ['cdn-vue27', 'Vue 2.7.16 (CDN)', 'vue27'], ['cdn-vue3', 'Vue 3.5.43 (CDN)', 'vue3']]) {
  await runApp({ url: `http://127.0.0.1:5710/${file}.html`, app: { slug, name, versions: name }, outDir: `${EV}/issue-5`, scenarios: ['default'], skip: ['readyState'], notes });
}
await close(); srv.close();
