import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

test('each page load chooses only Y2K or pastel at the halfway boundary', () => {
  const source = readFileSync(new URL('../frontend/assets/js/hero-theme.js', import.meta.url), 'utf8');
  for (const [random, expected] of [[0, 'theme-y2k'], [0.499999, 'theme-y2k'], [0.5, 'theme-pastel'], [0.999999, 'theme-pastel']]) {
    let selected;
    runInNewContext(source, {
      Math: { random: () => random, floor: Math.floor },
      document: { currentScript: { parentElement: { classList: {
        replace: (oldTheme, newTheme) => { assert.equal(oldTheme, 'theme-y2k'); selected = newTheme; },
      } } } },
    });
    assert.equal(selected, expected);
  }
});
