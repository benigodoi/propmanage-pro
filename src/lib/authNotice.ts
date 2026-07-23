/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Carries a one-shot notice across a forced sign-out / redirect so
// LoginScreen can explain why the user landed back here.
export const AUTH_NOTICE_KEY = 'propmanage_auth_notice';
export type AuthNotice = 'inactivity' | 'password-reset';
