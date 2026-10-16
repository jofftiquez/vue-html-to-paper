import { launch, close, terminalCard } from './capture.mjs';
import { runApp } from './scenarios.mjs';
import { serve } from './serve.mjs';
import { startServer, stop } from './procs.mjs';
import { writeFileSync, rmSync } from 'node:fs';
const { EV, S } = process.env;
const D = `${S}/dogfood`;
const out = `${EV}/issue-11`;
await launch();
writeFileSync(`${D}/vite-vue27/src/Misuse.vue`, `<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  methods: {
    bad () { this.$htmlToPaper(42) },
    wrongResolve (): Promise<string> { return this.$htmlToPaper('x') },
  },
})
</script>
<template><button @click="$htmlToPaper('x', { timeout: '1s' })">x</button></template>
`);
const lib = `${D}/nuxt2/node_modules/vue-html-to-paper/dist/index.mjs`;
await terminalCard(`${out}/terminal.png`, {
  title: 'Issue #11 · Vue 2 dogfood apps', maxLines: 90,
  commands: [
    { cmd: 'npm ls vue vite @vitejs/plugin-vue2 typescript vue-tsc vue-html-to-paper --depth=0', cwd: `${D}/vite-vue27`, display: '(vite-vue27) npm ls --depth=0' },
    { cmd: 'npx vue-tsc --noEmit 2>&1 | grep error; true', cwd: `${D}/vite-vue27`, display: '# negative check: src/Misuse.vue misuses this.$htmlToPaper / template $htmlToPaper\n(vite-vue27) npx vue-tsc --noEmit' },
    { cmd: "rm src/Misuse.vue && npx vue-tsc --noEmit && echo '✔ vue-tsc (Vue 2.7 target): 0 errors' && npx vite build 2>&1 | grep -E 'vite v|built in'", cwd: `${D}/vite-vue27`, display: '(vite-vue27) npm run build   # vue-tsc --noEmit && vite build' },
    { cmd: 'npm ls nuxt webpack vue vue-html-to-paper 2>/dev/null | grep -E "── (nuxt|vue-html-to-paper)@|webpack@4[^ ]* *$|── vue@" | sort -u | head -6', cwd: `${D}/nuxt2`, display: '(nuxt2) npm ls nuxt webpack vue vue-html-to-paper' },
    { cmd: 'npx nuxt build 2>&1 | grep -E "Nuxt|Compiled|Ready|ERROR|error" | head -8', cwd: `${D}/nuxt2`, display: '(nuxt2) npx nuxt build    # webpack 4.47' },
    { cmd: `cp ${lib} ${S}/_lib.mjs && sed -i 's/const merged = {};/const merged = {}; void merged?.x;/' ${lib} && npx nuxt build 2>&1 | grep -E "Module parse failed|Unexpected token|optional" | head -3; cp ${S}/_lib.mjs ${lib}`, cwd: `${D}/nuxt2`, display: '# why src/ is linted as ES2018 (#5): inject one `?.` into the installed bundle and rebuild\n# (this is upstream #86 "Module parse failed: Unexpected token")\n(nuxt2) npx nuxt build' },
    { cmd: 'npx nuxt build 2>&1 | grep -E "Compiled|Ready|ERROR" | head -4', cwd: `${D}/nuxt2`, display: '# restored the published bundle\n(nuxt2) npx nuxt build' },
  ],
});
rmSync(`${D}/vite-vue27/src/Misuse.vue`, { force: true });

const all = ['default', 'landscape', 'keepOpen', 'title', 'ref'];
const v27 = await startServer('npx', ['vite', 'preview', '--port', '5761', '--strictPort'], { cwd: `${D}/vite-vue27`, url: 'http://localhost:5761/' });
await runApp({ url: 'http://localhost:5761/', app: { slug: 'vite-vue27', name: 'Vite 7 + Vue 2.7 + TS' }, outDir: out, scenarios: [...all, 'composable'], notes: ['Production build (vue-tsc --noEmit && vite build) served by `vite preview`; @vitejs/plugin-vue2 2.3.4.'] });
stop(v27);

const ready = () => document.querySelector('#hydrated')?.textContent === 'hydrated';
const n2 = await startServer('npx', ['nuxt', 'start', '--port', '5762'], { cwd: `${D}/nuxt2`, url: 'http://localhost:5762/' });
const ssrHtml = await (await fetch('http://localhost:5762/')).text();
const ssrChecks = () => [
  { label: 'SSR: server HTML already contains the invoice (plugin installed during SSR without errors)', pass: ssrHtml.includes('Invoice #2026-1016') && ssrHtml.includes('first rendered on server (SSR)'), detail: `GET / → ${ssrHtml.length} bytes of server-rendered HTML` },
  { label: 'Page hydrated before the click (run waits for #hydrated and aborts otherwise)', pass: true, detail: 'waitForFunction(#hydrated === "hydrated")' },
];
await runApp({ url: 'http://localhost:5762/', app: { slug: 'nuxt2', name: 'Nuxt 2.18.1 (SSR, webpack 4)' }, outDir: out, scenarios: [...all, 'composable'], readyCheck: ready, extraChecks: ssrChecks, notes: ['`nuxt build` + `nuxt start`; universal plugin plugins/html-to-paper.js (Vue.use).'] });
stop(n2);

const cdn = await serve(`${D}/cdn`, 5763);
await runApp({ url: 'http://127.0.0.1:5763/vue26.html', app: { slug: 'cdn-vue26', name: 'CDN <script> + Vue 2.6.14', versions: 'Vue 2.6.14 from jsDelivr · build/vue-html-to-paper.js (UMD)' }, outDir: out, scenarios: all });
await runApp({ url: 'http://127.0.0.1:5763/vue27.html', app: { slug: 'cdn-vue27', name: 'CDN <script> + Vue 2.7.16', versions: 'Vue 2.7.16 from jsDelivr · build/vue-html-to-paper.js (UMD)' }, outDir: out, scenarios: [...all, 'composable'] });
cdn.close();
await close();
