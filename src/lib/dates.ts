/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// `YYYY-MM-DD` for the user's *local* calendar date. Don't use
// `toISOString().slice(0, 10)` for this — that's the UTC date, which in
// Romania is still "yesterday" between local midnight and 02:00/03:00.
export function localDateISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// `YYYY-MM-01` for the user's current local month.
export function localMonthStartISO(date: Date = new Date()): string {
  return `${localDateISO(date).slice(0, 7)}-01`;
}
