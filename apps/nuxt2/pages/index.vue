<script>
import Vue from 'vue'
import { useHtmlToPaper } from 'vue-html-to-paper'
import pkg from 'vue-html-to-paper/package.json'

export default {
  setup () {
    const print = useHtmlToPaper()
    return { printComposable: (el) => print(el) }
  },
  data: () => ({
    versions: `Nuxt 2.18.1 (webpack 4) · Vue ${Vue.version} · vue-html-to-paper ${pkg.version} from npm pack tarball · universal plugin`,
    renderedOn: process.server ? 'server (SSR)' : 'client',
    hydrated: false,
    rows: [['Consultation', 1, '₱ 850.00'], ['Vaccine (5-in-1)', 2, '₱ 1,500.00'], ['Grooming', 1, '₱ 500.00']],
    log: [],
  }),
  mounted () { this.hydrated = true },
  methods: {
    print () { this.$htmlToPaper('invoice', undefined, () => this.log.push('callback: default print done')) },
    printLandscape () { this.$htmlToPaper('invoice', { styles: ['/print.css', '/landscape.css'] }, () => this.log.push('callback: landscape done')) },
    printKeepOpen () { this.$htmlToPaper('invoice', { autoClose: false }, () => this.log.push('callback: autoClose false done')) },
    printTitle () { this.$htmlToPaper('invoice', { windowTitle: 'Invoice-2026-1016' }, () => this.log.push('callback: custom title done')) },
    async printRef () { this.log.push(`await: ref print done -> ${await this.$htmlToPaper(this.$refs.invoice)}`) },
    async onComposable () { this.log.push(`await: composable print done -> ${await this.printComposable('invoice')}`) },
  },
}
</script>

<template>
  <div>
    <header>Nuxt 2 dogfood</header>
    <main>
      <p id="versions">{{ versions }} · first rendered on {{ renderedOn }} · <span id="hydrated">{{ hydrated ? 'hydrated' : 'not hydrated' }}</span></p>
      <div id="invoice" ref="invoice" class="invoice">
        <h1>Invoice #2026-1016</h1>
        <p>Billed to: <b>Kidlat Pet Clinic</b> · Rendered with <b>Nuxt 2</b></p>
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
          <tbody><tr v-for="row in rows" :key="row[0]"><td v-for="cell in row" :key="cell">{{ cell }}</td></tr></tbody>
        </table>
        <p class="total">Total: ₱ 4,350.00</p>
      </div>
      <div class="controls">
        <button id="print" @click="print">Print</button>
        <button id="print-landscape" @click="printLandscape">Print landscape</button>
        <button id="print-keep-open" @click="printKeepOpen">Print (autoClose: false)</button>
        <button id="print-title" @click="printTitle">Print with custom title</button>
        <button id="print-ref" @click="printRef">Print template ref (await)</button>
        <button id="print-composable" @click="onComposable">Print via useHtmlToPaper()</button>
      </div>
      <pre id="log">{{ log.join('\n') }}</pre>
    </main>
  </div>
</template>

<style>
body { font: 15px/1.5 system-ui, sans-serif; margin: 0; background: #f5f6f8; }
header { background: #3b8070; color: #fff; padding: 10px 20px; font-weight: 600; }
main { padding: 14px 24px; } #versions { color: #555; font-size: 13px; margin: 0 0 10px; }
.controls button { margin: 0 8px 8px 0; padding: 7px 12px; }
.invoice { background: #fff; padding: 16px 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 14px; }
#log { background: #111; color: #9fef00; padding: 8px 12px; min-height: 2em; border-radius: 6px; }
</style>
