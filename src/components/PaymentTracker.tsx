/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Filter,
  RotateCcw,
  AlertTriangle,
  Send,
  CheckCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Payment } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { enumLabel } from '../lib/i18n';
import { localDateISO, localMonthStartISO } from '../lib/dates';

interface PaymentTrackerProps {
  payments: Payment[];
  /** Resolves true on success (failures are already reported by the caller). */
  onUpdatePaymentStatus: (ids: string[], status: Payment['status'], datePaid?: string) => Promise<boolean>;
  onOpenInvoice: (paymentId: string) => void;
}

const ALL_PROPERTIES = 'All Properties';
const ALL_STATUSES = 'All Statuses';
const ALL_MONTHS = 'All Months';

export default function PaymentTracker({
  payments,
  onUpdatePaymentStatus,
  onOpenInvoice,
}: PaymentTrackerProps) {
  const { t, locale, formatMoney } = useLocalization();

  // Filter States
  const [selectedProperty, setSelectedProperty] = useState<string>(ALL_PROPERTIES);
  const [selectedStatus, setSelectedStatus] = useState<string>(ALL_STATUSES);
  const [selectedMonth, setSelectedMonth] = useState<string>(ALL_MONTHS);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Unique dropdown list generators
  const propertiesList = useMemo(() => {
    const list = new Set(payments.map(p => p.propertyName));
    return [ALL_PROPERTIES, ...Array.from(list)];
  }, [payments]);

  const statusesList = [ALL_STATUSES, 'Paid', 'Overdue', 'Pending', 'Partial'];
  const monthsList = useMemo(() => {
    const list = new Set(payments.map(p => p.month));
    return [ALL_MONTHS, ...Array.from(list)];
  }, [payments]);

  // Filter logic
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchProp = selectedProperty === ALL_PROPERTIES || p.propertyName === selectedProperty;
      const matchStatus = selectedStatus === ALL_STATUSES || p.status === selectedStatus;
      const matchMonth = selectedMonth === ALL_MONTHS || p.month === selectedMonth;
      return matchProp && matchStatus && matchMonth;
    });
  }, [payments, selectedProperty, selectedStatus, selectedMonth]);

  // Statistics calculation based on filtered list
  const stats = useMemo(() => {
    let totalExpected = 0;
    let totalReceived = 0;
    let totalOverdue = 0;
    let utilityRecoveries = 0;

    filteredPayments.forEach(p => {
      totalExpected += p.totalDue;
      if (p.status === 'Paid') {
        totalReceived += p.totalDue;
      } else if (p.status === 'Partial') {
        totalReceived += p.partialAmountPaid || 0;
        totalOverdue += (p.totalDue - (p.partialAmountPaid || 0));
      } else if (p.status === 'Overdue') {
        totalOverdue += p.totalDue;
      }
      utilityChargesAcc(p);
    });

    function utilityChargesAcc(payment: Payment) {
      utilityRecoveries += payment.utilityCharges;
    }

    return {
      totalExpected,
      totalReceived,
      totalOverdue,
      utilityRecoveries
    };
  }, [filteredPayments]);

  // Selection helpers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(filteredPayments.map(p => p.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(r => r !== id));
    }
  };

  // Action Triggers
  const handleMarkAsPaidSelected = async () => {
    if (selectedRows.length === 0) {
      showToast(t('payments.selectAtLeastOne'));
      return;
    }
    const ids = selectedRows;
    if (await onUpdatePaymentStatus(ids, 'Paid', localDateISO())) {
      showToast(t('payments.markedPaidSuccess', { count: ids.length }));
      setSelectedRows([]);
    }
  };

  const handleMarkAsOverdueSelected = async () => {
    if (selectedRows.length === 0) {
      showToast(t('payments.selectAtLeastOne'));
      return;
    }
    const ids = selectedRows;
    if (await onUpdatePaymentStatus(ids, 'Overdue')) {
      showToast(t('payments.markedOverdueSuccess', { count: ids.length }));
      setSelectedRows([]);
    }
  };

  // Per-row status change. Paid stamps today's date; any other status
  // clears date_paid (updatePaymentStatus nulls it when no date is given).
  const handleRowStatusChange = (payment: Payment, status: Payment['status']) => {
    if (status === payment.status) return;
    onUpdatePaymentStatus([payment.id], status, status === 'Paid' ? localDateISO() : undefined);
  };

  // An unpaid payment for a month that has ended is overdue by definition —
  // the daily roll_payments() job would flip "Pending" straight back.
  const currentMonthStart = localMonthStartISO();

  const handleSendReminderSelected = () => {
    if (selectedRows.length === 0) {
      showToast(t('payments.selectAtLeastOne'));
      return;
    }
    showToast(t('payments.remindersSent', { count: selectedRows.length }));
    setSelectedRows([]);
  };

  const handleResetFilters = () => {
    setSelectedProperty(ALL_PROPERTIES);
    setSelectedStatus(ALL_STATUSES);
    setSelectedMonth(ALL_MONTHS);
    setSelectedRows([]);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">

      {/* Toast Alert Popups */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            {t('payments.title')}
          </h2>
          <p className="text-ink-muted text-sm mt-1">
            {t('payments.subtitle')}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2.5">
          <button
            id="btn-send-reminder-tracker"
            type="button"
            onClick={handleSendReminderSelected}
            className="px-4 py-2 bg-muted hover:bg-slate-200 dark:hover:bg-slate-700 text-ink-soft rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send size={14} />
            {t('payments.sendReminder')}
          </button>

          <button
            id="btn-mark-overdue-tracker"
            type="button"
            onClick={handleMarkAsOverdueSelected}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
          >
            <AlertTriangle size={14} />
            {t('payments.markAsOverdue')}
          </button>

          <button
            id="btn-mark-paid-tracker"
            type="button"
            onClick={handleMarkAsPaidSelected}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-on-primary rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <CheckCircle size={14} />
            {t('payments.markAsPaid')}
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-surface border border-line p-4 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">

          {/* Property Filter */}
          <div>
            <label htmlFor="filter-property" className="block text-[10px] font-bold text-ink-faint uppercase tracking-widest mb-1.5">
              {t('payments.property')}
            </label>
            <select
              id="filter-property"
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full px-3 py-2 bg-field border border-line rounded-lg text-xs font-semibold text-ink-soft focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              {propertiesList.map(prop => (
                <option key={prop} value={prop}>{prop === ALL_PROPERTIES ? t('payments.allProperties') : prop}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="filter-status" className="block text-[10px] font-bold text-ink-faint uppercase tracking-widest mb-1.5">
              {t('dashboard.status')}
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-field border border-line rounded-lg text-xs font-semibold text-ink-soft focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              {statusesList.map(st => (
                <option key={st} value={st}>{st === ALL_STATUSES ? t('payments.allStatuses') : enumLabel(locale, st)}</option>
              ))}
            </select>
          </div>

          {/* Month/Year Filter */}
          <div>
            <label htmlFor="filter-month" className="block text-[10px] font-bold text-ink-faint uppercase tracking-widest mb-1.5">
              {t('payments.monthYear')}
            </label>
            <select
              id="filter-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 bg-field border border-line rounded-lg text-xs font-semibold text-ink-soft focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              {monthsList.map(m => (
                <option key={m} value={m}>{m === ALL_MONTHS ? t('payments.allMonths') : m}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters Trigger */}
          <button
            id="btn-reset-filters"
            type="button"
            onClick={handleResetFilters}
            className="w-full px-4 py-2 bg-muted hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/50 rounded-lg text-xs font-bold text-ink-soft transition-colors flex items-center justify-center gap-2 h-[38px] cursor-pointer"
          >
            <RotateCcw size={14} />
            {t('payments.resetFilters')}
          </button>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-surface border border-line p-5 rounded-xl">
          <span className="text-[10px] font-bold text-ink-faint uppercase tracking-widest">
            {t('payments.totalExpected')}
          </span>
          <p className="text-2xl font-extrabold text-ink mt-1.5 font-sans">
            {formatMoney(stats.totalExpected)}
          </p>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface border border-line p-5 rounded-xl">
          <span className="text-[10px] font-bold text-ink-faint uppercase tracking-widest">
            {t('payments.totalReceived')}
          </span>
          <p className="text-2xl font-extrabold text-ink mt-1.5 font-sans">
            {formatMoney(stats.totalReceived)}
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface border border-line p-5 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-widest text-danger">
            {t('payments.totalOverdue')}
          </span>
          <p className="text-2xl font-extrabold text-danger mt-1.5 font-sans">
            {formatMoney(stats.totalOverdue)}
          </p>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface border border-line p-5 rounded-xl">
          <span className="text-[10px] font-bold text-ink-faint uppercase tracking-widest">
            {t('payments.utilityRecoveries')}
          </span>
          <p className="text-2xl font-extrabold text-ink mt-1.5 font-sans">
            {formatMoney(stats.utilityRecoveries)}
          </p>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-subtle text-xxs font-bold text-ink-faint uppercase tracking-widest border-b border-slate-200/50 dark:border-slate-800/80">
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    id="checkbox-select-all-tracker"
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filteredPayments.length > 0 && selectedRows.length === filteredPayments.length}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                </th>
                <th className="px-6 py-4">{t('payments.propertyUnit')}</th>
                <th className="px-6 py-4">{t('payments.tenant')}</th>
                <th className="px-6 py-4">{t('payments.month')}</th>
                <th className="px-6 py-4">{t('payments.totalDue')}</th>
                <th className="px-6 py-4">{t('payments.breakdown')}</th>
                <th className="px-6 py-4">{t('dashboard.status')}</th>
                <th className="px-6 py-4">{t('payments.datePaid')}</th>
                <th className="px-6 py-4 text-center">{t('dashboard.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
              {filteredPayments.map((p) => {
                const isSelected = selectedRows.includes(p.id);
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/10 ${
                      isSelected ? 'bg-slate-50/70 dark:bg-sky-500/10' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-6 py-4 text-center">
                      <input
                        id={`checkbox-select-row-${p.id}`}
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(p.id, e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                    </td>

                    {/* Property / Unit */}
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-ink">{p.propertyName}</p>
                      <p className="text-xxs text-ink-faint mt-0.5">{t('dashboard.unitLabel', { unit: p.unitNumber })}</p>
                    </td>

                    {/* Tenant */}
                    <td className="px-6 py-4 font-bold text-ink-soft">
                      {p.tenantName}
                    </td>

                    {/* Month */}
                    <td className="px-6 py-4 text-ink-muted font-medium">
                      {p.month}
                    </td>

                    {/* Total Due */}
                    <td className="px-6 py-4 font-extrabold text-ink font-sans text-sm">
                      {formatMoney(p.totalDue)}
                    </td>

                    {/* Breakdown */}
                    <td className="px-6 py-4 space-x-1 whitespace-nowrap">
                      {p.breakdown.includes('rent') && (
                        <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 rounded font-bold text-[9px] uppercase tracking-wide">
                          {enumLabel(locale, 'rent')}
                        </span>
                      )}
                      {p.breakdown.includes('utilities') && (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded font-bold text-[9px] uppercase tracking-wide">
                          {enumLabel(locale, 'utilities')}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {p.status === 'Paid' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                          ● {enumLabel(locale, 'Paid')}
                        </span>
                      )}
                      {p.status === 'Overdue' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400">
                          ● {enumLabel(locale, 'Overdue')}
                        </span>
                      )}
                      {p.status === 'Pending' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
                          ● {enumLabel(locale, 'Pending')}
                        </span>
                      )}
                      {p.status === 'Partial' && (
                        <div className="flex flex-col">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 self-start">
                            ● {enumLabel(locale, 'Partial')}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 ml-1">
                            {t('payments.paidAmount', { amount: formatMoney(p.partialAmountPaid ?? 0) })}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Date Paid */}
                    <td className="px-6 py-4 font-semibold text-ink-muted">
                      {p.datePaid || '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-1">
                        <select
                          id={`select-payment-status-${p.id}`}
                          value={p.status}
                          onChange={(e) => handleRowStatusChange(p, e.target.value as Payment['status'])}
                          title={t('payments.changeStatus')}
                          aria-label={t('payments.changeStatus')}
                          className="px-1.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-ink-soft text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          {(['Pending', 'Overdue', 'Paid'] as const).map((s) => (
                            <option
                              key={s}
                              value={s}
                              disabled={s === 'Pending' && p.monthIso < currentMonthStart}
                            >
                              {enumLabel(locale, s)}
                            </option>
                          ))}
                          {/* Partial needs an amount, so it can't be picked here — only shown when already set. */}
                          {p.status === 'Partial' && <option value="Partial" disabled>{enumLabel(locale, 'Partial')}</option>}
                        </select>
                        <button
                          id={`btn-open-invoice-${p.id}`}
                          type="button"
                          onClick={() => onOpenInvoice(p.id)}
                          className="px-2.5 py-1 rounded bg-muted hover:bg-slate-200 dark:hover:bg-slate-700 text-ink-soft text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          {t('payments.invoice')}
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info/pagination */}
        <div className="px-6 py-4 bg-subtle border-t border-line-subtle flex justify-between items-center">
          <span className="text-xxs text-ink-faint font-semibold uppercase tracking-wider">
            {t('payments.showingEntries', { shown: filteredPayments.length, total: payments.length })}
          </span>

          <div className="flex items-center gap-2">
            <button
              id="btn-prev-page"
              type="button"
              disabled
              className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 select-none opacity-50 text-xs font-bold"
            >
              {t('payments.previous')}
            </button>
            <button
              id="btn-next-page"
              type="button"
              disabled
              className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 select-none opacity-50 text-xs font-bold"
            >
              {t('payments.next')}
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Utility Notice footer */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200/50 dark:border-slate-800 rounded-xl gap-4">
        <div className="flex flex-wrap gap-4 text-xxs font-bold text-ink-muted uppercase tracking-wide">
          <span className="text-slate-400">{t('payments.legend')}:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-sky-100 dark:bg-sky-500/15 block border border-sky-200 dark:border-sky-800" />
            <span>{t('payments.baseRentOnly')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-100 dark:bg-amber-500/15 block border border-amber-200 dark:border-amber-800" />
            <span>{t('payments.rentPlusUtilities')}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xxs text-ink-faint font-semibold italic">
          <HelpCircle size={14} className="text-slate-400" />
          <span>{t('payments.utilityNote')}</span>
        </div>
      </div>

    </div>
  );
}
