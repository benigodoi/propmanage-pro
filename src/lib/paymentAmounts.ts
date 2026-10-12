/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Payment } from '../types';

type PaymentAmounts = Pick<Payment, 'status' | 'totalDue' | 'partialAmountPaid'>;

// One definition of "received" and "outstanding" for every screen, so the
// dashboard, Financials tab, payment tracker and tenant balance agree: a
// Partial payment's unpaid remainder is still outstanding.
export function amountReceived(p: PaymentAmounts): number {
  if (p.status === 'Paid') return p.totalDue;
  // Clamped both ways: the column has no CHECK, so a bad stored value must
  // not produce negative collections or an outstanding above the total.
  if (p.status === 'Partial') return Math.min(Math.max(p.partialAmountPaid ?? 0, 0), p.totalDue);
  return 0;
}

export function amountOutstanding(p: PaymentAmounts): number {
  return Math.max(0, p.totalDue - amountReceived(p));
}

// Outstanding money whose month has already ended. A current-month Partial
// remainder is still just "not paid yet", not overdue.
export function amountOverdue(p: PaymentAmounts & Pick<Payment, 'monthIso'>, currentMonthStartISO: string): number {
  if (p.status === 'Overdue') return amountOutstanding(p);
  if (p.status === 'Partial' && p.monthIso < currentMonthStartISO) return amountOutstanding(p);
  return 0;
}

export function sumBy<T>(items: T[], amount: (item: T) => number): number {
  return items.reduce((sum, item) => sum + amount(item), 0);
}
