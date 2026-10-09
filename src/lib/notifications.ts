/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Payment, Persona, ServiceRequest } from '../types';

// Notifications are derived from data the app already loads (service
// requests + payments) rather than stored in their own table. Each one has a
// stable `key` that includes the record's current status, so a status change
// (e.g. a request moving to "In Progress") produces a new, unread
// notification. "Seen" state is just the set of keys already shown, kept in
// localStorage per user.

export type NotificationKind =
  | 'sr-new'
  | 'sr-in-progress'
  | 'sr-completed'
  | 'payment-received'
  | 'payment-overdue'
  | 'payment-due';

export interface AppNotification {
  key: string;
  kind: NotificationKind;
  /** Record the notification is about — a service request or payment id. */
  recordId: string;
  /** ISO date used for ordering (newest first). */
  date: string;
  serviceRequest?: ServiceRequest;
  payment?: Payment;
}

const RECENT_PAYMENT_DAYS = 30;
const MAX_NOTIFICATIONS = 20;

function daysAgo(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / 86_400_000;
}

export function buildNotifications(
  persona: Persona,
  serviceRequests: ServiceRequest[],
  payments: Payment[],
): AppNotification[] {
  const items: AppNotification[] = [];

  for (const sr of serviceRequests) {
    // Owners care about requests still waiting on them; tenants care about
    // progress the owner has made on theirs.
    let kind: NotificationKind | null = null;
    if (persona === 'owner' && sr.status === 'Pending') kind = 'sr-new';
    if (persona === 'tenant' && sr.status === 'In Progress') kind = 'sr-in-progress';
    if (persona === 'tenant' && sr.status === 'Completed') kind = 'sr-completed';
    if (kind) {
      items.push({ key: `sr:${sr.id}:${sr.status}`, kind, recordId: sr.id, date: sr.dateCreated, serviceRequest: sr });
    }
  }

  for (const p of payments) {
    if (p.status === 'Overdue') {
      items.push({ key: `pay:${p.id}:Overdue`, kind: 'payment-overdue', recordId: p.id, date: p.monthIso, payment: p });
    } else if ((p.status === 'Paid' || p.status === 'Partial') && p.datePaidIso && daysAgo(p.datePaidIso) <= RECENT_PAYMENT_DAYS) {
      items.push({ key: `pay:${p.id}:${p.status}`, kind: 'payment-received', recordId: p.id, date: p.datePaidIso, payment: p });
    } else if (p.status === 'Pending' && daysAgo(p.monthIso) >= 0) {
      // Only months that have started — future months aren't due yet.
      items.push({ key: `pay:${p.id}:Pending`, kind: 'payment-due', recordId: p.id, date: p.monthIso, payment: p });
    }
  }

  // Overdue payments are the most actionable, so they stay on top; the rest
  // are newest first.
  return items
    .sort((a, b) => {
      const aOverdue = a.kind === 'payment-overdue' ? 1 : 0;
      const bOverdue = b.kind === 'payment-overdue' ? 1 : 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;
      return b.date.localeCompare(a.date);
    })
    .slice(0, MAX_NOTIFICATIONS);
}

function seenStorageKey(userEmail: string): string {
  return `notifications-seen:${userEmail}`;
}

export function loadSeenNotificationKeys(userEmail: string): Set<string> {
  try {
    const raw = localStorage.getItem(seenStorageKey(userEmail));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

// Only the currently relevant keys are stored, so the set can't grow
// unbounded as old records drop out of the notification list.
export function saveSeenNotificationKeys(userEmail: string, keys: string[]): void {
  localStorage.setItem(seenStorageKey(userEmail), JSON.stringify(keys));
}
