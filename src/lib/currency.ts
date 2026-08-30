/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Locale } from './i18n/translate';

export type CurrencyCode = 'EUR' | 'RON';

// Used until a live rate has been fetched, and as a safety net if the fetch fails.
export const FALLBACK_EUR_RON_RATE = 4.98;

const RATE_CACHE_KEY = 'fx:EUR_RON';
const RATE_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface CachedRate {
  rate: number;
  fetchedAt: number;
}

function readCachedRate(): CachedRate | null {
  try {
    const raw = localStorage.getItem(RATE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.rate === 'number' && typeof parsed?.fetchedAt === 'number') return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeCachedRate(rate: number): void {
  try {
    localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ rate, fetchedAt: Date.now() } satisfies CachedRate));
  } catch {
    // localStorage unavailable (private browsing, etc.) — non-fatal, just skip caching.
  }
}

/** Returns a cached EUR->RON rate if fresh enough, without making a network call. */
export function getCachedEurRonRate(): number | null {
  const cached = readCachedRate();
  return cached ? cached.rate : null;
}

/** Fetches the current EUR->RON rate from a free, keyless ECB-backed API, refreshing the cache. Falls back to the last cached (or hardcoded) rate on any failure. */
export async function fetchEurRonRate(): Promise<number> {
  const cached = readCachedRate();
  if (cached && Date.now() - cached.fetchedAt < RATE_CACHE_MAX_AGE_MS) {
    return cached.rate;
  }

  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=RON');
    if (!res.ok) throw new Error(`Rate fetch failed: ${res.status}`);
    const data = await res.json();
    const rate = data?.rates?.RON;
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
      throw new Error('Malformed rate response');
    }
    writeCachedRate(rate);
    return rate;
  } catch (err) {
    console.error('Failed to fetch EUR->RON exchange rate', err);
    return cached?.rate ?? FALLBACK_EUR_RON_RATE;
  }
}

export function convert(amountEur: number, to: CurrencyCode, rate: number): number {
  return to === 'EUR' ? amountEur : amountEur * rate;
}

const INTL_LOCALE: Record<Locale, string> = { en: 'en-US', ro: 'ro-RO' };

/** Formats a EUR-denominated amount for display in the user's selected currency/locale. */
export function formatMoney(amountEur: number, currency: CurrencyCode, locale: Locale, rate: number): string {
  const converted = convert(amountEur, currency, rate);
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
}
