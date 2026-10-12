/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Euro } from 'lucide-react';
import { Payment } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAsyncGuard } from '../hooks/useAsyncGuard';
import { useDialogFocus } from '../hooks/useDialogFocus';

interface PartialPaymentDialogProps {
  payment: Payment | null;
  onCancel: () => void;
  /** Resolves true once the amount is saved; the dialog then closes. */
  onSubmit: (payment: Payment, amountEur: number) => Promise<boolean>;
}

// Records how much of a payment has been received. Amounts are entered in
// EUR, like every other money input, since EUR is what's stored.
export default function PartialPaymentDialog({ payment, onCancel, onSubmit }: PartialPaymentDialogProps) {
  const { t, currency, formatMoney } = useLocalization();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, runGuarded] = useAsyncGuard();
  const formRef = useRef<HTMLFormElement>(null);
  useDialogFocus(formRef, !!payment, onCancel);

  useEffect(() => {
    setAmount(payment?.partialAmountPaid != null ? String(payment.partialAmountPaid) : '');
    setError(null);
  }, [payment]);

  if (!payment) return null;

  const parsed = Number(amount);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rounded = Math.round(parsed * 100) / 100;
    if (!amount || !Number.isFinite(parsed) || rounded <= 0 || rounded >= payment.totalDue) {
      setError(t('payments.partialInvalid', { total: formatMoney(payment.totalDue) }));
      return;
    }
    runGuarded(async () => {
      if (await onSubmit(payment, rounded)) onCancel();
    });
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/70 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <form
        ref={formRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="partial-payment-title"
        onSubmit={handleSubmit}
        className="bg-surface rounded-xl border border-line max-w-sm w-full p-6 shadow-2xl"
      >
        <h3 id="partial-payment-title" className="text-lg font-semibold text-ink mb-1">
          {t('payments.partialTitle')}
        </h3>
        <p className="text-xs text-ink-muted leading-relaxed">
          {t('payments.partialSubtitle', { tenant: payment.tenantName, month: payment.month, total: formatMoney(payment.totalDue) })}
        </p>

        <label htmlFor="partial-amount" className="block text-xs font-medium text-ink-faint mt-5 mb-1.5">
          {t('payments.amountReceivedEur')}
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-ink-muted">
            <Euro size={14} />
          </span>
          <input
            id="partial-amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? 'partial-amount-error' : undefined}
            className="w-full pl-8 pr-4 py-2.5 bg-field border border-line rounded-lg text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        {currency !== 'EUR' && amount && Number.isFinite(parsed) && (
          <p className="text-xs text-ink-faint mt-1">{t('unitConfig.convertedHint', { amount: formatMoney(parsed) })}</p>
        )}
        {error && (
          <p id="partial-amount-error" role="alert" className="text-xs text-danger mt-2">{error}</p>
        )}

        <div className="flex gap-2 pt-6 mt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer bg-primary hover:bg-primary-hover text-on-primary disabled:opacity-60"
          >
            {submitting ? t('common.saving') : t('payments.recordPartial')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-muted text-ink-soft rounded-lg hover:bg-zinc-200 text-sm font-medium cursor-pointer"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
