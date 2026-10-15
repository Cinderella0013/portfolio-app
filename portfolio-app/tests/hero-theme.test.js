import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

test('each page load chooses among all three hero themes at equal third boundaries', () => {
  const source = readFileSync(new URL('../frontend/assets/js/hero-theme.js', import.meta.url), 'utf8');
  for (const [random, expected] of [[0, 'theme-y2k'], [0.333333, 'theme-y2k'], [1 / 3, 'theme-pastel'], [0.666666, 'theme-pastel'], [2 / 3, 'theme-illustrated'], [0.999999, 'theme-illustrated']]) {
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
