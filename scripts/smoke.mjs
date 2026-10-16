// Loads every published bundle the way a consumer would and checks that each
// one exposes the plugin (an object with an `install` function).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const isPlugin = (p) => typeof p?.install === 'function';

const esm = (await import('vue-html-to-paper')).default;
assert.ok(isPlugin(esm), 'ESM default export');

const cjs = require('vue-html-to-paper');
assert.ok(isPlugin(cjs.default), 'CJS exports.default');

for (const file of ['build/vue-html-to-paper.js', 'build/vue-html-to-paper.min.js']) {
  const sandbox = {};
  sandbox.self = sandbox;
  vm.runInNewContext(readFileSync(file, 'utf8'), sandbox);
  assert.ok(isPlugin(sandbox.VueHtmlToPaper), `UMD global in ${file}`);
}

console.log('smoke: ESM, CJS and UMD bundles all expose the plugin');
