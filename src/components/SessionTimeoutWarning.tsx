/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Clock } from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';

interface SessionTimeoutWarningProps {
  seconds: number;
  onStayActive: () => void;
}

export default function SessionTimeoutWarning({ seconds, onStayActive }: SessionTimeoutWarningProps) {
  const { t } = useLocalization();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl text-center">
        <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
          <Clock size={18} className="text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          {t('session.stillThere')}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t('session.signOutWarning')} <span className="font-bold">{seconds}s</span>.
        </p>
        <button
          type="button"
          onClick={onStayActive}
          className="mt-5 w-full py-2.5 bg-slate-950 hover:bg-slate-900 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider"
        >
          {t('session.staySignedIn')}
        </button>
      </div>
    </div>
  );
}
