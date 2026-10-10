/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, Wrench } from 'lucide-react';
import { ServiceRequest } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { enumLabel } from '../lib/i18n';
import { serviceRequestStatusBadgeClass } from './ServiceRequestsInbox';

interface MyServiceRequestsModalProps {
  serviceRequests: ServiceRequest[];
  loading: boolean;
  onNewRequest: () => void;
  onClose: () => void;
}

// Tenant-side status view of their own requests (RLS scopes the list to
// tenant_id = auth.uid()). Read-only — only the owner changes status.
export default function MyServiceRequestsModal({
  serviceRequests,
  loading,
  onNewRequest,
  onClose,
}: MyServiceRequestsModalProps) {
  const { t, locale } = useLocalization();

  return (
    <div
      className="fixed inset-0 bg-zinc-950/70 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl border border-line max-w-lg w-full p-6 shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-ink mb-1">{t('serviceRequests.myTitle')}</h3>
            <p className="text-xs text-ink-muted">{t('serviceRequests.mySubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onNewRequest}
            className="shrink-0 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            {t('serviceRequests.newRequest')}
          </button>
        </div>

        <div className="mt-6 space-y-3 overflow-y-auto">
          {serviceRequests.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-8">
              {loading ? t('common.loading') : t('serviceRequests.myEmpty')}
            </p>
          ) : (
            serviceRequests.map((req) => (
              <div
                key={req.id}
                className="border border-line rounded-lg p-4 flex gap-3"
              >
                <div className="h-9 w-9 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                  <Wrench size={16} className="text-ink-muted" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm text-ink">{req.title}</h4>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${serviceRequestStatusBadgeClass[req.status]}`}>
                      {enumLabel(locale, req.status)}
                    </span>
                  </div>
                  <p className="text-xs text-ink-faint">
                    {enumLabel(locale, req.category)} · {t('serviceRequests.submittedOn', { date: req.dateCreated })}
                  </p>
                  {req.description && (
                    <p className="text-xs text-ink-secondary pt-1 whitespace-pre-wrap">{req.description}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-muted hover:bg-zinc-200 dark:hover:bg-zinc-700 text-ink-soft rounded-lg text-sm font-medium transition-all cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
