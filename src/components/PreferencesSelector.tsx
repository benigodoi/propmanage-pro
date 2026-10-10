/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';
import type { Locale, CurrencyCode } from '../lib/api/profile';

const LOCALE_OPTIONS: { value: Locale; labelKey: string }[] = [
  { value: 'en', labelKey: 'preferences.english' },
  { value: 'ro', labelKey: 'preferences.romanian' },
];

const CURRENCY_OPTIONS: { value: CurrencyCode; labelKey: string }[] = [
  { value: 'EUR', labelKey: 'preferences.euro' },
  { value: 'RON', labelKey: 'preferences.ron' },
];

export default function PreferencesSelector() {
  const { locale, currency, setLocale, setCurrency, t } = useLocalization();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        id="btn-preferences"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-lg text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
        title={t('preferences.title')}
      >
        <Globe size={20} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface border border-line shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-1">
            <div className="px-4 pb-2">
              <p className="text-xxs font-bold text-ink-faint uppercase tracking-wide mb-2">{t('preferences.language')}</p>
              <div className="flex gap-2">
                {LOCALE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLocale(opt.value)}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      locale === opt.value
                        ? 'bg-primary text-on-primary'
                        : 'bg-muted text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 pt-2 border-t border-line-subtle">
              <p className="text-xxs font-bold text-ink-faint uppercase tracking-wide mb-2 mt-2">{t('preferences.currency')}</p>
              <div className="flex gap-2">
                {CURRENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCurrency(opt.value)}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      currency === opt.value
                        ? 'bg-primary text-on-primary'
                        : 'bg-muted text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
