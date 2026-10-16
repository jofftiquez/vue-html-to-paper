<script setup lang="ts">
import { version } from 'vue'
import { useHtmlToPaper, type Options } from 'vue-html-to-paper'

const print = useHtmlToPaper()
const invoice = useTemplateRef<HTMLElement>('invoice')
const log = ref<string[]>([])
const renderedOn = useState('renderedOn', () => (import.meta.server ? 'server (SSR)' : 'client'))
const hydrated = ref(false)
onMounted(() => { hydrated.value = true })
const nuxtVersion = useNuxtApp().versions?.nuxt ?? '4'
const versions = `Nuxt ${nuxtVersion} · Vue ${version} · vue-html-to-paper from npm pack tarball · universal plugin`
const rows: [string, number, string][] = [['Consultation', 1, '₱ 850.00'], ['Vaccine (5-in-1)', 2, '₱ 1,500.00'], ['Grooming', 1, '₱ 500.00']]
const landscape: Options = { styles: ['/print.css', '/landscape.css'] }
const done = (what: string) => () => { log.value.push(`callback: ${what} done`) }

async function printComposable () {
  log.value.push(`await: composable print done -> ${await print('invoice')}`)
}
async function printRef () {
  if (invoice.value) log.value.push(`await: ref print done -> ${await print(invoice.value)}`)
}
</script>

<template>
  <div>
    <header>Nuxt 4 dogfood</header>
    <main>
      <p id="versions">{{ versions }} · first rendered on {{ renderedOn }} · <span id="hydrated">{{ hydrated ? 'hydrated' : 'not hydrated' }}</span></p>
      <div id="invoice" ref="invoice" class="invoice">
        <h1>Invoice #2026-1016</h1>
        <p>Billed to: <b>Kidlat Pet Clinic</b> · Rendered with <b>Nuxt 4</b></p>
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
  </div>
</template>

<style>
body { font: 15px/1.5 system-ui, sans-serif; margin: 0; background: #f5f6f8; }
header { background: #00a667; color: #fff; padding: 10px 20px; font-weight: 600; }
main { padding: 14px 24px; } #versions { color: #555; font-size: 13px; margin: 0 0 10px; }
.controls button { margin: 0 8px 8px 0; padding: 7px 12px; }
.invoice { background: #fff; padding: 16px 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 14px; }
#log { background: #111; color: #9fef00; padding: 8px 12px; min-height: 2em; border-radius: 6px; }
</style>
