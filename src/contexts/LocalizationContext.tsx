/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getMyProfile, updateMyPreferences, Locale, CurrencyCode } from '../lib/api/profile';
import { dictionaries, translate } from '../lib/i18n';
import { fetchEurRonRate, getCachedEurRonRate, formatMoney as formatMoneyUtil, FALLBACK_EUR_RON_RATE } from '../lib/currency';

const LOCALE_KEY = 'locale';
const CURRENCY_KEY = 'currency';

interface LocalizationContextValue {
  locale: Locale;
  currency: CurrencyCode;
  rate: number;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: CurrencyCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatMoney: (amountEur: number) => string;
}

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

function readInitialLocale(): Locale {
  return localStorage.getItem(LOCALE_KEY) === 'ro' ? 'ro' : 'en';
}

function readInitialCurrency(): CurrencyCode {
  return localStorage.getItem(CURRENCY_KEY) === 'RON' ? 'RON' : 'EUR';
}

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);
  const [currency, setCurrencyState] = useState<CurrencyCode>(readInitialCurrency);
  const [rate, setRate] = useState<number>(() => getCachedEurRonRate() ?? FALLBACK_EUR_RON_RATE);
  // Tracks whether the last profile resolution found a signed-in user, so setLocale/setCurrency
  // know whether to persist to the DB or only to localStorage (logged-out screens).
  const signedInRef = useRef(false);

  useEffect(() => {
    fetchEurRonRate().then(setRate);
  }, []);

  const applyFromProfile = useCallback(() => {
    getMyProfile()
      .then((profile) => {
        signedInRef.current = true;
        setLocaleState(profile.locale);
        setCurrencyState(profile.currency);
        localStorage.setItem(LOCALE_KEY, profile.locale);
        localStorage.setItem(CURRENCY_KEY, profile.currency);
      })
      .catch(() => {
        signedInRef.current = false;
      });
  }, []);

  useEffect(() => {
    applyFromProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        signedInRef.current = false;
        return;
      }
      applyFromProfile();
    });
    return () => subscription.unsubscribe();
  }, [applyFromProfile]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_KEY, next);
    if (signedInRef.current) {
      updateMyPreferences({ locale: next, currency }).catch((err) => console.error('Failed to save language preference', err));
    }
  }, [currency]);

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next);
    localStorage.setItem(CURRENCY_KEY, next);
    if (signedInRef.current) {
      updateMyPreferences({ locale, currency: next }).catch((err) => console.error('Failed to save currency preference', err));
    }
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(dictionaries[locale], key, params),
    [locale]
  );

  const formatMoney = useCallback(
    (amountEur: number) => formatMoneyUtil(amountEur, currency, locale, rate),
    [currency, locale, rate]
  );

  const value = useMemo<LocalizationContextValue>(
    () => ({ locale, currency, rate, setLocale, setCurrency, t, formatMoney }),
    [locale, currency, rate, setLocale, setCurrency, t, formatMoney]
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization(): LocalizationContextValue {
  const ctx = useContext(LocalizationContext);
  if (!ctx) throw new Error('useLocalization must be used within a LocalizationProvider');
  return ctx;
}
