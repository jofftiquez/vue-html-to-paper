import { launch, close, terminalCard } from './capture.mjs';
const { REPO, EV } = process.env;
await launch();
const ok = await terminalCard(`${EV}/issue-3/terminal.png`, {
  title: 'Issue #3 · ESLint 10 flat config',
  commands: [
    { cmd: 'npx eslint --version && npm ls eslint @eslint/js globals @stylistic/eslint-plugin --depth=0', cwd: REPO },
    { cmd: 'ls eslint.config.mjs .eslintrc.js .eslintignore 2>&1; true', cwd: REPO, display: 'ls eslint.config.mjs .eslintrc.js .eslintignore' },
    { cmd: 'git show master:src/index.js | npx eslint --stdin --stdin-filename src/index.js; true', cwd: REPO, display: '# old src/index.js (master) under the new config\ngit show master:src/index.js | npx eslint --stdin --stdin-filename src/index.js' },
    { cmd: 'npx eslint . && echo "✔ no problems"', cwd: REPO, display: 'npx eslint .   # this branch' },
    { cmd: 'printf "export function bad(a){\\n  if(a){ return 1 }\\n}\\n" | npx eslint --stdin --stdin-filename src/x.js; true', cwd: REPO, display: '# style rules still enforced\nprintf "export function bad(a){ if(a){ return 1 } }" | npx eslint --stdin' },
  ],
});
console.log('terminal', ok);
await close();
