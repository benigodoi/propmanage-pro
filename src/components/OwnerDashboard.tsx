/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Percent,
  DollarSign,
  AlertCircle,
  Building2,
  CheckCircle2,
  CircleDashed,
  Clock,
  Home,
  Plus,
  KeyRound,
  Trash2,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Property, Tenant, Unit, Payment, ServiceRequest } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { enumLabel } from '../lib/i18n';

type AttentionKind = 'overdue' | 'service' | 'partial' | 'awaiting';

interface AttentionItem {
  key: string;
  kind: AttentionKind;
  title: string;
  detail: string;
  /** Amount still owed, for payment items. */
  amount?: number;
  onClick: () => void;
}

const MAX_ATTENTION_ITEMS = 5;
const RECENT_PAYMENTS_COUNT = 5;

const WARNING_TONE = 'bg-warning-soft text-warning';

const ATTENTION_STYLE: Record<AttentionKind, { icon: LucideIcon; tone: string }> = {
  overdue: { icon: AlertCircle, tone: 'bg-danger-soft text-danger' },
  service: { icon: Wrench, tone: WARNING_TONE },
  partial: { icon: CircleDashed, tone: WARNING_TONE },
  awaiting: { icon: Clock, tone: 'bg-muted text-ink-secondary' },
};

// Status is never colour-alone: each badge pairs an icon with its label.
const PAYMENT_STATUS_STYLE: Record<Payment['status'], { icon: LucideIcon; tone: string }> = {
  Paid: { icon: CheckCircle2, tone: 'bg-success-soft text-success' },
  Partial: { icon: CircleDashed, tone: WARNING_TONE },
  Overdue: { icon: AlertCircle, tone: 'bg-danger-soft text-danger' },
  Pending: { icon: Clock, tone: 'bg-muted text-ink-secondary' },
};

interface OwnerDashboardProps {
  properties: Property[];
  units: Unit[];
  payments: Payment[];
  tenants: Tenant[];
  serviceRequests: ServiceRequest[];
  onOpenInvoice: (paymentId: string) => void;
  onOpenServiceRequests: () => void;
  onViewAllPayments: () => void;
  onAddPropertyClick: () => void;
  onAddTenantClick: () => void;
  onInviteToPortalClick: (tenant: Tenant) => void;
  onDeleteTenantClick: (tenant: Tenant) => void;
}

