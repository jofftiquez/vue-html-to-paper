import { launch, close, terminalCard } from './capture.mjs';
const { REPO, EV } = process.env;
await launch();
await terminalCard(`${EV}/issue-8/terminal.png`, {
  title: 'Issue #8 · TypeScript declarations', maxLines: 90,
  commands: [
    { cmd: 'npx tsc --version', cwd: REPO },
    { cmd: 'git show master:types/index.d.ts > /tmp/claude-1000/-home-jofftiquez-workspace-vue-html-to-paper/4ebb590c-9a0e-40b9-8d4b-a1538b3f67f9/scratchpad/_old.d.ts; cp types/index.d.ts /tmp/claude-1000/-home-jofftiquez-workspace-vue-html-to-paper/4ebb590c-9a0e-40b9-8d4b-a1538b3f67f9/scratchpad/_t.d.ts; cp types/index.d.mts /tmp/claude-1000/-home-jofftiquez-workspace-vue-html-to-paper/4ebb590c-9a0e-40b9-8d4b-a1538b3f67f9/scratchpad/_t.d.mts; cp /tmp/claude-1000/-home-jofftiquez-workspace-vue-html-to-paper/4ebb590c-9a0e-40b9-8d4b-a1538b3f67f9/scratchpad/_old.d.ts types/index.d.ts; cp /tmp/claude-1000/-home-jofftiquez-workspace-vue-html-to-paper/4ebb590c-9a0e-40b9-8d4b-a1538b3f67f9/scratchpad/_old.d.ts types/index.d.mts; npx tsc -p test/types/vue3 2>&1 | grep -E "error TS" | cut -c1-170; npx tsc -p test/types/vue2 2>&1 | grep -E "error TS" | cut -c1-170; cp /tmp/claude-1000/-home-jofftiquez-workspace-vue-html-to-paper/4ebb590c-9a0e-40b9-8d4b-a1538b3f67f9/scratchpad/_t.d.ts types/index.d.ts; cp /tmp/claude-1000/-home-jofftiquez-workspace-vue-html-to-paper/4ebb590c-9a0e-40b9-8d4b-a1538b3f67f9/scratchpad/_t.d.mts types/index.d.mts', cwd: REPO, display: '# BEFORE: master types/index.d.ts against the same usage files\ngit show master:types/index.d.ts > types/index.d.ts && tsc -p test/types/vue3 && tsc -p test/types/vue2' },
    { cmd: 'npm run test:types 2>&1 && echo "✔ Vue 3.5 + Vue 2.7 type tests pass (strict, skipLibCheck: false)"', cwd: REPO, display: '# AFTER: this branch\nnpm run test:types' },
    { cmd: "npx attw --pack . --format table-flipped 2>&1 | grep -E 'node10|\"vue-html-to-paper\"|No problems'", cwd: REPO, display: 'npm run test:package   # @arethetypeswrong/cli' },
  ],
});
await close();
