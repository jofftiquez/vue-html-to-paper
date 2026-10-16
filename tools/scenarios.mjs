// Shared dogfood scenarios. Every throwaway app exposes the same contract:
//   #invoice            element to print
//   #print, #print-landscape, #print-keep-open, #print-title, (#print-composable)
//   #log                lines appended by the print callbacks / awaited promises
// Global options in every app: { styles: ['/print.css'] }.
import { newPage, capturePrint, card, browserVersion } from './capture.mjs';

export const SCENARIOS = {
  default: {
    button: '#print', title: 'Default print (global options)',
    expect: { close: 1, styles: ['/print.css'], log: 'default print done', orientation: 'portrait' },
  },
  landscape: {
    button: '#print-landscape', title: 'Local options: extra landscape stylesheet',
    expect: { close: 1, styles: ['/print.css', '/landscape.css'], log: 'landscape done', orientation: 'landscape' },
  },
  keepOpen: {
    button: '#print-keep-open', title: 'Local option autoClose: false',
    expect: { close: 0, styles: ['/print.css'], log: 'autoClose false done' },
  },
  title: {
    button: '#print-title', title: 'Local option windowTitle',
    expect: { close: 1, title: 'Invoice-2026-1016', log: 'custom title done' },
  },
  ref: {
    button: '#print-ref', title: 'Template ref (HTMLElement) + await the returned Promise',
    expect: { close: 1, styles: ['/print.css'], log: 'ref print done -> true' },
  },
  composable: {
    button: '#print-composable', title: 'Composition API: useHtmlToPaper() in setup()',
    expect: { close: 1, styles: ['/print.css'], log: 'composable print done -> true' },
  },
};

// Runs scenarios against an app URL and writes one evidence card each.
// Returns [{ id, ok, file }].
export async function runApp ({ url, app, outDir, scenarios, extraChecks = () => [], notes = [], readyCheck, skip = [] }) {
  const { page, logs, context } = await newPage(url);
  const results = [];
  if (readyCheck) await page.waitForFunction(readyCheck, null, { timeout: 15000 });
  const versionInfo = await page.evaluate(() => document.querySelector('#versions')?.innerText ?? '').catch(() => '');
  for (const id of scenarios) {
    const s = SCENARIOS[id];
    const logBefore = await page.locator('#log').innerText().catch(() => '');
    const opener = await page.screenshot();
    const r = await capturePrint(page, s.button);
    await page.waitForFunction((b) => (document.querySelector('#log')?.innerText ?? '') !== b, logBefore, { timeout: 5000 }).catch(() => {});
    const logAfter = await page.locator('#log').innerText().catch(() => '');
    const e = s.expect;
    const orientation = r.paper[0] && (r.paper[0].width > r.paper[0].height ? 'landscape' : 'portrait');
    const checks = [
      { label: 'Popup opened and window.print() called exactly once', pass: r.info.calls.print === 1, detail: `print() ${r.info.printDelayMs} ms after click` },
      !skip.includes('readyState') && { label: 'Popup document finished loading when print() ran (Chrome fix, #6)', pass: r.info.readyState === 'complete', detail: `document.readyState = "${r.info.readyState}"` },
      !skip.includes('compatMode') && { label: 'Print window renders in standards mode (<!DOCTYPE html>, #6)', pass: r.info.compatMode === 'CSS1Compat', detail: `document.compatMode = "${r.info.compatMode}"` },
      { label: 'Printed markup is the #invoice element', pass: r.info.bodyText.includes('Invoice #2026-1016') && r.info.bodyText.includes('Total') },
      e.styles && { label: 'Expected stylesheets injected', pass: JSON.stringify(r.info.styles) === JSON.stringify(e.styles), detail: JSON.stringify(r.info.styles) },
      { label: 'Injected print.css is applied in the popup (red h1)', pass: r.info.h1Color === 'rgb(180, 0, 30)', detail: `h1 color: ${r.info.h1Color}` },
      e.title && { label: 'Window title (PDF file name) set', pass: r.info.title === e.title, detail: `document.title = "${r.info.title}"` },
      { label: e.close ? 'autoClose: popup closed after printing' : 'autoClose: false — popup left open', pass: r.info.calls.close === e.close, detail: `window.close() calls: ${r.info.calls.close}` },
      e.orientation && { label: `Paper orientation is ${e.orientation}`, pass: orientation === e.orientation, detail: `${r.paper[0]?.width}×${r.paper[0]?.height} pt` },
      { label: 'Callback / awaited promise ran after print', pass: logAfter.includes(e.log), detail: logAfter.split('\n').filter(Boolean).slice(-1)[0] ?? '(empty)' },
      ...extraChecks(r, page),
      { label: 'No page errors in the app', pass: !logs.some((l) => l.startsWith('[pageerror]') || l.startsWith('[error]')), detail: logs.filter((l) => /error|warn/.test(l)).slice(0, 3).join(' | ') || 'console clean' },
    ].filter(Boolean);
    const file = `${outDir}/${app.slug}-${id}.png`;
    const ok = await card(file, {
      title: `${app.name} · ${s.title}`,
      subtitle: `${versionInfo || app.versions} · ${browserVersion()} · ${url}`,
      opener, popup: r.popupShot, paper: r.paper, checks, notes,
    });
    results.push({ id, ok, file, checks });
    console.log(`${ok ? 'PASS' : 'FAIL'} ${app.slug}-${id}`, ok ? '' : JSON.stringify(checks.filter((c) => !c.pass)));
  }
  await context.close();
  return results;
}
