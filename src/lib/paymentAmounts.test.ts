import assert from 'node:assert/strict';
import test from 'node:test';

import { amountOutstanding, amountOverdue, amountReceived } from './paymentAmounts';

const OCT = '2026-10-01';

test('received and outstanding always sum to the total due', () => {
  for (const p of [
    { status: 'Paid', totalDue: 705 },
    { status: 'Pending', totalDue: 855 },
    { status: 'Overdue', totalDue: 455 },
    { status: 'Partial', totalDue: 575, partialAmountPaid: 300 },
  ] as const) {
    assert.equal(amountReceived(p) + amountOutstanding(p), p.totalDue);
  }
});

test('a partial payment leaves its remainder outstanding', () => {
  const p = { status: 'Partial', totalDue: 575, partialAmountPaid: 300 } as const;
  assert.equal(amountReceived(p), 300);
  assert.equal(amountOutstanding(p), 275);
});

test('a partial remainder is overdue only once its month has ended', () => {
  const partial = { status: 'Partial', totalDue: 575, partialAmountPaid: 300 } as const;
  assert.equal(amountOverdue({ ...partial, monthIso: OCT }, OCT), 0);
  assert.equal(amountOverdue({ ...partial, monthIso: '2026-09-01' }, OCT), 275);
  assert.equal(amountOverdue({ status: 'Overdue', totalDue: 455, monthIso: '2026-09-01' }, OCT), 455);
  assert.equal(amountOverdue({ status: 'Pending', totalDue: 855, monthIso: OCT }, OCT), 0);
});

test('an out-of-range stored partial amount is clamped to [0, total due]', () => {
  assert.equal(amountReceived({ status: 'Partial', totalDue: 575, partialAmountPaid: -50 }), 0);
  assert.equal(amountOutstanding({ status: 'Partial', totalDue: 575, partialAmountPaid: -50 }), 575);
  assert.equal(amountReceived({ status: 'Partial', totalDue: 575, partialAmountPaid: 900 }), 575);
});
