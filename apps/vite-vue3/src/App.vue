<script>
// Options API usage: this.$htmlToPaper(...)
import { version } from 'vue';
import pkg from 'vue-html-to-paper/package.json';

export default {
  data: () => ({
    versions: `Vite + Vue ${version} (Options API, JS) · vue-html-to-paper ${pkg.version} from npm pack tarball`,
    rows: [['Consultation', 1, '₱ 850.00'], ['Vaccine (5-in-1)', 2, '₱ 1,500.00'], ['Grooming', 1, '₱ 500.00']],
    log: [],
  }),
  methods: {
    print () { this.$htmlToPaper('invoice', undefined, () => this.log.push('callback: default print done')); },
    printLandscape () { this.$htmlToPaper('invoice', { styles: ['/print.css', '/landscape.css'] }, () => this.log.push('callback: landscape done')); },
    printKeepOpen () { this.$htmlToPaper('invoice', { autoClose: false }, () => this.log.push('callback: autoClose false done')); },
    printTitle () { this.$htmlToPaper('invoice', { windowTitle: 'Invoice-2026-1016' }, () => this.log.push('callback: custom title done')); },
    async printRef () { const ok = await this.$htmlToPaper(this.$refs.invoice); this.log.push(`await: ref print done -> ${ok}`); },
  },
};
</script>

<template>
  <header>Vite + Vue 3 (JS) dogfood</header>
  <main>
    <p id="versions">{{ versions }}</p>
    <div id="invoice" ref="invoice" class="invoice">
      <h1>Invoice #2026-1016</h1>
      <p>Billed to: <b>Kidlat Pet Clinic</b> · Rendered with <b>Vite + Vue 3</b></p>
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
    </div>
    <pre id="log">{{ log.join('\n') }}</pre>
  </main>
</template>
