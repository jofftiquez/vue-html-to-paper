import { launch, close, save } from './capture.mjs';
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
await p.goto('https://github.com/jofftiquez/vue-html-to-paper/blob/docs/13-readme/README.md', { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
const sel = ['article.markdown-body', '.markdown-body', '[data-testid="readme"]'];
for (const s of sel) {
  const n = await p.locator(s).count();
  console.log(s, n);
  if (n) { save(`${process.env.EV}/issue-13/readme.png`, await p.locator(s).first().screenshot()); break; }
}
await close();
