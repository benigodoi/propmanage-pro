/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';

export interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

interface ConfirmDialogProps {
  state: ConfirmDialogState | null;
  onCancel: () => void;
}

export default function ConfirmDialog({ state, onCancel }: ConfirmDialogProps) {
  const { t } = useLocalization();
  // Guards against a double-click firing onConfirm twice before the dialog
  // has a chance to unmount (its close happens on the next render, not
  // synchronously with this click).
  const firedRef = useRef(false);
  useEffect(() => {
    firedRef.current = false;
  }, [state]);

  if (!state) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-surface rounded-xl border border-line max-w-sm w-full p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-ink mb-2">{state.title}</h3>
        <p className="text-xs text-ink-muted leading-relaxed">{state.message}</p>

        <div className="flex gap-2 pt-6 mt-2">
          <button
            type="button"
            onClick={() => {
              if (firedRef.current) return;
              firedRef.current = true;
              state.onConfirm();
              onCancel();
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer ${
              state.danger
                ? 'bg-red-500 hover:bg-red-400 text-white'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
            }`}
          >
            {state.confirmLabel ?? t('common.confirm')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-muted text-ink-soft rounded-lg hover:bg-slate-200 text-xs font-bold uppercase cursor-pointer"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