export default function OwnerDashboard({
  properties,
  units,
  payments,
  tenants,
  serviceRequests,
  onOpenInvoice,
  onOpenServiceRequests,
  onViewAllPayments,
  onAddPropertyClick,
  onAddTenantClick,
  onInviteToPortalClick,
  onDeleteTenantClick,
}: OwnerDashboardProps) {
  const { t, locale, formatMoney } = useLocalization();
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'tenants'>('overview');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Real billed-per-month chart, grouped from actual payments (most recent
  // 6 distinct billing months present in the data, oldest to newest).
  const chartData = useMemo(() => {
    const totalsByMonth = new Map<string, number>();
    payments.forEach((p) => {
      totalsByMonth.set(p.month, (totalsByMonth.get(p.month) ?? 0) + p.totalDue);
    });
    return Array.from(totalsByMonth.entries())
      .slice(0, 6)
      .reverse()
      .map(([month, revenue]) => ({ month, revenue }));
  }, [payments]);

  const maxRevenue = Math.max(1, ...chartData.map(d => d.revenue));
  // Round the axis up to 1, 2, 2.5 or 5 x 10^n so the ticks are distinct
  // (rounding each tick to the nearest 1000 collapsed small portfolios).
  const axisMax = useMemo(() => {
    const magnitude = 10 ** Math.floor(Math.log10(maxRevenue));
    const step = [1, 2, 2.5, 5, 10].find((m) => m * magnitude >= maxRevenue) ?? 10;
    return step * magnitude;
  }, [maxRevenue]);
  const axisTicks = [1, 0.75, 0.5, 0.25, 0].map((f) => axisMax * f);

  // Needs attention, most actionable first: overdue rent (oldest month
  // first), new service requests (newest first), partial payments, then
  // current-month payments not yet received. Future months aren't due.
  const attentionItems = useMemo<AttentionItem[]>(() => {
    const where = (p: Payment) =>
      t('dashboard.tenantAtUnit', { tenant: p.tenantName, property: p.propertyName, unit: p.unitNumber });
    const byMonthAsc = (a: Payment, b: Payment) => a.monthIso.localeCompare(b.monthIso);
    const now = Date.now();

    const overdue = payments.filter((p) => p.status === 'Overdue').sort(byMonthAsc).map<AttentionItem>((p) => ({
      key: `overdue:${p.id}`,
      kind: 'overdue',
      title: t('dashboard.rentOverdue', { month: p.month }),
      detail: where(p),
      amount: p.totalDue,
      onClick: () => onOpenInvoice(p.id),
    }));
    const requests = serviceRequests
      .filter((sr) => sr.status === 'Pending')
      .sort((a, b) => b.dateCreated.localeCompare(a.dateCreated))
      .map<AttentionItem>((sr) => ({
        key: `sr:${sr.id}`,
        kind: 'service',
        title: t('notifications.srNew'),
        detail: t('dashboard.requestDetail', { title: sr.title, property: sr.propertyName, unit: sr.unitNumber }),
        onClick: onOpenServiceRequests,
      }));
    const partial = payments.filter((p) => p.status === 'Partial').sort(byMonthAsc).map<AttentionItem>((p) => ({
      key: `partial:${p.id}`,
      kind: 'partial',
      title: t('dashboard.partiallyPaid', { month: p.month }),
      detail: where(p),
      amount: Math.max(0, p.totalDue - (p.partialAmountPaid ?? 0)),
      onClick: () => onOpenInvoice(p.id),
    }));
    const awaiting = payments
      .filter((p) => p.status === 'Pending' && new Date(p.monthIso).getTime() <= now)
      .sort(byMonthAsc)
      .map<AttentionItem>((p) => ({
        key: `awaiting:${p.id}`,
        kind: 'awaiting',
        title: t('dashboard.awaitingPayment', { month: p.month }),
        detail: where(p),
        amount: p.totalDue,
        onClick: () => onOpenInvoice(p.id),
      }));
    return [...overdue, ...requests, ...partial, ...awaiting];
  }, [payments, serviceRequests, t, onOpenInvoice, onOpenServiceRequests]);

  // Recent payments: the latest billing months, then tenant name for a stable order.
  const recentPayments = useMemo(
    () =>
      [...payments]
        .sort((a, b) => b.monthIso.localeCompare(a.monthIso) || a.tenantName.localeCompare(b.tenantName))
        .slice(0, RECENT_PAYMENTS_COUNT),
    [payments],
  );

  // Headline metrics computed live from real data.
  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => !!u.activeTenant).length;
  const overallOccupancy = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  const monthlyRevenue = properties.reduce((sum, p) => sum + p.monthlyRevenue, 0);
  const pendingPayments = payments.filter(p => p.status === 'Pending' || p.status === 'Overdue');
  const pendingTotal = pendingPayments.reduce((sum, p) => sum + p.totalDue, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Title & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink font-sans">
            {t('dashboard.title')}
          </h2>
          <p className="text-ink-muted text-sm mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Overview Tab bar */}
        <div role="group" aria-label={t('dashboard.title')} className="flex bg-muted p-1 rounded-lg self-start">
          <button
            id="tab-overview"
            type="button"
            aria-pressed={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-surface dark:bg-zinc-700 text-ink shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            {t('dashboard.tabOverview')}
          </button>
          <button
            id="tab-financials"
            type="button"
            aria-pressed={activeTab === 'financials'}
            onClick={() => setActiveTab('financials')}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'financials'
                ? 'bg-surface dark:bg-zinc-700 text-ink shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            {t('dashboard.tabFinancials')}
          </button>
          <button
            id="tab-tenants"
            type="button"
            aria-pressed={activeTab === 'tenants'}
            onClick={() => setActiveTab('tenants')}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'tenants'
                ? 'bg-surface dark:bg-zinc-700 text-ink shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            {t('dashboard.tabTenants')}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-surface border border-line p-6 rounded-xl shadow-card">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-ink-muted">
              {t('dashboard.totalUnits')}
            </span>
            <span className="text-ink-faint">
              <Home size={14} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-semibold text-ink tracking-tight tabular-nums">{totalUnits}</span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-ink-muted font-medium">
              <span>{t(properties.length === 1 ? 'dashboard.acrossOneProperty' : 'dashboard.acrossProperties', { count: properties.length })}</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface border border-line p-6 rounded-xl shadow-card">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-ink-muted">
              {t('dashboard.occupancyRate')}
            </span>
            <span className="text-ink-faint">
              <Percent size={14} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-semibold text-ink tracking-tight tabular-nums">{overallOccupancy}%</span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-ink-muted font-medium">
              <span>{t('dashboard.unitsOccupied', { occupied: occupiedUnits, total: totalUnits })}</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-surface border border-line p-6 rounded-xl shadow-card">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-ink-muted">
              {t('dashboard.revenueMonthly')}
            </span>
            <span className="text-ink-faint">
              <DollarSign size={14} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-semibold text-ink tracking-tight tabular-nums">{formatMoney(monthlyRevenue)}</span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-ink-muted font-medium">
              <span>{t('dashboard.fromOccupiedUnits')}</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-surface border border-line p-6 rounded-xl shadow-card">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-ink-muted">
              {t('dashboard.pendingPayments')}
            </span>
            <span className="text-ink-faint">
              <AlertCircle size={14} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-semibold text-ink tracking-tight tabular-nums">{pendingPayments.length}</span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs font-medium">
              {pendingPayments.length > 0 && (
                <span className="shrink-0 inline-flex items-center gap-1 h-5 px-2 rounded-full bg-danger-soft text-danger">
                  <AlertCircle size={12} />
                  {t('dashboard.actionRequired')}
                </span>
              )}
              <span className="text-ink-muted">{t('dashboard.total')}: {formatMoney(pendingTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Main Content Grid: Chart & Needs attention */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

            {/* Chart Widget */}
            <div className="xl:col-span-3 min-w-0 bg-surface border border-line p-6 rounded-xl shadow-card">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-medium text-ink">
                  {t('dashboard.revenueHistory')}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-ink-secondary font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span>{t('dashboard.revenue')}</span>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="flex gap-3">
                  {/* Y-axis labels, centred on their gridlines */}
                  <div aria-hidden="true" className="relative h-56 shrink-0 text-xs text-ink-muted tabular-nums text-right">
                    {axisTicks.map((v, i) => (
                      <span key={i} className="block absolute right-0 -translate-y-1/2 whitespace-nowrap" style={{ top: `${(i / (axisTicks.length - 1)) * 100}%` }}>
                        {formatMoney(v)}
                      </span>
                    ))}
                    {/* Reserve the widest label's width */}
                    <span className="invisible block whitespace-nowrap">{formatMoney(axisMax)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="relative h-56 border-b border-line">
                      {[0, 25, 50, 75].map((top) => (
                        <div key={top} className="absolute inset-x-0 border-t border-dashed border-line" style={{ top: `${top}%` }} />
                      ))}
                      <div className="absolute inset-0 flex justify-around items-end gap-0.5">
                        {chartData.map((d, index) => {
                          const isHovered = hoveredBar === index;
                          return (
                            <div
                              key={d.month}
                              role="img"
                              tabIndex={0}
                              aria-label={`${d.month}: ${formatMoney(d.revenue)}`}
                              className="relative h-full flex-1 flex justify-center items-end cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                              onMouseEnter={() => setHoveredBar(index)}
                              onMouseLeave={() => setHoveredBar(null)}
                              onFocus={() => setHoveredBar(index)}
                              onBlur={() => setHoveredBar(null)}
                            >
                              {isHovered && (
                                <div
                                  className="absolute left-1/2 -translate-x-1/2 -translate-y-full -mt-2 bg-zinc-900 dark:bg-zinc-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-lg z-30 whitespace-nowrap tabular-nums"
                                  style={{ top: `${100 - (d.revenue / axisMax) * 100}%` }}
                                >
                                  {d.month}: {formatMoney(d.revenue)}
                                </div>
                              )}
                              <div
                                className={`w-3/5 max-w-11 rounded-t transition-colors ${isHovered ? 'bg-primary-hover' : 'bg-primary'}`}
                                style={{ height: `${(d.revenue / axisMax) * 100}%` }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex justify-around gap-0.5 mt-2">
                      {chartData.map((d) => (
                        <span key={d.month} className="flex-1 text-center text-xs text-ink-muted">
                          {d.month.split(' ')[0].slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-sm text-ink-muted">
                  {t('dashboard.noBilledPayments')}
                </div>
              )}
            </div>

            {/* Needs attention: overdue rent, new service requests, partial and awaiting payments */}
            <section aria-labelledby="needs-attention-title" className="xl:col-span-2 min-w-0 bg-surface border border-line rounded-xl shadow-card flex flex-col overflow-hidden">
              <div className="flex justify-between items-center px-5 pt-5 pb-3">
                <h3 id="needs-attention-title" className="text-sm font-medium text-ink">
                  {t('dashboard.needsAttention')}
                </h3>
                {attentionItems.length > 0 && (
                  <span className="text-xs text-ink-muted">
                    {t(attentionItems.length === 1 ? 'dashboard.attentionCountOne' : 'dashboard.attentionCount', { count: attentionItems.length })}
                  </span>
                )}
              </div>

              {attentionItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 border-t border-line-subtle">
                  <span className="h-10 w-10 rounded-full bg-success-soft text-success flex items-center justify-center mb-3">
                    <CheckCircle2 size={20} />
                  </span>
                  <p className="text-sm font-medium text-ink">{t('dashboard.allCaughtUp')}</p>
                  <p className="text-xs text-ink-muted mt-1">{t('dashboard.allCaughtUpDetail')}</p>
                </div>
              ) : (
                <ul className="flex-1">
                  {attentionItems.slice(0, MAX_ATTENTION_ITEMS).map((item) => {
                    const { icon: Icon, tone } = ATTENTION_STYLE[item.kind];
                    return (
                      <li key={item.key} className="border-t border-line-subtle">
                        <button
                          type="button"
                          onClick={item.onClick}
                          className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-subtle transition-colors cursor-pointer"
                        >
                          <span className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${tone}`}>
                            <Icon size={16} />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="flex items-baseline justify-between gap-3">
                              <span className="text-sm font-medium text-ink">{item.title}</span>
                              {item.amount !== undefined && (
                                <span className="shrink-0 text-sm font-semibold text-ink tabular-nums whitespace-nowrap">
                                  {formatMoney(item.amount)}
                                </span>
                              )}
                            </span>
                            <span className="block text-xs text-ink-muted mt-0.5 line-clamp-2">{item.detail}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {attentionItems.length > MAX_ATTENTION_ITEMS && (
                    <li className="border-t border-line-subtle px-5 py-3">
                      <button type="button" onClick={onViewAllPayments} className="text-xs font-medium text-primary-ink hover:underline cursor-pointer">
                        {t('dashboard.attentionMore', { count: attentionItems.length - MAX_ATTENTION_ITEMS })}
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </section>

          </div>

          {properties.length === 0 ? (
            /* Empty portfolio: point the owner at the first step. */
            <div className="bg-surface border border-line rounded-xl shadow-card text-center py-12">
              <Building2 className="mx-auto text-ink-faint mb-2" size={32} />
              <p className="text-sm font-semibold text-ink-secondary">{t('dashboard.noPropertiesYet')}</p>
              <button
                type="button"
                onClick={onAddPropertyClick}
                className="mt-2 text-xs font-semibold text-primary-ink hover:underline cursor-pointer"
              >
                {t('dashboard.createFirstProperty')}
              </button>
            </div>
          ) : (
            /* Recent payments: the latest billing records across the portfolio */
            <section aria-labelledby="recent-payments-title" className="bg-surface border border-line rounded-xl shadow-card overflow-hidden">
              <div className="flex justify-between items-center gap-3 px-5 py-4">
                <h3 id="recent-payments-title" className="text-sm font-medium text-ink">
                  {t('dashboard.recentPayments')}
                </h3>
                <button type="button" onClick={onViewAllPayments} className="text-xs font-medium text-primary-ink hover:underline cursor-pointer">
                  {t('dashboard.viewAll')}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-subtle text-xs font-medium text-ink-muted border-y border-line-subtle">
                      <th scope="col" className="px-5 py-2.5 font-medium">{t('dashboard.colTenant')}</th>
                      <th scope="col" className="px-5 py-2.5 font-medium">{t('dashboard.colUnit')}</th>
                      <th scope="col" className="px-5 py-2.5 font-medium">{t('dashboard.colPeriod')}</th>
                      <th scope="col" className="px-5 py-2.5 font-medium text-right">{t('dashboard.colAmount')}</th>
                      <th scope="col" className="px-5 py-2.5 font-medium">{t('dashboard.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-subtle">
                    {recentPayments.map((p) => {
                      const { icon: StatusIcon, tone } = PAYMENT_STATUS_STYLE[p.status];
                      return (
                        <tr
                          key={p.id}
                          onClick={() => onOpenInvoice(p.id)}
                          className="hover:bg-subtle transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-3 font-medium text-ink whitespace-nowrap">
                            {/* The row is clickable for mouse users; this button is the keyboard path. */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenInvoice(p.id);
                              }}
                              className="hover:underline cursor-pointer text-left"
                            >
                              {p.tenantName}
                            </button>
                          </td>
                          <td className="px-5 py-3 text-ink-muted whitespace-nowrap">
                            {t('dashboard.unitShort', { property: p.propertyName, unit: p.unitNumber })}
                          </td>
                          <td className="px-5 py-3 text-ink-muted whitespace-nowrap">{p.month}</td>
                          <td className="px-5 py-3 text-right tabular-nums whitespace-nowrap text-ink">
                            {p.status === 'Partial' ? (
                              <>
                                {formatMoney(p.partialAmountPaid ?? 0)}{' '}
                                <span className="text-ink-muted">/ {formatMoney(p.totalDue)}</span>
                              </>
                            ) : (
                              formatMoney(p.totalDue)
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 h-6 px-2 rounded-full text-xs font-medium whitespace-nowrap ${tone}`}>
                              <StatusIcon size={12} />
                              {enumLabel(locale, p.status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {recentPayments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-sm text-ink-muted">
                          {t('dashboard.noPaymentsYet')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {activeTab === 'financials' && (
        <div className="bg-surface border border-line p-6 rounded-xl shadow-card space-y-6">
          <div>
            <h3 className="text-sm font-medium text-ink">
              {t('dashboard.billedVsCollected')}
            </h3>
            <p className="text-xs text-ink-faint mt-1">
              {t('dashboard.financialsNote')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-subtle border border-line-subtle rounded-lg">
              <span className="text-xs font-medium text-ink-faint">{t('dashboard.totalBilled')}</span>
              <p className="text-2xl font-semibold text-ink mt-1">
                {formatMoney(payments.reduce((sum, p) => sum + p.totalDue, 0))}
              </p>
            </div>
            <div className="p-4 bg-subtle border border-line-subtle rounded-lg">
              <span className="text-xs font-medium text-ink-faint">{t('dashboard.totalCollected')}</span>
              <p className="text-2xl font-semibold text-success mt-1">
                {formatMoney(payments.reduce((sum, p) => sum + (p.status === 'Paid' ? p.totalDue : p.status === 'Partial' ? (p.partialAmountPaid ?? 0) : 0), 0))}
              </p>
            </div>
            <div className="p-4 bg-subtle border border-line-subtle rounded-lg">
              <span className="text-xs font-medium text-ink-faint">{t('dashboard.outstanding')}</span>
              <p className="text-2xl font-semibold text-red-500 mt-1">
                {formatMoney(pendingTotal)}
              </p>
            </div>
          </div>
          <div className="border-t border-line-subtle pt-6">
            <h4 className="text-sm font-medium text-ink mb-4">{t('dashboard.byProperty')}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-subtle text-ink-faint font-medium border-b border-line-subtle">
                    <th className="px-4 py-2">{t('dashboard.property')}</th>
                    <th className="px-4 py-2">{t('dashboard.billed')}</th>
                    <th className="px-4 py-2">{t('dashboard.collected')}</th>
                    <th className="px-4 py-2">{t('dashboard.outstanding')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {properties.map((prop) => {
                    const propPayments = payments.filter(p => p.propertyName === prop.name);
                    const billed = propPayments.reduce((sum, p) => sum + p.totalDue, 0);
                    const collected = propPayments.reduce((sum, p) => sum + (p.status === 'Paid' ? p.totalDue : p.status === 'Partial' ? (p.partialAmountPaid ?? 0) : 0), 0);
                    return (
                      <tr key={prop.id}>
                        <td className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-300">{prop.name}</td>
                        <td className="px-4 py-3 tabular-nums">{formatMoney(billed)}</td>
                        <td className="px-4 py-3 text-success tabular-nums font-semibold">{formatMoney(collected)}</td>
                        <td className="px-4 py-3 text-danger tabular-nums font-semibold">{formatMoney(billed - collected)}</td>
                      </tr>
                    );
                  })}
                  {properties.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-ink-faint font-semibold">
                        {t('dashboard.noPropertiesYetShort')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tenants' && (
        <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-line-subtle flex justify-between items-center">
            <h3 className="text-sm font-medium text-ink">
              {t('dashboard.tenantRegistry')}
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-ink-faint bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-full">
                {t('dashboard.activeLeases', { count: tenants.length })}
              </span>
              <button
                type="button"
                onClick={onAddTenantClick}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-on-primary rounded-lg text-sm font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> {t('dashboard.addTenant')}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-subtle text-ink-faint font-medium border-b border-line-subtle">
                  <th className="px-6 py-3">{t('dashboard.tenantName')}</th>
                  <th className="px-6 py-3">{t('dashboard.propertyUnit')}</th>
                  <th className="px-6 py-3">{t('dashboard.leaseStart')}</th>
                  <th className="px-6 py-3">{t('dashboard.leaseEnd')}</th>
                  <th className="px-6 py-3">{t('dashboard.status')}</th>
                  <th className="px-6 py-3">{t('dashboard.portalAccess')}</th>
                  <th className="px-6 py-3 text-center">{t('dashboard.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle font-medium">
                {tenants.map((tn) => (
                  <tr key={tn.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-ink">{tn.name}</p>
                        <p className="text-xs text-ink-faint mt-0.5">{tn.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-zinc-800 dark:text-zinc-300 font-semibold">{tn.propertyName}</p>
                      <p className="text-xs text-ink-faint">{t('dashboard.unitLabel', { unit: tn.unitNumber })}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink-muted">{tn.leaseStart}</td>
                    <td className="px-4 py-3 tabular-nums text-ink-muted">{tn.leaseEnd}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        {enumLabel(locale, tn.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {tn.hasPortalAccess ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                          {t('dashboard.hasAccess')}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-ink-muted">
                            {t('dashboard.noAccess')}
                          </span>
                          <button
                            type="button"
                            onClick={() => onInviteToPortalClick(tn)}
                            className="text-xs font-semibold text-primary-ink hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <KeyRound size={11} /> {t('dashboard.inviteToPortal')}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteTenantClick(tn)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded transition-colors cursor-pointer"
                        title={t('dashboard.removeTenant')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
