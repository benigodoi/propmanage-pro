/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Wrench } from 'lucide-react';
import { ServiceRequest } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { enumLabel } from '../lib/i18n';

interface ServiceRequestsInboxProps {
  serviceRequests: ServiceRequest[];
  onUpdateStatus: (id: string, status: ServiceRequest['status']) => Promise<void>;
}

const STATUSES: ServiceRequest['status'][] = ['Pending', 'In Progress', 'Completed'];
const ALL_STATUSES = 'all';

export const serviceRequestStatusBadgeClass: Record<ServiceRequest['status'], string> = {
  Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  'In Progress': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300',
  Completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
};

// Owner-side view of tenant-submitted service requests. RLS already scopes
// the list to the admin's own org.
export default function ServiceRequestsInbox({ serviceRequests, onUpdateStatus }: ServiceRequestsInboxProps) {
  const { t, locale } = useLocalization();
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(
    () => serviceRequests.filter((r) => statusFilter === ALL_STATUSES || r.status === statusFilter),
    [serviceRequests, statusFilter],
  );

  const handleStatusChange = async (id: string, status: ServiceRequest['status']) => {
    setUpdatingId(id);
    try {
      await onUpdateStatus(id, status);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            {t('serviceRequests.title')}
          </h2>
          <p className="text-ink-muted text-sm mt-1">
            {t('serviceRequests.subtitle')}
          </p>
        </div>

        <select
          id="service-requests-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-surface border border-line rounded-lg text-xs font-semibold text-ink-soft cursor-pointer"
        >
          <option value={ALL_STATUSES}>{t('serviceRequests.allStatuses')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{enumLabel(locale, s)}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface border border-line rounded-xl shadow-card p-10 text-center text-sm text-ink-muted">
          {serviceRequests.length === 0 ? t('serviceRequests.empty') : t('serviceRequests.emptyFiltered')}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-surface border border-line rounded-xl shadow-card p-5 flex flex-col md:flex-row md:items-start gap-4"
            >
              <div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                <Wrench size={18} className="text-ink-muted" />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-sm text-ink">{req.title}</h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-zinc-600 dark:text-zinc-300">
                    {enumLabel(locale, req.category)}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${serviceRequestStatusBadgeClass[req.status]}`}>
                    {enumLabel(locale, req.status)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  {t('serviceRequests.unitLabel', { property: req.propertyName, unit: req.unitNumber })}
                </p>
                <p className="text-xs text-ink-faint">
                  {t('serviceRequests.submittedBy', {
                    name: req.tenantName || t('serviceRequests.unknownTenant'),
                    date: req.dateCreated,
                  })}
                </p>
                {req.description && (
                  <p className="text-sm text-ink-secondary pt-2 whitespace-pre-wrap">{req.description}</p>
                )}
              </div>

              <label className="flex flex-col gap-1 shrink-0">
                <span className="text-xs font-medium text-ink-faint">{t('serviceRequests.status')}</span>
                <select
                  value={req.status}
                  disabled={updatingId === req.id}
                  onChange={(e) => handleStatusChange(req.id, e.target.value as ServiceRequest['status'])}
                  className="px-3 py-2 bg-chrome border border-line rounded-lg text-xs font-semibold text-ink-soft cursor-pointer disabled:opacity-50"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{enumLabel(locale, s)}</option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
