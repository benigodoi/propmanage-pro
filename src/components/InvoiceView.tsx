/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Printer, X, ShieldCheck, CreditCard } from 'lucide-react';
import { Payment } from '../types';

interface InvoiceViewProps {
  payment: Payment;
  onClose: () => void;
}

export default function InvoiceView({ payment, onClose }: InvoiceViewProps) {
  
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
              PAID
            </span>
          </div>
        )}

        {payment.status === 'Overdue' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0">
            <span className="text-[100px] font-black text-red-600/10 dark:text-red-500/10 tracking-widest uppercase border-8 border-red-600/10 dark:border-red-500/10 px-6 py-2 rounded-xl rotate-[-30deg] inline-block font-sans">
              OVERDUE
            </span>
          </div>
        )}

        {/* Top Header Controls (Action icons) */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 relative z-10 bg-slate-50 dark:bg-slate-900/60">
          <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            INVOICE STATEMENTS
          </span>
          <div className="flex items-center gap-2">
            <button
              id="btn-print-invoice"
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              title="Print statement"
            >
              <Printer size={16} />
            </button>
            <button
              id="btn-close-invoice"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-8 space-y-8 relative z-10">
          
          {/* Logo & ID Row */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {payment.managerOrgName ?? 'PropManage Pro'}
              </h3>
              <p className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                STATEMENT OF ACCOUNT
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                PAY-{payment.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase mt-1">
                BILLING PERIOD: {payment.month}
              </p>
            </div>
          </div>

          {/* Billing addresses */}
          <div className="grid grid-cols-2 gap-6 text-xs border-t border-b border-slate-100 dark:border-slate-800 py-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                FROM (MANAGER)
              </span>
              <p className="font-extrabold text-slate-800 dark:text-white">
                {payment.managerOrgName ?? 'PropManage Pro'}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                TO (TENANT)
              </span>
              <p className="font-extrabold text-slate-800 dark:text-white">
                {payment.tenantName}
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                {payment.propertyName}, Unit {payment.unitNumber}
                {payment.propertyAddress && <><br />{payment.propertyAddress}</>}
                {payment.tenantEmail && <><br />{payment.tenantEmail}</>}
              </p>
            </div>
          </div>

          {/* Breakdown item list */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Line-Item Billing Breakdown
            </h4>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-2.5">ITEM DESCRIPTION</th>
                    <th className="px-4 py-2.5 text-right">AMOUNT DUE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {/* Rent item */}
                  <tr>
                    <td className="px-4 py-3">
                      Base Rent Lease Premium ({payment.month})
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-950 dark:text-white">
                      ${(payment.totalDue - payment.utilityCharges).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  
                  {/* Utilities */}
                  {payment.utilityCharges > 0 && (
                    payment.utilityBreakdown && payment.utilityBreakdown.length > 0 ? (
                      payment.utilityBreakdown.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            Utility Recovery — {item.name}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-950 dark:text-white">
                            ${item.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-3">
                          Utility Recovery
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-950 dark:text-white">
                          ${payment.utilityCharges.toFixed(2)}
                        </td>
                      </tr>
                    )
                  )}

                  {/* Total row */}
                  <tr className="bg-slate-50 dark:bg-slate-900/40 font-bold text-sm text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800">
                    <td className="px-4 py-3">
                      TOTAL ACCOUNT DEBIT DUE
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-base">
                      ${payment.totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                PAYMENT STATUS
              </span>
              {payment.status === 'Paid' ? (
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full font-bold uppercase text-[9px]">
                  ● PAID SUCCESSFULLY
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-full font-bold uppercase text-[9px]">
                  ● UNPAID / ACTION REQ
                </span>
              )}
            </div>

            {payment.status === 'Paid' && payment.datePaid && (
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block">DATE RECORDED</span>
                  <span className="text-slate-800 dark:text-slate-300 font-bold">{payment.datePaid}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block">METHOD</span>
                  <span className="text-slate-800 dark:text-slate-300 font-bold flex items-center gap-1">
                    <CreditCard size={12} className="text-sky-500" /> Manual / Bank Transfer
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="flex items-center gap-2 text-xxs text-slate-400 dark:text-slate-500 font-semibold justify-center">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Statement generated by {payment.managerOrgName ?? 'PropManage Pro'}.</span>
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
            Close Invoice
          </button>
        </div>

      </div>
    </div>
  );
}
