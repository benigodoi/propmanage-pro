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
      <div className="w-full max-w-sm bg-surface border border-line rounded-xl p-6 shadow-xl text-center">
        <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
          <Clock size={18} className="text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-sm font-medium text-ink">
          {t('session.stillThere')}
        </h2>
        <p className="mt-2 text-sm text-ink-secondary">
          {t('session.signOutWarning')} <span className="font-semibold">{seconds}s</span>.
        </p>
        <button
          type="button"
          onClick={onStayActive}
          className="mt-5 w-full py-2.5 bg-primary hover:bg-primary-hover text-on-primary rounded-lg text-sm font-medium"
        >
          {t('session.staySignedIn')}
        </button>
      </div>
    </div>
  );
}
