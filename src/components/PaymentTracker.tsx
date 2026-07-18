/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  RotateCcw, 
  Send, 
  CheckCircle, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Payment } from '../types';

interface PaymentTrackerProps {
  payments: Payment[];
  onUpdatePaymentStatus: (id: string, status: 'Paid' | 'Overdue' | 'Pending' | 'Partial', datePaid?: string) => void;
  onOpenInvoice: (paymentId: string) => void;
}

export default function PaymentTracker({
  payments,
  onUpdatePaymentStatus,
  onOpenInvoice,
}: PaymentTrackerProps) {
  
  // Filter States
  const [selectedProperty, setSelectedProperty] = useState<string>('All Properties');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [selectedMonth, setSelectedMonth] = useState<string>('All Months');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Unique dropdown list generators
  const propertiesList = useMemo(() => {
    const list = new Set(payments.map(p => p.propertyName));
    return ['All Properties', ...Array.from(list)];
  }, [payments]);

  const statusesList = ['All Statuses', 'Paid', 'Overdue', 'Pending', 'Partial'];
  const monthsList = useMemo(() => {
    const list = new Set(payments.map(p => p.month));
    return ['All Months', ...Array.from(list)];
  }, [payments]);

  // Filter logic
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchProp = selectedProperty === 'All Properties' || p.propertyName === selectedProperty;
      const matchStatus = selectedStatus === 'All Statuses' || p.status === selectedStatus;
      const matchMonth = selectedMonth === 'All Months' || p.month === selectedMonth;
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
  const handleMarkAsPaidSelected = () => {
    if (selectedRows.length === 0) {
      showToast("Please select at least one invoice first");
      return;
    }
    const todayISO = new Date().toISOString().slice(0, 10);
    selectedRows.forEach(id => {
      onUpdatePaymentStatus(id, 'Paid', todayISO);
    });
    showToast(`Successfully marked ${selectedRows.length} payment(s) as Paid`);
    setSelectedRows([]);
  };

  const handleSendReminderSelected = () => {
    if (selectedRows.length === 0) {
      showToast("Please select at least one invoice first");
      return;
    }
    showToast(`Reminders sent successfully to ${selectedRows.length} tenant(s)`);
    setSelectedRows([]);
  };

  const handleResetFilters = () => {
    setSelectedProperty('All Properties');
    setSelectedStatus('All Statuses');
    setSelectedMonth('All Months');
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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payment Tracker
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Monitor and manage all rental income and utility reimbursements.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2.5">
          <button
            id="btn-send-reminder-tracker"
            type="button"
            onClick={handleSendReminderSelected}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send size={14} />
            Send Reminder
          </button>
          
          <button
            id="btn-mark-paid-tracker"
            type="button"
            onClick={handleMarkAsPaidSelected}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-900 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <CheckCircle size={14} />
            Mark as Paid
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          
          {/* Property Filter */}
          <div>
            <label htmlFor="filter-property" className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
              PROPERTY
            </label>
            <select
              id="filter-property"
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              {propertiesList.map(prop => (
                <option key={prop} value={prop}>{prop}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="filter-status" className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
              STATUS
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              {statusesList.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Month/Year Filter */}
          <div>
            <label htmlFor="filter-month" className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
              MONTH/YEAR
            </label>
            <select
              id="filter-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              {monthsList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters Trigger */}
          <button
            id="btn-reset-filters"
            type="button"
            onClick={handleResetFilters}
            className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/50 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-2 h-[38px] cursor-pointer"
          >
            <RotateCcw size={14} />
            Reset Filters
          </button>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-5 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            TOTAL EXPECTED
          </span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-sans">
            ${stats.totalExpected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-5 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            TOTAL RECEIVED
          </span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-sans">
            ${stats.totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-5 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-red-600 dark:text-red-400">
            TOTAL OVERDUE
          </span>
          <p className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1.5 font-sans">
            ${stats.totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-5 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            UTILITY RECOVERIES
          </span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-sans">
            ${stats.utilityRecoveries.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200/50 dark:border-slate-800/80">
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    id="checkbox-select-all-tracker"
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filteredPayments.length > 0 && selectedRows.length === filteredPayments.length}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                </th>
                <th className="px-6 py-4">PROPERTY / UNIT</th>
                <th className="px-6 py-4">TENANT</th>
                <th className="px-6 py-4">MONTH</th>
                <th className="px-6 py-4">TOTAL DUE</th>
                <th className="px-6 py-4">BREAKDOWN</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4">DATE PAID</th>
                <th className="px-6 py-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
              {filteredPayments.map((p) => {
                const isSelected = selectedRows.includes(p.id);
                return (
                  <tr 
                    key={p.id} 
                    className={`transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/10 ${
                      isSelected ? 'bg-slate-50/70 dark:bg-sky-950/20' : ''
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
                      <p className="font-extrabold text-slate-900 dark:text-white">{p.propertyName}</p>
                      <p className="text-xxs text-slate-400 dark:text-slate-500 mt-0.5">Unit {p.unitNumber}</p>
                    </td>

                    {/* Tenant */}
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                      {p.tenantName}
                    </td>

                    {/* Month */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                      {p.month}
                    </td>

                    {/* Total Due */}
                    <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white font-sans text-sm">
                      ${p.totalDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Breakdown */}
                    <td className="px-6 py-4 space-x-1 whitespace-nowrap">
                      {p.breakdown.includes('rent') && (
                        <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 rounded font-bold text-[9px] uppercase tracking-wide">
                          Rent
                        </span>
                      )}
                      {p.breakdown.includes('utilities') && (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded font-bold text-[9px] uppercase tracking-wide">
                          Utilities
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {p.status === 'Paid' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                          ● Paid
                        </span>
                      )}
                      {p.status === 'Overdue' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400">
                          ● Overdue
                        </span>
                      )}
                      {p.status === 'Pending' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                          ● Pending
                        </span>
                      )}
                      {p.status === 'Partial' && (
                        <div className="flex flex-col">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 self-start">
                            ● Partial
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 ml-1">
                            (${p.partialAmountPaid} paid)
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Date Paid */}
                    <td className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">
                      {p.datePaid || '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          id={`btn-open-invoice-${p.id}`}
                          type="button"
                          onClick={() => onOpenInvoice(p.id)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Invoice
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
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <span className="text-xxs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            Showing {filteredPayments.length} of {payments.length} entries
          </span>

          <div className="flex items-center gap-2">
            <button
              id="btn-prev-page"
              type="button"
              disabled
              className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 select-none opacity-50 text-xs font-bold"
            >
              Previous
            </button>
            <button
              id="btn-next-page"
              type="button"
              disabled
              className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 select-none opacity-50 text-xs font-bold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Utility Notice footer */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200/50 dark:border-slate-800 rounded-xl gap-4">
        <div className="flex flex-wrap gap-4 text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          <span className="text-slate-400">LEGEND:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-sky-100 dark:bg-sky-950/40 block border border-sky-200 dark:border-sky-800" />
            <span>Base Rent Only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-100 dark:bg-amber-950/40 block border border-amber-200 dark:border-amber-800" />
            <span>Rent + Utilities Included</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xxs text-slate-400 dark:text-slate-500 font-semibold italic">
          <HelpCircle size={14} className="text-slate-400" />
          <span>Utility charges are calculated based on monthly meter readings.</span>
        </div>
      </div>

    </div>
  );
}
