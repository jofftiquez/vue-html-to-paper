import { launch, close, terminalCard } from './capture.mjs';
import { runApp } from './scenarios.mjs';
import { serve } from './serve.mjs';
import { startServer, stop } from './procs.mjs';
import { writeFileSync, rmSync } from 'node:fs';
const { EV, S } = process.env;
const D = `${S}/dogfood`;
const out = `${EV}/issue-9`;
await launch();

// Terminal: install from tarball, vue-tsc (positive + negative), production builds.
writeFileSync(`${D}/vite-vue3-ts/src/Misuse.vue`, `<script setup lang="ts">
import { useHtmlToPaper } from 'vue-html-to-paper'
const print = useHtmlToPaper()
print(42)                                  // not an id / element
print('invoice', { colour: 'red' })        // unknown option
const n: number = await print('invoice')   // resolves to boolean
</script>
<template><button @click="$htmlToPaper('x', { timeout: '1s' })">x</button></template>
`);
await terminalCard(`${out}/terminal.png`, {
  title: 'Issue #9 · Vue 3 dogfood apps (Vite 8)', maxLines: 80,
  commands: [
    { cmd: 'ls ../pkg && tar -tzf ../pkg/vue-html-to-paper-2.0.3.tgz', cwd: `${D}/vite-vue3`, display: 'npm pack  # tarball installed into both apps' },
    { cmd: 'npm ls vue vite @vitejs/plugin-vue vue-html-to-paper --depth=0', cwd: `${D}/vite-vue3`, display: '(vite-vue3) npm ls --depth=0' },
    { cmd: 'npm ls vue vite typescript vue-tsc vue-html-to-paper --depth=0', cwd: `${D}/vite-vue3-ts`, display: '(vite-vue3-ts) npm ls --depth=0' },
    { cmd: 'npx vue-tsc -b --force 2>&1 | sed "s#.*/src/#src/#"; true', cwd: `${D}/vite-vue3-ts`, display: '# negative check: src/Misuse.vue deliberately misuses the API\n(vite-vue3-ts) npx vue-tsc -b' },
    { cmd: `rm src/Misuse.vue && npx vue-tsc -b --force && echo '✔ vue-tsc: 0 errors (App.vue uses useHtmlToPaper, Options, $htmlToPaper in template)'`, cwd: `${D}/vite-vue3-ts`, display: '# real app\n(vite-vue3-ts) rm src/Misuse.vue && npx vue-tsc -b' },
    { cmd: 'npm run build 2>&1 | grep -E "vite v|built in|dist/"', cwd: `${D}/vite-vue3-ts`, display: '(vite-vue3-ts) npm run build' },
    { cmd: 'npm run build 2>&1 | grep -E "vite v|built in|dist/"', cwd: `${D}/vite-vue3`, display: '(vite-vue3) npm run build' },
  ],
});
rmSync(`${D}/vite-vue3-ts/src/Misuse.vue`, { force: true });

const all = ['default', 'landscape', 'keepOpen', 'title', 'ref'];
const js = await startServer('npx', ['vite', 'preview', '--port', '5741', '--strictPort'], { cwd: `${D}/vite-vue3`, url: 'http://localhost:5741/' });
await runApp({ url: 'http://localhost:5741/', app: { slug: 'vite-vue3-js', name: 'Vite 8 + Vue 3 (JS, Options API)' }, outDir: out, scenarios: all, notes: ['Production build served by `vite preview`; library installed from the npm pack tarball.'] });
stop(js);
const ts = await startServer('npx', ['vite', 'preview', '--port', '5742', '--strictPort'], { cwd: `${D}/vite-vue3-ts`, url: 'http://localhost:5742/' });
await runApp({ url: 'http://localhost:5742/', app: { slug: 'vite-vue3-ts', name: 'Vite 8 + Vue 3 + TS (<script setup>)' }, outDir: out, scenarios: [...all, 'composable'], notes: ['Production build (vue-tsc -b && vite build) served by `vite preview`.'] });
stop(ts);
const dev = await startServer('npx', ['vite', '--port', '5743', '--strictPort'], { cwd: `${D}/vite-vue3-ts`, url: 'http://localhost:5743/' });
await runApp({ url: 'http://localhost:5743/', app: { slug: 'vite-vue3-ts-dev', name: 'Vite 8 dev server + Vue 3 + TS' }, outDir: out, scenarios: ['composable'], notes: ['Vite dev server (unbundled ESM, dependency pre-bundling of vue-html-to-paper).'] });
stop(dev);

const cdn = await serve(`${D}/cdn`, 5744);
await runApp({ url: 'http://127.0.0.1:5744/vue3.html', app: { slug: 'cdn-vue3', name: 'CDN <script> + Vue 3.5.43', versions: 'Vue 3.5.43 from jsDelivr · build/vue-html-to-paper.js (UMD)' }, outDir: out, scenarios: [...all, 'composable'] });
cdn.close();
await close();
