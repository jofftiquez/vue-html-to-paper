// Regression check: repo index.html demo (UMD build) prints in Chromium.
// usage: node ev-demo.mjs <issue> "<title>"
import { launch, close, newPage, capturePrint, card, browserVersion } from './capture.mjs';
import { serve } from './serve.mjs';
const { REPO, EV } = process.env;
const [issue, title] = process.argv.slice(2);
await launch();
const srv = await serve(REPO, 5703);
const { page, logs } = await newPage('http://127.0.0.1:5703/index.html');
const opener = await page.screenshot();
const r = await capturePrint(page, 'text=PRINT PORTRAIT');
const ok = await card(`${EV}/issue-${issue}/demo-umd.png`, {
  title, subtitle: `Repo demo page index.html · build/vue-html-to-paper.js via <script> · Vue 3 CDN · ${browserVersion()}`,
  opener, popup: r.popupShot, paper: r.paper,
  checks: [
    { label: 'window.print() called once in the popup', pass: r.info.calls.print === 1, detail: `after ${r.info.printDelayMs} ms` },
    { label: 'Popup contains the #printMe markup', pass: r.info.bodyText.includes('MYCURE Pets') },
    { label: 'Global styles injected', pass: r.info.styles.length === 2, detail: r.info.styles.join(' , ') },
    { label: 'autoClose closed the popup', pass: r.info.calls.close === 1 },
    { label: 'No page errors', pass: !logs.some((l) => l.startsWith('[pageerror]')), detail: logs.filter((l) => !l.includes('development build')).join(' | ') },
  ],
});
console.log('demo', ok);
await close(); srv.close();
