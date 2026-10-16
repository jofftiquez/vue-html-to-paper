import { createApp } from 'vue'
import VueHtmlToPaper from 'vue-html-to-paper'
import './style.css'
import App from './App.vue'

createApp(App)
  .use(VueHtmlToPaper, { styles: ['/print.css'] })
  .mount('#app')
