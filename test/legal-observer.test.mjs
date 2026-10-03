import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('review updates settle instead of continually rewriting DOM', () => {
  let writes = 0;
  let onMutation;
  const element = () => {
    let text = '', html = '';
    return {
      dataset: {}, setAttribute() {},
      get textContent() { return text; },
      set textContent(value) { text = value; writes++; },
      get innerHTML() { return html; },
      set innerHTML(value) { html = value; writes++; },
    };
  };
  const nav = element(), rating = element();
  vm.runInNewContext(readFileSync(new URL('../public/assets/legal-safety-v1.js', import.meta.url), 'utf8'), {
    document: {
      readyState: 'loading', documentElement: {}, addEventListener() {},
      querySelector: selector => selector === 'nav a[href="#reviews"]' ? nav : selector === '.hero-rating-link' ? rating : null,
      querySelectorAll: () => [],
    },
    MutationObserver: class { constructor(callback) { onMutation = callback; } observe() {} },
  });
  onMutation();
  assert.equal(nav.textContent, 'Отзывы');
  assert.match(rating.innerHTML, /Отзывы покупателей/);
  writes = 0;
  onMutation();
  assert.equal(writes, 0, 'observer must not create another childList mutation once content is correct');
});
