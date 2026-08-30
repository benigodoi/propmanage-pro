/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Mirrors supabase/config.toml auth.minimum_password_length / password_requirements
// so client-side feedback never disagrees with what the server will accept.
export const PASSWORD_MIN_LENGTH = 10;

export interface PasswordRule {
  id: string;
  test: (password: string) => boolean;
}

// Display labels for these live in src/lib/i18n (password.rule.<id>), keyed by id.
export const passwordRules: PasswordRule[] = [
  { id: 'length', test: (p) => p.length >= PASSWORD_MIN_LENGTH },
  { id: 'lower', test: (p) => /[a-z]/.test(p) },
  { id: 'upper', test: (p) => /[A-Z]/.test(p) },
  { id: 'digit', test: (p) => /\d/.test(p) },
];

export function isPasswordValid(password: string): boolean {
  return passwordRules.every((rule) => rule.test(password));
}
