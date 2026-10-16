// Evidence capture helpers for dogfooding vue-html-to-paper.
// - capturePrint(): clicks a print button, grabs the popup window the plugin
//   opens, records window.print()/window.close() calls, screenshots the popup,
//   renders it to a PDF (what goes to paper) and rasterises page 1.
// - card(): composes an evidence image (screens + assertion table).
// - terminalCard(): renders command output as a terminal screenshot.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const pdfjsDir = join(here, 'node_modules/pdfjs-dist/build');

let browser;
export async function launch () {
  browser = await chromium.launch();
  return browser;
}
export const close = () => browser?.close();
export const browserVersion = () => `Chromium ${browser.version()}`;

// Patched into every page, including popups opened by window.open().
// print() and close() are recorded instead of blocking / destroying the popup,
// so the popup can still be inspected after the plugin is done with it.
const INIT = () => {
  window.__calls = { print: 0, close: 0, printAt: 0 };
  window.print = () => { window.__calls.print++; window.__calls.printAt = Date.now(); window.__calls.readyStateAtPrint = document.readyState; window.__calls.compatModeAtPrint = document.compatMode; };
  window.close = () => { window.__calls.close++; };
};

export async function newPage (url, { viewport = { width: 1100, height: 760 } } = {}) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(INIT);
  const page = await context.newPage();
  const logs = [];
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  return { context, page, logs };
}

export async function capturePrint (page, selector, { waitClose = 400 } = {}) {
  const clickedAt = Date.now();
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 10000 }),
    page.click(selector),
  ]);
  await popup.waitForFunction(() => window.__calls?.print > 0, null, { timeout: 10000 });
  await popup.waitForTimeout(waitClose); // let autoClose's close() timer fire
  const info = await popup.evaluate(() => ({
    calls: window.__calls,
    title: document.title,
    readyState: window.__calls.readyStateAtPrint ?? document.readyState,
    compatMode: window.__calls.compatModeAtPrint ?? document.compatMode,
    styles: [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.getAttribute('href')),
    bodyText: document.body?.innerText.slice(0, 2000) ?? '',
    bodyHtml: document.body?.innerHTML ?? '',
  }));
  await popup.waitForLoadState('networkidle').catch(() => {});
  info.h1Color = await popup.evaluate(() => { const h = document.querySelector('h1'); return h ? getComputedStyle(h).color : null; });
  info.printDelayMs = info.calls.printAt - clickedAt;
  await popup.waitForLoadState('networkidle').catch(() => {});
  const popupShot = await popup.screenshot();
  const pdf = await popup.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true });
  const paper = await renderPdf(pdf);
  await popup.close();
  return { info, popupShot, pdf, paper };
}

