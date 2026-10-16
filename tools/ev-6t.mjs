import { launch, close, terminalCard } from './capture.mjs';
const { REPO, EV } = process.env;
await launch();
await terminalCard(`${EV}/issue-6/terminal.png`, {
  title: 'Issue #6 · regression tests', maxLines: 70,
  commands: [
    { cmd: 'npx vitest run test/print.test.js --reporter=verbose 2>&1 | grep -E "✓|×|Tests"', cwd: REPO, display: 'npx vitest run test/print.test.js --reporter=verbose' },
    { cmd: 'git show feat/5-vue2-vue3:src/index.js > src/index.js && npx vitest run test/print.test.js 2>&1 | grep -E "^ *×|Tests"; git checkout -q src/index.js', cwd: REPO, display: '# same tests against the previous src/index.js (feat/5-vue2-vue3)\ngit show feat/5-vue2-vue3:src/index.js > src/index.js && npx vitest run test/print.test.js' },
    { cmd: 'git status --short src; npx vitest run 2>&1 | grep -E "Test Files|Tests"', cwd: REPO, display: '# restored\nnpm test' },
  ],
});
await close();
