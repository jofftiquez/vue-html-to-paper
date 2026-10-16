import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Vue from 'vue2';
import VueHtmlToPaper from '../src/index.js';
import { mockPopup, mountTarget } from './popup.js';

describe('Vue 2: Vue.use(VueHtmlToPaper)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mountTarget();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('runs on Vue 2.7', () => {
    expect(Vue.version).toMatch(/^2\.7\./);
  });

  // Known gap (#5): install() only knows Vue 3's app.config.globalProperties,
  // so Vue.use() throws on Vue 2.
  it.fails('registers this.$htmlToPaper on Vue 2 components', () => {
    const { popup } = mockPopup();
    Vue.use(VueHtmlToPaper, { styles: ['a.css'] });
    const vm = new Vue({ render: (h) => h('span') }).$mount();
    vm.$htmlToPaper('printMe');
    vi.runAllTimers();
    expect(popup.print).toHaveBeenCalledOnce();
  });
});
