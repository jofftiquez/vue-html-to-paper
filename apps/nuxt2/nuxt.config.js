export default {
  ssr: true,
  telemetry: false,
  head: { title: 'Nuxt 2 dogfood' },
  // Universal plugin: runs during SSR and in the browser.
  plugins: ['~/plugins/html-to-paper.js'],
}
