/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check, X } from 'lucide-react';
import { passwordRules, PASSWORD_MIN_LENGTH } from '../lib/password';
import { useLocalization } from '../contexts/LocalizationContext';

export default function PasswordChecklist({ password }: { password: string }) {
  const { t } = useLocalization();
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
      {passwordRules.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 text-xs ${
              met ? 'text-success' : 'text-ink-faint'
            }`}
          >
            {met ? <Check size={12} /> : <X size={12} />}
            {t(`password.rule.${rule.id}`, { min: PASSWORD_MIN_LENGTH })}
          </li>
        );
      })}
    </ul>
  );
}