// Rasterise every PDF page with pdf.js inside Chromium; returns PNG buffers
// plus page sizes (pt) so landscape vs portrait is visible.
export async function renderPdf (pdfBuffer) {
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await context.newPage();
  await page.route('http://pdfjs.local/**', (route) => {
    const file = route.request().url().replace('http://pdfjs.local/', '');
    route.fulfill({ body: readFileSync(join(pdfjsDir, file)), contentType: 'text/javascript' });
  });
  await page.route('http://pdfjs.local/', (r) => r.fulfill({ body: '<body style="margin:0;background:#888"></body>', contentType: 'text/html' }));
  await page.goto('http://pdfjs.local/');
  const pages = await page.evaluate(async (b64) => {
    const pdfjs = await import('http://pdfjs.local/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'http://pdfjs.local/pdf.worker.mjs';
    const data = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const doc = await pdfjs.getDocument({ data }).promise;
    const out = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const p = await doc.getPage(i);
      const [, , w, h] = p.view;
      const viewport = p.getViewport({ scale: 1.3 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await p.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
      out.push({ png: canvas.toDataURL('image/png'), width: Math.round(w), height: Math.round(h) });
    }
    return out;
  }, pdfBuffer.toString('base64'));
  await context.close();
  return pages;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dataUrl = (buf) => `data:image/png;base64,${buf.toString('base64')}`;

// checks: [{ label, pass, detail }]
export async function card (outFile, { title, subtitle, opener, popup, paper, checks = [], notes = [] }) {
  const ok = checks.every((c) => c.pass);
  const paperPage = paper?.[0];
  const html = `<!doctype html><meta charset=utf-8><style>
  body{margin:0;font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f5f7;color:#1f2328}
  .wrap{padding:22px 26px;width:1500px}
  h1{font-size:21px;margin:0 0 2px} .sub{color:#57606a;margin-bottom:14px}
  .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-weight:600;font-size:13px;margin-left:8px;vertical-align:2px;color:#fff;background:${ok ? '#1a7f37' : '#cf222e'}}
  .grid{display:grid;grid-template-columns:1fr 1fr 0.8fr;gap:14px;align-items:start}
  figure{margin:0;background:#fff;border:1px solid #d0d7de;border-radius:8px;overflow:hidden}
  figcaption{font-weight:600;padding:7px 10px;border-bottom:1px solid #d0d7de;background:#f6f8fa;font-size:13px}
  figure img{display:block;width:100%} .paper{background:#8c959f;padding:12px;text-align:center}
  .paper img{box-shadow:0 2px 8px rgba(0,0,0,.35);max-width:100%;max-height:520px;width:auto;margin:auto;background:#fff}
  table{border-collapse:collapse;width:100%;margin-top:14px;background:#fff;border:1px solid #d0d7de;border-radius:8px;overflow:hidden}
  td{padding:6px 10px;border-top:1px solid #eaeef2;vertical-align:top} td.s{width:28px;font-size:16px;text-align:center}
  td.d{color:#57606a;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;word-break:break-all}
  ul{margin:10px 0 0;color:#57606a;padding-left:18px}
  </style><div class=wrap>
  <h1>${esc(title)}<span class=badge>${ok ? 'PASS' : 'FAIL'}</span></h1>
  <div class=sub>${esc(subtitle)}</div>
  <div class=grid>
    ${opener ? `<figure><figcaption>1 · App (opener window)</figcaption><img src="${dataUrl(opener)}"></figure>` : ''}
    ${popup ? `<figure><figcaption>2 · Print window opened by $htmlToPaper</figcaption><img src="${dataUrl(popup)}"></figure>` : ''}
    ${paperPage ? `<figure><figcaption>3 · Paper output (PDF p.1 · ${paperPage.width}×${paperPage.height}pt · ${paperPage.width > paperPage.height ? 'landscape' : 'portrait'}${paper.length > 1 ? ` · ${paper.length} pages` : ''})</figcaption><div class=paper><img src="${paperPage.png}"></div></figure>` : ''}
  </div>
  <table>${checks.map((c) => `<tr><td class=s>${c.pass ? '✅' : '❌'}</td><td>${esc(c.label)}</td><td class=d>${esc(c.detail ?? '')}</td></tr>`).join('')}</table>
  ${notes.length ? `<ul>${notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
  </div>`;
  await shoot(outFile, html);
  return ok;
}

// commands: [{ cmd, cwd }] — runs each and renders output like a terminal.
export async function terminalCard (outFile, { title, commands, maxLines = 60 }) {
  const blocks = [];
  let allOk = true;
  for (const { cmd, cwd, display } of commands) {
    let out; let code = 0;
    try {
      out = execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } });
    } catch (e) { out = `${e.stdout ?? ''}${e.stderr ?? ''}`; code = e.status ?? 1; allOk = false; }
    let lines = out.replace(/\x1b\[[0-9;]*m/g, '').trimEnd().split('\n');
    if (lines.length > maxLines) lines = [...lines.slice(0, 8), `… (${lines.length - maxLines} lines omitted) …`, ...lines.slice(-(maxLines - 9))];
    blocks.push({ cmd: display ?? cmd, out: lines.join('\n'), code });
  }
  const html = `<!doctype html><meta charset=utf-8><style>
  body{margin:0;background:#0d1117}
  .t{width:1100px;padding:0 0 14px;font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#c9d1d9}
  .bar{background:#161b22;padding:9px 14px;color:#8b949e;font:600 13px system-ui,sans-serif;border-bottom:1px solid #30363d}
  .bar b{color:#e6edf3} pre{margin:0;padding:4px 16px;white-space:pre-wrap;word-break:break-word}
  .c{color:#7ee787;padding-top:12px} .c::before{content:'$ ';color:#8b949e} .x{color:#8b949e;padding-bottom:0}
  .bad{color:#ff7b72}</style><div class=t>
  <div class=bar><b>${esc(title)}</b> · ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC · node ${process.version}</div>
  ${blocks.map((b) => `<pre class=c>${esc(b.cmd)}</pre><pre>${esc(b.out)}</pre><pre class="x ${b.code ? 'bad' : ''}">exit ${b.code}</pre>`).join('')}
  </div>`;
  await shoot(outFile, html, '.t');
  return allOk;
}

async function shoot (outFile, html, selector = '.wrap') {
  mkdirSync(dirname(outFile), { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1560, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.locator(selector).screenshot({ path: outFile });
  await context.close();
}

export function save (file, buf) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, buf);
}
