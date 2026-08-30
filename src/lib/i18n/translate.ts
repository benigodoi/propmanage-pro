/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Locale = 'en' | 'ro';

// Nested string dictionary, e.g. { sidebar: { dashboard: 'Dashboard' } }
export interface Dictionary {
  [key: string]: string | Dictionary;
}

function lookup(dict: Dictionary, path: string): string | undefined {
  let node: string | Dictionary | undefined = dict;
  for (const part of path.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

/** Looks up `path` in `dict`; falls back to the raw key so a missing translation is visible instead of crashing. */
export function translate(dict: Dictionary, path: string, params?: Record<string, string | number>): string {
  const template = lookup(dict, path);
  if (template === undefined) return path;
  return interpolate(template, params);
}
