/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Printer, X, ShieldCheck, CreditCard } from 'lucide-react';
import { Payment } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';

interface InvoiceViewProps {
  payment: Payment;
  onClose: () => void;
}

export default function InvoiceView({ payment, onClose }: InvoiceViewProps) {
  const { t, formatMoney } = useLocalization();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl relative overflow-hidden my-8">

        {/* Large Coral Stamp PAID Watermark */}
        {payment.status === 'Paid' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0">
            <span className="text-[120px] font-black text-rose-500/10 dark:text-rose-400/10 tracking-widest uppercase border-8 border-rose-500/10 dark:border-rose-400/10 px-8 py-2 rounded-xl rotate-[-30deg] inline-block font-sans">
              {t('invoice.paidStamp')}
            </span>
          </div>
        )}

        {payment.status === 'Overdue' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0">
            <span className="text-[100px] font-black text-red-600/10 dark:text-red-500/10 tracking-widest uppercase border-8 border-red-600/10 dark:border-red-500/10 px-6 py-2 rounded-xl rotate-[-30deg] inline-block font-sans">
              {t('invoice.overdueStamp')}
            </span>
          </div>
        )}

        {/* Top Header Controls (Action icons) */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 relative z-10 bg-slate-50 dark:bg-slate-900/60">
          <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {t('invoice.invoiceStatements')}
          </span>
          <div className="flex items-center gap-2">
            <button
              id="btn-print-invoice"
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              title={t('invoice.printStatement')}
            >
              <Printer size={16} />
            </button>
            <button
              id="btn-close-invoice"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              title={t('invoice.closeModal')}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-5 sm:p-8 space-y-8 relative z-10">

          {/* Logo & ID Row */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {payment.managerOrgName ?? 'PropManage Pro'}
              </h3>
              <p className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                {t('invoice.statementOfAccount')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                PAY-{payment.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase mt-1">
                {t('invoice.billingPeriod', { month: payment.month })}
              </p>
            </div>
          </div>

          {/* Billing addresses */}
          <div className="grid grid-cols-2 gap-6 text-xs border-t border-b border-slate-100 dark:border-slate-800 py-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                {t('invoice.fromManager')}
              </span>
              <p className="font-extrabold text-slate-800 dark:text-white">
                {payment.managerOrgName ?? 'PropManage Pro'}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                {t('invoice.toTenant')}
              </span>
              <p className="font-extrabold text-slate-800 dark:text-white">
                {payment.tenantName}
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                {t('dashboard.unitAt', { unit: payment.unitNumber, property: payment.propertyName })}
                {payment.propertyAddress && <><br />{payment.propertyAddress}</>}
                {payment.tenantEmail && <><br />{payment.tenantEmail}</>}
              </p>
            </div>
          </div>

          {/* Breakdown item list */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('invoice.lineItemBreakdown')}
            </h4>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-2.5">{t('invoice.itemDescription')}</th>
                    <th className="px-4 py-2.5 text-right">{t('invoice.amountDue')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {/* Rent item */}
                  <tr>
                    <td className="px-4 py-3">
                      {t('invoice.baseRentLine', { month: payment.month })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-950 dark:text-white">
                      {formatMoney(payment.totalDue - payment.utilityCharges)}
                    </td>
                  </tr>

                  {/* Utilities */}
                  {payment.utilityCharges > 0 && (
                    payment.utilityBreakdown && payment.utilityBreakdown.length > 0 ? (
                      payment.utilityBreakdown.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            {t('invoice.utilityRecoveryNamed', { name: item.name })}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-950 dark:text-white">
                            {formatMoney(item.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-3">
                          {t('invoice.utilityRecovery')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-950 dark:text-white">
                          {formatMoney(payment.utilityCharges)}
                        </td>
                      </tr>
                    )
                  )}

                  {/* Total row */}
                  <tr className="bg-slate-50 dark:bg-slate-900/40 font-bold text-sm text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800">
                    <td className="px-4 py-3">
                      {t('invoice.totalAccountDebitDue')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-base">
                      {formatMoney(payment.totalDue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Status Info block */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-xl flex flex-wrap justify-between items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                {t('invoice.paymentStatus')}
              </span>
              {payment.status === 'Paid' ? (
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded-full font-bold uppercase text-[9px]">
                  ● {t('invoice.paidSuccessfully')}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 rounded-full font-bold uppercase text-[9px]">
                  ● {t('invoice.unpaidActionReq')}
                </span>
              )}
            </div>

            {payment.status === 'Paid' && payment.datePaid && (
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block">{t('invoice.dateRecorded')}</span>
                  <span className="text-slate-800 dark:text-slate-300 font-bold">{payment.datePaid}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block">{t('invoice.method')}</span>
                  <span className="text-slate-800 dark:text-slate-300 font-bold flex items-center gap-1">
                    <CreditCard size={12} className="text-sky-500" /> {t('invoice.manualBankTransfer')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="flex items-center gap-2 text-xxs text-slate-400 dark:text-slate-500 font-semibold justify-center">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>{t('invoice.generatedBy', { org: payment.managerOrgName ?? 'PropManage Pro' })}</span>
          </div>

        </div>

        {/* Modal close bottom */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            id="btn-invoice-close-bottom"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-900 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
          >
            {t('invoice.closeInvoice')}
          </button>
        </div>

      </div>
    </div>
  );
}
