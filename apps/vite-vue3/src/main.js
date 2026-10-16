import { createApp } from 'vue';
import VueHtmlToPaper from 'vue-html-to-paper';
import App from './App.vue';
import './style.css';

createApp(App)
  .use(VueHtmlToPaper, { styles: ['/print.css'] })
  .mount('#app');
