import assert from 'node:assert/strict';
import test from 'node:test';

import { pathToScreen, screenToPath } from './screenRouting';

test('owner unit routes round-trip IDs containing URL-reserved characters', () => {
  for (const unitId of ['building/apt 2', 'unit%20', 'apartamentă']) {
    const path = screenToPath('owner', 'configure-unit', { unitId });

    assert.deepEqual(pathToScreen('owner', path), {
      screen: 'configure-unit',
      unitId,
    });
  }
});

test('unrecognized paths fall back to the persona dashboard', () => {
  assert.deepEqual(pathToScreen('owner', '/not-a-screen'), { screen: 'dashboard' });
  assert.deepEqual(pathToScreen('tenant', '/not-a-screen'), { screen: 'dashboard' });
});
