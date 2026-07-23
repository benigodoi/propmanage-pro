/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check, X } from 'lucide-react';
import { passwordRules } from '../lib/password';

export default function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
      {passwordRules.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 text-xs ${
              met ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {met ? <Check size={12} /> : <X size={12} />}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
