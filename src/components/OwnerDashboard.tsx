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
  SlidersHorizontal,
  Download,
  ChevronRight,
  Home,
  Plus,
  KeyRound,
  Trash2
} from 'lucide-react';
import { Property, Tenant, Unit, Payment } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { enumLabel } from '../lib/i18n';

interface OwnerDashboardProps {
  properties: Property[];
  units: Unit[];
  payments: Payment[];
  tenants: Tenant[];
  onSelectProperty: (propertyId: string) => void;
  onOpenInvoice: (paymentId: string) => void;
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
  onSelectProperty,
  onOpenInvoice,
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

  // Recent Activity: the 5 most recently paid real payments.
  const recentActivity = useMemo(() => {
    return payments
      .filter(p => p.status === 'Paid' && p.datePaid)
      .sort((a, b) => new Date(b.datePaid as string).getTime() - new Date(a.datePaid as string).getTime())
      .slice(0, 5);
  }, [payments]);

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
                : 'text-ink-muted hover:text-ink'
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
                : 'text-ink-muted hover:text-ink'
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
                : 'text-ink-muted hover:text-ink'
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
          {/* Main Content Grid: Chart & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Chart Widget */}
            <div className="lg:col-span-2 bg-surface border border-line p-6 rounded-xl shadow-card">
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

            {/* Recent Activity Sidebar Widget */}
            <div className="bg-surface border border-line p-6 rounded-xl shadow-card flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-medium text-ink">
                  {t('dashboard.recentActivity')}
                </h3>
              </div>

              {/* Activity List */}
              <div className="space-y-4 flex-1">
                {recentActivity.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onOpenInvoice(p.id)}
                    className="flex justify-between items-center p-2.5 border border-transparent hover:border-line-subtle hover:bg-zinc-50 dark:hover:bg-zinc-900/30 rounded-lg cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-success-soft flex items-center justify-center text-success text-xs font-semibold shrink-0">
                        R
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                          {p.tenantName}
                        </p>
                        <p className="text-xs font-medium text-ink-faint truncate">
                          {t('dashboard.unitAt', { unit: p.unitNumber, property: p.propertyName })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-success font-sans">
                        +{formatMoney(p.totalDue)}
                      </p>
                      <p className="text-xs font-medium text-ink-faint">
                        {p.datePaid}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-xs font-semibold text-ink-faint text-center py-8">
                    {t('dashboard.noPaidInvoices')}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Portfolio Assets Table */}
          <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-sm">

            {/* Header section */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-line-subtle">
              <h3 className="text-sm font-medium text-ink">
                {t('dashboard.portfolioAssets')}
              </h3>
              <div className="flex gap-2">
                <button type="button" className="p-1.5 rounded hover:bg-muted text-ink-muted transition-colors">
                  <SlidersHorizontal size={16} />
                </button>
                <button type="button" className="p-1.5 rounded hover:bg-muted text-ink-muted transition-colors">
                  <Download size={16} />
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-subtle text-xs font-medium text-ink-faint border-b border-line-subtle">
                    <th className="px-6 py-3">{t('dashboard.propertyAddress')}</th>
                    <th className="px-6 py-3">{t('dashboard.units')}</th>
                    <th className="px-6 py-3">{t('dashboard.occupancy')}</th>
                    <th className="px-6 py-3">{t('dashboard.monthlyRevenue')}</th>
                    <th className="px-6 py-3 text-right">{t('dashboard.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle text-xs">
                  {properties.map((prop) => (
                    <tr
                      key={prop.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group"
                    >
                      <td className="px-4 py-3 flex items-center gap-4">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-ink-secondary">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-ink group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                            {prop.name}
                          </p>
                          <p className="text-xs font-medium text-ink-faint mt-0.5">
                            {prop.address}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink-soft">
                        {t('dashboard.unitsCount', { count: prop.unitsCount })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                prop.occupancyRate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${prop.occupancyRate}%` }}
                            />
                          </div>
                          <span className="font-semibold text-ink-soft">
                            {prop.occupancyRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink font-sans">
                        {formatMoney(prop.monthlyRevenue)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          id={`btn-manage-property-${prop.id}`}
                          type="button"
                          onClick={() => onSelectProperty(prop.id)}
                          className="px-3 py-1.5 rounded-md text-xs font-medium bg-muted hover:bg-zinc-200 dark:hover:bg-zinc-700 text-ink-soft transition-colors cursor-pointer"
                        >
                          {t('dashboard.configureUnit')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty state helper if no properties */}
            {properties.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="mx-auto text-zinc-300 dark:text-zinc-700 mb-2" size={32} />
                <p className="text-sm font-semibold text-ink-secondary">{t('dashboard.noPropertiesYet')}</p>
                <button
                  type="button"
                  onClick={onAddPropertyClick}
                  className="mt-2 text-xs font-semibold text-indigo-500 hover:underline"
                >
                  {t('dashboard.createFirstProperty')}
                </button>
              </div>
            )}
          </div>
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
                        <td className="px-4 py-3 font-mono">{formatMoney(billed)}</td>
                        <td className="px-4 py-3 text-emerald-600 font-mono font-semibold">{formatMoney(collected)}</td>
                        <td className="px-4 py-3 text-red-500 font-mono font-semibold">{formatMoney(billed - collected)}</td>
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
                    <td className="px-4 py-3 font-mono text-ink-muted">{tn.leaseStart}</td>
                    <td className="px-4 py-3 font-mono text-ink-muted">{tn.leaseEnd}</td>
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
                            className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer"
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
