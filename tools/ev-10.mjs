import { launch, close, terminalCard } from './capture.mjs';
import { runApp } from './scenarios.mjs';
import { startServer, stop } from './procs.mjs';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
const { EV, S } = process.env;
const N = `${S}/dogfood/nuxt4`;
const out = `${EV}/issue-10`;
await launch();
mkdirSync(`${N}/app/components`, { recursive: true });
writeFileSync(`${N}/app/components/Misuse.vue`, `<script setup lang="ts">
import { useHtmlToPaper } from 'vue-html-to-paper'
useHtmlToPaper()(42)
</script>
<template><button @click="$htmlToPaper('x', { timeout: '1s' })">x</button></template>
`);
await terminalCard(`${out}/terminal.png`, {
  title: 'Issue #10 · Nuxt 4 dogfood app', maxLines: 70,
  commands: [
    { cmd: 'npm ls nuxt vue vue-html-to-paper typescript vue-tsc --depth=0', cwd: N },
    { cmd: 'cat app/plugins/html-to-paper.ts', cwd: N },
    { cmd: 'npx nuxt typecheck 2>&1 | grep -E "error" ; true', cwd: N, display: '# negative check: app/components/Misuse.vue misuses the API\nnpx nuxt typecheck' },
    { cmd: "rm -rf app/components && npx nuxt typecheck && echo '✔ nuxt typecheck: 0 errors'", cwd: N, display: '# real app\nnpx nuxt typecheck' },
    { cmd: 'npx nuxt build 2>&1 | grep -E "Nuxt 4|Nitro preset|Client built|Server built|You can preview|Build complete|ERROR|WARN"', cwd: N, display: 'npx nuxt build' },
  ],
});
rmSync(`${N}/app/components`, { recursive: true, force: true });

const all = ['default', 'landscape', 'keepOpen', 'title', 'ref', 'composable'];
const ready = () => document.querySelector('#hydrated')?.textContent === 'hydrated';
const prod = await startServer('node', ['.output/server/index.mjs'], { cwd: N, url: 'http://localhost:5751/', env: { PORT: '5751', NUXT_PORT: '5751' } });
const ssrHtml = await (await fetch('http://localhost:5751/')).text();
const ssrChecks = () => [
  { label: 'SSR: server HTML already contains the invoice (plugin installed during SSR without errors)', pass: ssrHtml.includes('Invoice #2026-1016') && ssrHtml.includes('first rendered on server (SSR)'), detail: `GET / → ${ssrHtml.length} bytes of server-rendered HTML` },
  { label: 'Page hydrated before the click (run waits for #hydrated and aborts otherwise)', pass: true, detail: 'waitForFunction(#hydrated === "hydrated")' },
];
await runApp({ url: 'http://localhost:5751/', app: { slug: 'nuxt4-prod', name: 'Nuxt 4.5.2 (SSR production build)' }, outDir: out, scenarios: all, readyCheck: ready, extraChecks: ssrChecks, notes: ['`nuxt build` + `node .output/server/index.mjs`; universal plugin app/plugins/html-to-paper.ts.'] });
console.log('server log tail:', prod.output().slice(-300));
stop(prod);
const dev = await startServer('npx', ['nuxt', 'dev', '--port', '5752'], { cwd: N, url: 'http://localhost:5752/', timeout: 180000 });
await runApp({ url: 'http://localhost:5752/', app: { slug: 'nuxt4-dev', name: 'Nuxt 4.5.2 (nuxt dev)' }, outDir: out, scenarios: ['default', 'composable'], readyCheck: ready, notes: ['`nuxt dev` (Vite dev server + SSR).'] });
stop(dev);
await close();
