import { launch, close, newPage, capturePrint, card, terminalCard, browserVersion } from './capture.mjs';
import { serve } from './serve.mjs';
const { REPO, EV } = process.env;
await launch();
const t = await terminalCard(`${EV}/issue-2/terminal.png`, {
  title: 'Issue #2 · Rollup 4 toolchain',
  commands: [
    { cmd: 'cat .nvmrc && node -v', cwd: REPO },
    { cmd: 'npm ls --depth=0', cwd: REPO },
    { cmd: 'npm run build 2>&1', cwd: REPO },
    { cmd: 'ls -l dist build', cwd: REPO },
    { cmd: 'npm run test:smoke', cwd: REPO },
    { cmd: 'npm pack --dry-run 2>&1 | grep -E "notice [0-9.]+k?B "', cwd: REPO, display: 'npm pack --dry-run  # tarball contents' },
  ],
});
const srv = await serve(REPO, 5702);
const { page, logs } = await newPage('http://127.0.0.1:5702/index.html');
const opener = await page.screenshot();
const r = await capturePrint(page, 'text=PRINT PORTRAIT');
const umdLoaded = await page.evaluate(() => typeof window.VueHtmlToPaper?.install === 'function');
const ok = await card(`${EV}/issue-2/demo-umd.png`, {
  title: 'Issue #2 · Demo page (index.html) using the Rollup 4 UMD build',
  subtitle: `build/vue-html-to-paper.js loaded with <script>, Vue 3 from CDN · ${browserVersion()}`,
  opener, popup: r.popupShot, paper: r.paper,
  checks: [
    { label: 'UMD global window.VueHtmlToPaper exposes install()', pass: umdLoaded },
    { label: 'Clicking PRINT PORTRAIT opens a popup and calls window.print() once', pass: r.info.calls.print === 1, detail: `print() after ${r.info.printDelayMs} ms` },
    { label: 'Popup contains the #printMe markup', pass: r.info.bodyText.includes('MYCURE Pets') },
    { label: 'Global styles injected into popup', pass: r.info.styles.length === 2, detail: r.info.styles.join(' , ') },
    { label: 'autoClose closes popup after print', pass: r.info.calls.close === 1 },
  ],
  notes: ['Behaviour unchanged by the toolchain upgrade; known pre-existing issues (#6/#7) are fixed in later issues.', `Opener console: ${logs.filter((l) => !l.includes('development build')).join(' | ')}`],
});
console.log({ terminal: t, demo: ok });
await close(); srv.close();
