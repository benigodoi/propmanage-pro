/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Mirrors supabase/config.toml auth.minimum_password_length / password_requirements
// so client-side feedback never disagrees with what the server will accept.
export const PASSWORD_MIN_LENGTH = 10;

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  { id: 'length', label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: (p) => p.length >= PASSWORD_MIN_LENGTH },
  { id: 'lower', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'digit', label: 'One number', test: (p) => /\d/.test(p) },
];

export function isPasswordValid(password: string): boolean {
  return passwordRules.every((rule) => rule.test(password));
}
