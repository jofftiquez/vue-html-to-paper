// Universal plugin (runs during SSR too): install() only registers
// $htmlToPaper / provide('htmlToPaper'); nothing touches `window` until a
// print is triggered in the browser.
import VueHtmlToPaper from 'vue-html-to-paper'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueHtmlToPaper, { styles: ['/print.css'] })
})
