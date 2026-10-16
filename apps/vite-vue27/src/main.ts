import Vue from 'vue'
import VueHtmlToPaper from 'vue-html-to-paper'
import App from './App.vue'
import './style.css'

Vue.config.productionTip = false
Vue.use(VueHtmlToPaper, { styles: ['/print.css'] })

new Vue({ render: (h) => h(App) }).$mount('#app')
