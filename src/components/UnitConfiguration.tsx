/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Euro,
  Trash2,
  Plus,
  Mail,
  Phone,
  Calendar,
  Download,
  FileText,
  Check
} from 'lucide-react';
import { Unit, UtilityItem } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { enumLabel } from '../lib/i18n';

interface UnitConfigurationProps {
  unit: Unit;
  onSave: (updatedUnit: Unit) => void;
  onClose: () => void;
  onDelete: (unit: Unit) => void;
  onNotify: (message: string) => void;
}

export default function UnitConfiguration({
  unit,
  onSave,
  onClose,
  onDelete,
  onNotify,
}: UnitConfigurationProps) {
  const { t, locale, currency, formatMoney } = useLocalization();

  // Local States mirroring Unit fields
  const [baseRent, setBaseRent] = useState<number>(unit.baseRent);
  const [utilities, setUtilities] = useState<UtilityItem[]>(unit.utilities);
  const [newUtilityName, setNewUtilityName] = useState('');
  const [newUtilityAmount, setNewUtilityAmount] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if unit changes
  useEffect(() => {
    setBaseRent(unit.baseRent);
    setUtilities(unit.utilities);
    setSaveSuccess(false);
  }, [unit]);

  // Calculations
  const totalUtilities = utilities.reduce((sum, u) => sum + u.amount, 0);
  const totalProjection = baseRent + totalUtilities;

  // Handlers
  const handleAddUtility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUtilityName || newUtilityAmount <= 0) return;

    const newItem: UtilityItem = {
      id: `util-new-${Date.now()}`,
      name: newUtilityName,
      amount: newUtilityAmount,
    };

    setUtilities([...utilities, newItem]);
    setNewUtilityName('');
    setNewUtilityAmount(0);
    setShowAddForm(false);
  };

  const handleDeleteUtility = (id: string) => {
    setUtilities(utilities.filter(u => u.id !== id));
  };

  const handleSave = () => {
    const updated: Unit = {
      ...unit,
      baseRent,
      utilities,
    };
    onSave(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200/50 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-ink-faint">
            <span>{t('sidebar.properties')}</span>
            <span>&gt;</span>
            <span>{unit.propertyName}</span>
            <span>&gt;</span>
            <span className="text-ink-secondary">{t('dashboard.unitLabel', { unit: unit.unitNumber })}</span>
          </div>
          <h2 className="text-2xl font-semibold text-ink mt-1">
            {t('unitConfig.title', { unit: unit.unitNumber })}
          </h2>
          <p className="text-ink-muted text-xs mt-1">
            {t('unitConfig.summary', { property: unit.propertyName, bedrooms: unit.bedrooms, bathrooms: unit.bathrooms, sqft: unit.sqft })}
          </p>
        </div>

        {/* Buttons top right */}
        <div className="flex gap-2">
          <button
            id="btn-delete-unit"
            type="button"
            onClick={() => onDelete(unit)}
            className="px-4 py-2 bg-white dark:bg-transparent border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/20 text-danger rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer"
          >
            <Trash2 size={14} /> {t('unitConfig.deleteUnit')}
          </button>
          <button
            id="btn-save-configuration"
            type="button"
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-primary hover:bg-primary-hover text-on-primary'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check size={14} /> {t('unitConfig.saved')}
              </>
            ) : (
              t('unitConfig.saveConfiguration')
            )}
          </button>
        </div>
      </div>

      {/* Main double column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column: Financial Configuration (occupies 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-line rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-ink mb-6 pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
              {t('unitConfig.financialConfig')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-6">

                {/* Rent Field */}
                <div>
                  <label htmlFor="base-monthly-rent" className="block text-xs font-medium text-ink-faint mb-1.5">
                    {t('unitConfig.baseMonthlyRent')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-ink-muted">
                      <Euro size={14} />
                    </span>
                    <input
                      id="base-monthly-rent"
                      type="number"
                      value={baseRent}
                      onChange={(e) => setBaseRent(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 bg-field border border-line rounded-lg text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                  {currency !== 'EUR' && (
                    <p className="text-xs text-ink-faint mt-1">{t('unitConfig.convertedHint', { amount: formatMoney(baseRent) })}</p>
                  )}
                </div>

                {/* Separator Notice Box */}
                <div className="p-4 bg-subtle border border-line-subtle rounded-lg text-xs text-ink-muted font-medium leading-relaxed">
                  <span className="font-semibold text-ink-soft block mb-1">ℹ️ {t('unitConfig.notice')}:</span>
                  {t('unitConfig.noticeBody')}
                </div>
              </div>

              {/* Projection Box */}
              <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800 p-6 rounded-xl flex flex-col justify-between h-full">
                <div>
                  <span className="text-xs font-medium text-ink-faint">
                    {t('unitConfig.totalMonthlyProjection')}
                  </span>
                  <p className="text-4xl font-semibold text-ink tracking-tight mt-2 font-sans">
                    {formatMoney(totalProjection)}
                  </p>
                </div>
                <div className="border-t border-zinc-200/60 dark:border-zinc-800 pt-4 mt-4 space-y-2 text-xs font-semibold text-ink-secondary">
                  <div className="flex justify-between">
                    <span>{t('unitConfig.baseRent')}</span>
                    <span className="tabular-nums text-ink">{formatMoney(baseRent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('unitConfig.selectedUtilities')}</span>
                    <span className="tabular-nums text-ink">{formatMoney(totalUtilities)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Utilities and Add-ons Sub-list */}
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/60">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-ink">
                  {t('unitConfig.utilitiesAddons')}
                </h4>

                {!showAddForm && (
                  <button
                    id="btn-add-utility-toggle"
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="text-xs text-primary-ink font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> {t('unitConfig.addUtilityOrFee')}
                  </button>
                )}
              </div>

              {/* Inline Add Utility Form */}
              {showAddForm && (
                <form onSubmit={handleAddUtility} className="mb-4 p-4 bg-subtle rounded-lg flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[120px]">
                    <label htmlFor="new-utility-name" className="block text-xs font-medium text-ink-faint mb-1">{t('unitConfig.name')}</label>
                    <input
                      id="new-utility-name"
                      type="text"
                      required
                      placeholder={t('unitConfig.utilityNamePlaceholder')}
                      value={newUtilityName}
                      onChange={(e) => setNewUtilityName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-line rounded text-xs focus:outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <label htmlFor="new-utility-amount" className="block text-xs font-medium text-ink-faint mb-1">{t('unitConfig.amountEur')}</label>
                    <input
                      id="new-utility-amount"
                      type="number"
                      required
                      min="1"
                      value={newUtilityAmount || ''}
                      onChange={(e) => setNewUtilityAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-line rounded text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1.5 bg-primary text-on-primary rounded text-xs font-semibold hover:bg-primary-hover">{t('unitConfig.add')}</button>
                    <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-ink-secondary rounded text-xs">{t('common.cancel')}</button>
                  </div>
                </form>
              )}

              {/* Interactive utilities list */}
              <div className="space-y-2 max-w-md">
                {utilities.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 border border-line rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-ink-soft font-semibold text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums font-semibold text-xs text-zinc-950 dark:text-white">{formatMoney(item.amount)}</span>
                      <button
                        id={`btn-delete-utility-${item.id}`}
                        type="button"
                        onClick={() => handleDeleteUtility(item.id)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded transition-colors"
                        title={t('unitConfig.deleteUtility')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {utilities.length === 0 && (
                  <p className="text-xs font-medium text-ink-faint py-2">
                    {t('unitConfig.noUtilities')}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right column: Active Tenant and Lease Docs */}
        <div className="space-y-6">

          {/* Tenant block */}
          {unit.activeTenant ? (
            <div className="bg-surface border border-line rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-medium text-ink-faint mb-4">
                {t('unitConfig.activeTenant')}
              </h3>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center text-sm">
                  {unit.activeTenant.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink">
                    {unit.activeTenant.name}
                  </h4>
                  <p className="text-xs font-medium text-ink-faint">
                    {t('unitConfig.leaseStatus', { status: enumLabel(locale, unit.activeTenant.status) })}
                  </p>
                </div>
              </div>

              {/* Metadata block */}
              <div className="space-y-3.5 text-xs font-semibold text-ink-secondary border-t border-b border-zinc-100 dark:border-zinc-800/60 py-4 mb-4">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-ink-faint shrink-0" />
                  <span className="truncate">{unit.activeTenant.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-ink-faint shrink-0" />
                  <span>{unit.activeTenant.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-ink-faint shrink-0" />
                  <span>{unit.activeTenant.leaseStart} - {unit.activeTenant.leaseEnd}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-line rounded-xl p-5 shadow-sm text-center">
              <h3 className="text-xs font-medium text-ink-faint mb-4 text-left">
                {t('unitConfig.activeTenant')}
              </h3>
              <p className="text-xs font-semibold text-ink-secondary">{t('unitConfig.noActiveTenant')}</p>
            </div>
          )}

          {/* Lease Documents block */}
          <div className="bg-surface border border-line rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-medium text-ink-faint mb-4">
              {t('unitConfig.leaseDocuments')}
            </h3>

            <div className="space-y-2.5">
              {unit.leaseDocs?.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2 hover:bg-subtle rounded-lg border border-transparent hover:border-line-subtle transition-all cursor-pointer"
                  onClick={() => onNotify(t('unitConfig.downloadingDocument', { name: doc.name }))}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-ink-faint" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-white truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-ink-faint font-medium">
                        {t('unitConfig.docMeta', { size: doc.size, date: doc.date })}
                      </p>
                    </div>
                  </div>
                  <span className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-ink-muted rounded transition-colors shrink-0">
                    <Download size={14} />
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
