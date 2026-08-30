/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import en from './en';
import ro from './ro';
import type { Locale } from './translate';

export type { Locale, Dictionary } from './translate';
export { translate } from './translate';

export const dictionaries: Record<Locale, typeof en> = { en, ro };

const statusLabels: Record<Locale, Record<string, string>> = {
  en: {
    Paid: 'Paid',
    Overdue: 'Overdue',
    Pending: 'Pending',
    Partial: 'Partial',
    Active: 'Active',
    Terminated: 'Terminated',
    'In Progress': 'In Progress',
    Completed: 'Completed',
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    hvac: 'HVAC',
    appliance: 'Appliance',
    general: 'General',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    rent: 'Rent',
    utilities: 'Utilities',
  },
  ro: {
    Paid: 'Plătit',
    Overdue: 'Restant',
    Pending: 'În așteptare',
    Partial: 'Parțial',
    Active: 'Activ',
    Terminated: 'Încheiat',
    'In Progress': 'În lucru',
    Completed: 'Finalizat',
    plumbing: 'Instalații sanitare',
    electrical: 'Electricitate',
    hvac: 'HVAC',
    appliance: 'Electrocasnice',
    general: 'General',
    low: 'Scăzută',
    medium: 'Medie',
    high: 'Ridicată',
    rent: 'Chirie',
    utilities: 'Utilități',
  },
};

/** Translates a literal DB/domain enum value (status, category, priority, breakdown item) for display only — never use this for values that feed back into comparisons or storage. */
export function enumLabel(locale: Locale, value: string): string {
  return statusLabels[locale][value] ?? value;
}
