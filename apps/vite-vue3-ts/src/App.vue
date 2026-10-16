<script setup lang="ts">
// Composition API usage: useHtmlToPaper() in <script setup>, plus the
// global $htmlToPaper straight from the template. Type-checked by vue-tsc.
import { ref, useTemplateRef, version } from 'vue'
import { useHtmlToPaper, type Options } from 'vue-html-to-paper'
import pkg from 'vue-html-to-paper/package.json'

const print = useHtmlToPaper()
const invoice = useTemplateRef<HTMLElement>('invoice')
const log = ref<string[]>([])
const versions = `Vite + Vue ${version} (<script setup lang="ts">) · vue-html-to-paper ${pkg.version} from npm pack tarball`
const rows: [string, number, string][] = [['Consultation', 1, '₱ 850.00'], ['Vaccine (5-in-1)', 2, '₱ 1,500.00'], ['Grooming', 1, '₱ 500.00']]
const landscape: Options = { styles: ['/print.css', '/landscape.css'] }

async function printComposable () {
  const ok: boolean = await print('invoice')
  log.value.push(`await: composable print done -> ${ok}`)
}
async function printRef () {
  if (!invoice.value) return
  const ok = await print(invoice.value)
  log.value.push(`await: ref print done -> ${ok}`)
}
const done = (what: string) => () => { log.value.push(`callback: ${what} done`) }
</script>

<template>
  <header>Vite + Vue 3 + TypeScript dogfood</header>
  <main>
    <p id="versions">{{ versions }}</p>
    <div id="invoice" ref="invoice" class="invoice">
      <h1>Invoice #2026-1016</h1>
      <p>Billed to: <b>Kidlat Pet Clinic</b> · Rendered with <b>Vite + Vue 3 + TS</b></p>
      <table>
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody><tr v-for="row in rows" :key="row[0]"><td v-for="cell in row" :key="cell">{{ cell }}</td></tr></tbody>
      </table>
      <p class="total">Total: ₱ 4,350.00</p>
    </div>
    <div class="controls">
      <button id="print" @click="$htmlToPaper('invoice', undefined, done('default print'))">Print ($htmlToPaper in template)</button>
      <button id="print-landscape" @click="print('invoice', landscape, done('landscape'))">Print landscape</button>
      <button id="print-keep-open" @click="print('invoice', { autoClose: false }, done('autoClose false'))">Print (autoClose: false)</button>
      <button id="print-title" @click="print('invoice', { windowTitle: 'Invoice-2026-1016' }, done('custom title'))">Print with custom title</button>
      <button id="print-ref" @click="printRef">Print template ref (await)</button>
      <button id="print-composable" @click="printComposable">Print via useHtmlToPaper()</button>
    </div>
    <pre id="log">{{ log.join('\n') }}</pre>
  </main>
</template>
