/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastState {
  message: string;
  variant: ToastVariant;
}

interface ToastProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

const VARIANT_STYLES: Record<ToastVariant, { icon: React.ElementType; classes: string }> = {
  success: {
    icon: CheckCircle,
    classes: 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300',
  },
  error: {
    icon: AlertCircle,
    classes: 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300',
  },
  info: {
    icon: Info,
    classes: 'bg-slate-50 dark:bg-slate-900/90 border-line text-ink-soft',
  },
};

export default function Toast({ toast, onDismiss }: ToastProps) {
  const { t } = useLocalization();
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const { icon: Icon, classes } = VARIANT_STYLES[toast.variant];

  return (
    <div className="fixed top-6 right-6 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
      <div className={`flex items-start gap-3 max-w-sm px-4 py-3 rounded-xl border shadow-lg text-xs font-semibold ${classes}`}>
        <Icon size={16} className="shrink-0 mt-0.5" />
        <p className="leading-snug">{toast.message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 -mr-1 -mt-0.5 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          title={t('common.dismiss')}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
