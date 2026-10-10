/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  FileText,
  Download,
  Building
} from 'lucide-react';
import { Payment, ServiceRequest, Unit } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { enumLabel } from '../lib/i18n';

interface TenantDashboardProps {
  units: Unit[];
  payments: Payment[];
  serviceRequests: ServiceRequest[];
  onOpenInvoice: (id: string) => void;
  onOpenServiceRequests: () => void;
}

function monthsLeft(leaseEnd: string): number | null {
  const end = new Date(leaseEnd);
  if (Number.isNaN(end.getTime())) return null;
  const now = new Date();
  const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
  return Math.max(0, months);
}

export default function TenantDashboard({
  units,
  payments,
  serviceRequests,
  onOpenInvoice,
  onOpenServiceRequests
}: TenantDashboardProps) {
  const { t, locale, formatMoney } = useLocalization();
  // RLS already scopes `units`/`payments`/`serviceRequests` to this tenant's
  // own records, so the first unit (if any) is their current residence.
  const currentUnit = units[0];
  const currentTenant = currentUnit?.activeTenant;

  const balanceOutstanding = useMemo(() => {
    return payments.reduce((sum, p) => {
      if (p.status === 'Paid') return sum;
      if (p.status === 'Partial') return sum + (p.totalDue - (p.partialAmountPaid ?? 0));
      return sum + p.totalDue;
    }, 0);
  }, [payments]);

  const recentPayments = useMemo(() => {
    return payments
      .filter(p => p.status === 'Paid' && p.datePaid)
      .sort((a, b) => new Date(b.datePaid as string).getTime() - new Date(a.datePaid as string).getTime())
      .slice(0, 5);
  }, [payments]);

  const activeRequestsCount = serviceRequests.filter(r => r.status !== 'Completed').length;
  const remainingMonths = currentTenant?.leaseEnd ? monthsLeft(currentTenant.leaseEnd) : null;
  const oldestUnpaid = payments
    .filter(p => p.status === 'Pending' || p.status === 'Overdue')
    .slice(-1)[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Welcome & Top Res Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
            {t('tenantDashboard.welcomeBack')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('tenantDashboard.title')}
          </h2>
        </div>

        {/* Current Residence Widget */}
        {currentUnit && (
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl">
            <Building size={16} className="text-sky-500" />
            <div className="text-left">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t('tenantDashboard.currentResidence')}</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {t('dashboard.unitAt', { unit: currentUnit.unitNumber, property: currentUnit.propertyName })}
              </span>
            </div>
          </div>
        )}
      </div>

      {!currentUnit ? (
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <Building className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={32} />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('tenantDashboard.noLease')}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('tenantDashboard.noLeaseHint')}</p>
        </div>
      ) : (
        <>
          {/* Hero row: Rent outstanding, Balance & status panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Balance block */}
            <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">

              <div className="flex flex-col sm:flex-row justify-between gap-4 items-start">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">{t('tenantDashboard.totalBalance')}</span>
                  <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
                    {formatMoney(balanceOutstanding)}
                  </p>
                  {oldestUnpaid && (
                    <p className="text-xxs text-slate-400 dark:text-slate-500 mt-2 font-semibold">
                      {t('tenantDashboard.oldestUnpaid', { month: oldestUnpaid.month })}
                    </p>
                  )}
                </div>

                {balanceOutstanding > 0 ? (
                  <div className="px-3 py-2 bg-amber-50 dark:bg-transparent border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 self-start max-w-xs">
                    <AlertCircle size={14} className="shrink-0" />
                    {t('tenantDashboard.onlinePaymentsNotSetUp')}
                  </div>
                ) : (
                  <div className="px-4 py-2 bg-emerald-50 dark:bg-transparent border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 self-start">
                    <CheckCircle2 size={16} />
                    {t('tenantDashboard.balanceClear')}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xxs font-semibold text-slate-500 dark:text-slate-400 gap-2">
                <span>{t('tenantDashboard.lease', { start: currentTenant?.leaseStart ?? '', end: currentTenant?.leaseEnd || t('tenantDashboard.ongoing') })}</span>
              </div>

            </div>

            {/* Right mini KPI widgets */}
            <div className="flex flex-col gap-4">
              {/* KPI 1: Active Requests */}
              <div
                onClick={onOpenServiceRequests}
                className="flex-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between group cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">{t('tenantDashboard.activeRequests')}</span>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">{t('tenantDashboard.openCount', { count: activeRequestsCount })}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center text-amber-500">
                  <Zap size={20} />
                </div>
              </div>

              {/* KPI 2: Lease Status */}
              <div className="flex-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">{t('tenantDashboard.leaseStatus')}</span>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {remainingMonths !== null ? t('tenantDashboard.monthsLeft', { count: remainingMonths }) : (currentTenant?.status ? enumLabel(locale, currentTenant.status) : t('tenantDashboard.unknown'))}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-500/15 flex items-center justify-center text-sky-500">
                  <Clock size={20} />
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Grid: Recent Payments & Lease Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Recent Payments Panel */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {t('tenantDashboard.recentPayments')}
                  </h3>
                </div>

                <div className="space-y-3.5">
                  {recentPayments.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onOpenInvoice(p.id)}
                      className="flex justify-between items-center p-2.5 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30 rounded-lg cursor-pointer transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                            {p.month}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                            {t('tenantDashboard.paidOn', { date: p.datePaid ?? '' })}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {formatMoney(p.totalDue)}
                      </span>
                    </div>
                  ))}
                  {recentPayments.length === 0 && (
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 text-center py-6">
                      {t('dashboard.noPaidInvoices')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Lease Documents panel */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {t('unitConfig.leaseDocuments')}
                  </h3>
                </div>

                <div className="space-y-3">
                  {(currentUnit.leaseDocs ?? []).map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 rounded-lg border border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText size={16} className="text-slate-400" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{doc.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{doc.size} • {doc.date}</p>
                        </div>
                      </div>
                      <Download size={14} className="text-slate-400 shrink-0" />
                    </div>
                  ))}
                  {(!currentUnit.leaseDocs || currentUnit.leaseDocs.length === 0) && (
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 text-center py-6">
                      {t('tenantDashboard.noLeaseDocuments')}
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
