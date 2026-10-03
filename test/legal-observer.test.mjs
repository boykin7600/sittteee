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

for (const context of ['order', 'chat']) {
  test(`${context} consent updates only the label text and preserves the checkbox indicator`, () => {
    let onMutation;
    let checked = false;
    let writes = 0;
    const indicator = { dataset: {}, innerHTML: '<svg aria-hidden="true"></svg>' };
    const labelText = {
      dataset: {},
      get innerHTML() { return this.markup; },
      set innerHTML(value) { this.markup = value; writes++; },
    };
    const findConsent = selector => {
      if (selector.endsWith('.consent-row > span')) return [labelText];
      if (selector.endsWith('.consent-row span')) return checked ? [indicator, labelText] : [labelText];
      return [];
    };
    const sheet = {
      querySelector: selector => selector === '.order-legal-note' ? {} : findConsent(selector)[0] || null,
    };
    vm.runInNewContext(readFileSync(new URL('../public/assets/legal-safety-v1.js', import.meta.url), 'utf8'), {
      document: {
        readyState: 'loading', documentElement: {}, addEventListener() {},
        querySelector: selector => context === 'order' && selector === '.order-sheet' ? sheet : null,
        querySelectorAll: selector => context === 'chat' ? findConsent(selector) : [],
      },
      MutationObserver: class { constructor(callback) { onMutation = callback; } observe() {} },
    });

    onMutation();
    assert.match(labelText.innerHTML, /согласие на обработку персональных данных/);
    assert.match(labelText.innerHTML, /href="\/privacy\.html#consent"/);
    if (context === 'order') assert.match(labelText.innerHTML, /href="\/oferta\.html"/);
    assert.equal(writes, 1);

    for (const nextChecked of [true, false, true]) {
      checked = nextChecked;
      onMutation();
      assert.equal(indicator.innerHTML, '<svg aria-hidden="true"></svg>');
      assert.equal(indicator.dataset.legalReady, undefined);
      assert.equal(writes, 1, 'toggling consent must not rewrite the indicator or label');
    }

    labelText.dataset = {};
    checked = true;
    onMutation();
    assert.equal(labelText.dataset.legalReady, 'true', 'a remounted consent label is updated even when checked');
    assert.equal(indicator.innerHTML, '<svg aria-hidden="true"></svg>');
    assert.equal(writes, 2);
  });
}
