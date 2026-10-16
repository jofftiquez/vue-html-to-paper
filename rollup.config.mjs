import terser from '@rollup/plugin-terser';

const input = 'src/index.js';

export default [
  {
    input,
    output: [
      { file: 'dist/index.mjs', format: 'es' },
      { file: 'dist/index.js', format: 'cjs', exports: 'named' },
    ],
  },
  {
    input,
    output: [
      { file: 'build/vue-html-to-paper.js', name: 'VueHtmlToPaper', format: 'umd', exports: 'default' },
      { file: 'build/vue-html-to-paper.min.js', name: 'VueHtmlToPaper', format: 'umd', exports: 'default', plugins: [terser()] },
    ],
  },
];
