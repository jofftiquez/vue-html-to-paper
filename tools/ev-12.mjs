import { launch, close, terminalCard, save } from './capture.mjs';
import { chromium } from 'playwright';
const { EV, REPO } = process.env;
const run = process.argv[2];
const out = `${EV}/issue-12`;
const b = await launch();
await terminalCard(`${out}/terminal.png`, {
  title: `Issue #12 · GitHub Actions run ${run}`, maxLines: 80,
  commands: [
    { cmd: `gh run view ${run} -R jofftiquez/vue-html-to-paper --verbose 2>&1 | head -60`, cwd: REPO, display: `gh run view ${run} --verbose` },
  ],
});
const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
await page.goto(`https://github.com/jofftiquez/vue-html-to-paper/actions/runs/${run}`, { waitUntil: 'networkidle' });
save(`${out}/run.png`, await page.screenshot({ fullPage: false }));
const jobLink = page.locator('a[href*="/job/"]').first();
const href = await jobLink.getAttribute('href');
await page.goto(new URL(href, 'https://github.com').toString(), { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
save(`${out}/job.png`, await page.screenshot({ fullPage: true }));
await close();
