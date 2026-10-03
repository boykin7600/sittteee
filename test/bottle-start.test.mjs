import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('bottle effect attempts real renderer loading and keeps fallback on failure', async () => {
  const source = readFileSync(new URL('../public/_next/static/chunks/site-experience-clean-v10.js', import.meta.url), 'utf8');
  const component = source.slice(source.indexOf('function ue()'), source.indexOf('var de=', source.indexOf('function ue()')));
  let effect, loads = 0;
  const classes = new Set();
  const stage = {classList: {add: c => classes.add(c), remove: c => classes.delete(c)}};
  vm.runInNewContext(component + ';ue()', {
    m: {useRef: () => ({current: stage}), useEffect: cb => { effect = cb; }},
    R: {jsx() {}, jsxs() {}}, le: [],
    Function: () => () => { loads++; return Promise.reject(new Error('offline')); },
    requestAnimationFrame: cb => setTimeout(cb, 0), setTimeout, clearTimeout,
  });
  const cleanup = effect();
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.equal(loads, 1, 'real 3D import must not be bypassed by an early return');
  assert.ok(classes.has('webgl-failed'), 'failed import must leave static fallback available');
  cleanup();
});
