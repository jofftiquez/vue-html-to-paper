import { launch, close, newPage, capturePrint, card, browserVersion, save } from './capture.mjs';
import { serve } from './serve.mjs';
const { REPO, EV } = process.env;
const out = `${EV}/issue-13`;
await launch();
const srv = await serve(REPO, 5771);
const { page, logs, context } = await newPage('http://127.0.0.1:5771/index.html');
const buttons = [
  ['PRINT PORTRAIT', 'portrait', (i) => i.styles.length === 2, 1],
  ['PRINT LANDSCAPE', 'landscape', (i) => i.styles.at(-1) === './landscape.css', 1],
  ['PRINT NO STYLES', 'no-styles', (i) => i.styles.length === 0, 1],
  ['PRINT AUTO CLOSE OFF', 'autoclose-off', () => true, 0],
  ['PRINT CUSTOM WINDOW TITLE', 'title', (i) => i.title === 'This is a custom window title', 1],
  ['PRINT CALLBACK', 'callback', () => true, 1],
  ['PRINT TEMPLATE REF', 'template-ref', () => true, 1],
  ['PRINT WITH useHtmlToPaper()', 'composable', () => true, 1],
];
const results = [];
for (const [text, slug, extra, closes] of buttons) {
  const before = await page.locator('#log').innerText();
  const opener = await page.screenshot();
  const r = await capturePrint(page, `button:has-text("${text}")`);
  await page.waitForFunction((b) => document.querySelector('#log').innerText !== b, before, { timeout: 5000 }).catch(() => {});
  const last = (await page.locator('#log').innerText()).split('\n').at(-1);
  const orientation = r.paper[0].width > r.paper[0].height ? 'landscape' : 'portrait';
  const checks = [
    { label: 'window.print() called once', pass: r.info.calls.print === 1, detail: `after ${r.info.printDelayMs} ms` },
    { label: 'Popup loaded + standards mode when printing (#6)', pass: r.info.readyState === 'complete' && r.info.compatMode === 'CSS1Compat', detail: `${r.info.readyState} · ${r.info.compatMode}` },
    { label: 'Printed the #printMe content', pass: r.info.bodyText.includes('MYCURE Pets') },
    { label: 'Option-specific expectation', pass: extra(r.info), detail: `styles=${JSON.stringify(r.info.styles)} · title="${r.info.title}"` },
    { label: closes ? 'Popup closed after print' : 'Popup left open (autoClose: false)', pass: r.info.calls.close === closes },
    { label: 'Result logged on the page after the awaited print / callback', pass: last.startsWith('done'), detail: last },
    slug === 'landscape' && { label: 'Paper is landscape', pass: orientation === 'landscape', detail: `${r.paper[0].width}×${r.paper[0].height} pt` },
  ].filter(Boolean);
  const ok = await card(`${out}/demo-${slug}.png`, { title: `Demo page · ${text}`, subtitle: `index.html (GitHub Pages demo) · Vue 3.5.43 CDN · build/vue-html-to-paper.js · ${browserVersion()}`, opener, popup: r.popupShot, paper: r.paper, checks });
  results.push(ok);
  console.log(ok ? 'PASS' : 'FAIL', slug, ok ? '' : JSON.stringify(checks.filter((c) => !c.pass)));
}
save(`${out}/demo-full.png`, await page.screenshot({ fullPage: true }));
console.log('errors:', logs.filter((l) => /error/i.test(l)));
await context.close(); srv.close();
await close();
