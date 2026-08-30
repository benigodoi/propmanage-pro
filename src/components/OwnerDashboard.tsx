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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
            {t('dashboard.title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Overview Tab bar */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200/40 dark:border-slate-800 self-start">
          <button
            id="tab-overview"
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-slate-950 dark:bg-sky-400 text-white dark:text-slate-950 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {t('dashboard.tabOverview')}
          </button>
          <button
            id="tab-financials"
            type="button"
            onClick={() => setActiveTab('financials')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'financials'
                ? 'bg-slate-950 dark:bg-sky-400 text-white dark:text-slate-950 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {t('dashboard.tabFinancials')}
          </button>
          <button
            id="tab-tenants"
            type="button"
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'tenants'
                ? 'bg-slate-950 dark:bg-sky-400 text-white dark:text-slate-950 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {t('dashboard.tabTenants')}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {t('dashboard.totalUnits')}
            </span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded text-emerald-600 dark:text-emerald-400">
              <Home size={14} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{totalUnits}</span>
            <div className="flex items-center gap-1.5 mt-2 text-xxs text-slate-500 dark:text-slate-400 font-medium">
              <span>{t(properties.length === 1 ? 'dashboard.acrossOneProperty' : 'dashboard.acrossProperties', { count: properties.length })}</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {t('dashboard.occupancyRate')}
            </span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded text-emerald-600 dark:text-emerald-400">
              <Percent size={14} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{overallOccupancy}%</span>
            <div className="flex items-center gap-1.5 mt-2 text-xxs text-slate-500 dark:text-slate-400 font-medium">
              <span>{t('dashboard.unitsOccupied', { occupied: occupiedUnits, total: totalUnits })}</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {t('dashboard.revenueMonthly')}
            </span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded text-emerald-600 dark:text-emerald-400">
              <DollarSign size={14} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{formatMoney(monthlyRevenue)}</span>
            <div className="flex items-center gap-1.5 mt-2 text-xxs text-slate-500 dark:text-slate-400 font-medium">
              <span>{t('dashboard.fromOccupiedUnits')}</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {t('dashboard.pendingPayments')}
            </span>
            <span className="p-1.5 bg-rose-50 dark:bg-rose-950/30 rounded text-rose-600 dark:text-rose-400">
              <AlertCircle size={14} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-red-600 dark:text-red-400 tracking-tight">{pendingPayments.length}</span>
            <div className="flex items-center gap-2 mt-2 text-xxs font-medium">
              {pendingPayments.length > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-bold rounded">
                  {t('dashboard.actionRequired')}
                </span>
              )}
              <span className="text-slate-500 dark:text-slate-400">{t('dashboard.total')}: {formatMoney(pendingTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Main Content Grid: Chart & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Chart Widget */}
            <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {t('dashboard.revenueHistory')}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-950 dark:bg-sky-400" />
                  <span>{t('dashboard.revenue')}</span>
                </div>
              </div>

              {/* Custom SVG Chart with full responsiveness and Hover Effects */}
              <div className="relative h-64 w-full flex items-end pt-6 pb-2 px-2">

                {/* Y-Axis lines and markers */}
                <div className="absolute inset-y-0 left-0 right-0 flex flex-col justify-between pointer-events-none text-slate-300 dark:text-slate-800">
                  <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full h-0" />
                  <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full h-0" />
                  <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full h-0" />
                  <div className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full h-0" />
                  <div className="border-b border-dashed border-slate-200 dark:border-slate-800/80 w-full h-0" />
                </div>

                {/* Left side labels */}
                <div className="absolute left-1 top-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex flex-col justify-between h-full py-2 pointer-events-none">
                  <span>{formatMoney(Math.round(maxRevenue / 1000) * 1000)}</span>
                  <span>{formatMoney(Math.round((maxRevenue * 0.75) / 1000) * 1000)}</span>
                  <span>{formatMoney(Math.round((maxRevenue * 0.5) / 1000) * 1000)}</span>
                  <span>{formatMoney(Math.round((maxRevenue * 0.25) / 1000) * 1000)}</span>
                  <span>{formatMoney(0)}</span>
                </div>

                {/* Bars Area */}
                {chartData.length > 0 ? (
                  <div className="w-full h-full flex justify-around items-end pl-10 relative z-10">
                    {chartData.map((d, index) => {
                      const heightPercent = (d.revenue / maxRevenue) * 90; // scale to 90% max height
                      const isHovered = hoveredBar === index;
                      return (
                        <div
                          key={d.month}
                          className="flex flex-col items-center justify-end h-full group relative cursor-pointer"
                          style={{ width: '12%' }}
                          onMouseEnter={() => setHoveredBar(index)}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          {/* Interactive Tooltip popup */}
                          {isHovered && (
                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-950 dark:bg-slate-800 text-white text-xxs font-bold px-2.5 py-1.5 rounded shadow-lg z-30 flex flex-col items-center gap-0.5 animate-bounce whitespace-nowrap">
                              <span>{formatMoney(d.revenue)}</span>
                              <div className="w-2 h-2 bg-slate-950 dark:bg-slate-800 rotate-45 transform -translate-y-0.5 absolute -bottom-1" />
                            </div>
                          )}

                          {/* Bar Segment */}
                          <div
                            className={`w-full rounded-t-sm transition-all duration-300 relative overflow-hidden ${
                              isHovered ? 'bg-sky-600' : 'bg-slate-950 dark:bg-sky-400'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          {/* Label */}
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-3 block tracking-wide text-center">
                            {d.month.split(' ')[0].slice(0, 3).toUpperCase()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-semibold">
                    {t('dashboard.noBilledPayments')}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Sidebar Widget */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {t('dashboard.recentActivity')}
                </h3>
              </div>

              {/* Activity List */}
              <div className="space-y-4 flex-1">
                {recentActivity.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onOpenInvoice(p.id)}
                    className="flex justify-between items-center p-2.5 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30 rounded-lg cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
                        R
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                          {p.tenantName}
                        </p>
                        <p className="text-xxs font-medium text-slate-400 dark:text-slate-500 truncate">
                          {t('dashboard.unitAt', { unit: p.unitNumber, property: p.propertyName })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-sans">
                        +{formatMoney(p.totalDue)}
                      </p>
                      <p className="text-xxs font-medium text-slate-400 dark:text-slate-500">
                        {p.datePaid}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 text-center py-8">
                    {t('dashboard.noPaidInvoices')}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Portfolio Assets Table */}
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">

            {/* Header section */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {t('dashboard.portfolioAssets')}
              </h3>
              <div className="flex gap-2">
                <button type="button" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                  <SlidersHorizontal size={16} />
                </button>
                <button type="button" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                  <Download size={16} />
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-3">{t('dashboard.propertyAddress')}</th>
                    <th className="px-6 py-3">{t('dashboard.units')}</th>
                    <th className="px-6 py-3">{t('dashboard.occupancy')}</th>
                    <th className="px-6 py-3">{t('dashboard.monthlyRevenue')}</th>
                    <th className="px-6 py-3 text-right">{t('dashboard.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                  {properties.map((prop) => (
                    <tr
                      key={prop.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
                    >
                      <td className="px-6 py-4 flex items-center gap-4">
                        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                            {prop.name}
                          </p>
                          <p className="text-xxs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                            {prop.address}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                        {t('dashboard.unitsCount', { count: prop.unitsCount })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                prop.occupancyRate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${prop.occupancyRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {prop.occupancyRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white font-sans">
                        {formatMoney(prop.monthlyRevenue)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          id={`btn-manage-property-${prop.id}`}
                          type="button"
                          onClick={() => onSelectProperty(prop.id)}
                          className="px-3 py-1.5 rounded-md text-xxs font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
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
                <Building2 className="mx-auto text-slate-300 dark:text-slate-700 mb-2" size={32} />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('dashboard.noPropertiesYet')}</p>
                <button
                  type="button"
                  onClick={onAddPropertyClick}
                  className="mt-2 text-xs font-bold text-sky-500 hover:underline"
                >
                  {t('dashboard.createFirstProperty')}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'financials' && (
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('dashboard.billedVsCollected')}
            </h3>
            <p className="text-xxs text-slate-400 dark:text-slate-500 mt-1">
              {t('dashboard.financialsNote')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
              <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest">{t('dashboard.totalBilled')}</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formatMoney(payments.reduce((sum, p) => sum + p.totalDue, 0))}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
              <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest">{t('dashboard.totalCollected')}</span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatMoney(payments.reduce((sum, p) => sum + (p.status === 'Paid' ? p.totalDue : p.status === 'Partial' ? (p.partialAmountPaid ?? 0) : 0), 0))}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
              <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest">{t('dashboard.outstanding')}</span>
              <p className="text-2xl font-extrabold text-rose-500 mt-1">
                {formatMoney(pendingTotal)}
              </p>
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4">{t('dashboard.byProperty')}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase border-b border-slate-100 dark:border-slate-800">
                    <th className="px-4 py-2">{t('dashboard.property')}</th>
                    <th className="px-4 py-2">{t('dashboard.billed')}</th>
                    <th className="px-4 py-2">{t('dashboard.collected')}</th>
                    <th className="px-4 py-2">{t('dashboard.outstanding')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {properties.map((prop) => {
                    const propPayments = payments.filter(p => p.propertyName === prop.name);
                    const billed = propPayments.reduce((sum, p) => sum + p.totalDue, 0);
                    const collected = propPayments.reduce((sum, p) => sum + (p.status === 'Paid' ? p.totalDue : p.status === 'Partial' ? (p.partialAmountPaid ?? 0) : 0), 0);
                    return (
                      <tr key={prop.id}>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-300">{prop.name}</td>
                        <td className="px-4 py-3 font-mono">{formatMoney(billed)}</td>
                        <td className="px-4 py-3 text-emerald-600 font-mono font-semibold">{formatMoney(collected)}</td>
                        <td className="px-4 py-3 text-rose-500 font-mono font-semibold">{formatMoney(billed - collected)}</td>
                      </tr>
                    );
                  })}
                  {properties.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400 font-semibold">
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
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('dashboard.tenantRegistry')}
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xxs font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full uppercase">
                {t('dashboard.activeLeases', { count: tenants.length })}
              </span>
              <button
                type="button"
                onClick={onAddTenantClick}
                className="px-4 py-2 bg-slate-950 dark:bg-sky-400 hover:bg-slate-900 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> {t('dashboard.addTenant')}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-3">{t('dashboard.tenantName')}</th>
                  <th className="px-6 py-3">{t('dashboard.propertyUnit')}</th>
                  <th className="px-6 py-3">{t('dashboard.leaseStart')}</th>
                  <th className="px-6 py-3">{t('dashboard.leaseEnd')}</th>
                  <th className="px-6 py-3">{t('dashboard.status')}</th>
                  <th className="px-6 py-3">{t('dashboard.portalAccess')}</th>
                  <th className="px-6 py-3 text-center">{t('dashboard.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 font-medium">
                {tenants.map((tn) => (
                  <tr key={tn.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">{tn.name}</p>
                        <p className="text-xxs text-slate-400 mt-0.5">{tn.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800 dark:text-slate-300 font-bold">{tn.propertyName}</p>
                      <p className="text-xxs text-slate-400">{t('dashboard.unitLabel', { unit: tn.unitNumber })}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{tn.leaseStart}</td>
                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{tn.leaseEnd}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                        {enumLabel(locale, tn.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {tn.hasPortalAccess ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300">
                          {t('dashboard.hasAccess')}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {t('dashboard.noAccess')}
                          </span>
                          <button
                            type="button"
                            onClick={() => onInviteToPortalClick(tn)}
                            className="text-xxs font-bold text-sky-500 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <KeyRound size={11} /> {t('dashboard.inviteToPortal')}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
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
