/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, Bell, Settings, Sun, Moon, Wrench, CheckCircle2, AlertTriangle, Clock, Banknote, Menu } from 'lucide-react';
import { Persona, Theme } from '../types';
import React, { useEffect, useRef, useState } from 'react';
import PreferencesSelector from './PreferencesSelector';
import { useLocalization } from '../contexts/LocalizationContext';
import {
  AppNotification,
  NotificationKind,
  loadSeenNotificationKeys,
  saveSeenNotificationKeys,
} from '../lib/notifications';

const notificationIcon: Record<NotificationKind, { icon: typeof Bell; className: string }> = {
  'sr-new': { icon: Wrench, className: 'text-amber-500' },
  'sr-in-progress': { icon: Clock, className: 'text-sky-500' },
  'sr-completed': { icon: CheckCircle2, className: 'text-emerald-500' },
  'payment-received': { icon: Banknote, className: 'text-emerald-500' },
  'payment-overdue': { icon: AlertTriangle, className: 'text-rose-500' },
  'payment-due': { icon: Clock, className: 'text-amber-500' },
};

interface HeaderProps {
  persona: Persona;
  theme: Theme;
  onThemeToggle: () => void;
  onAddPropertyClick: () => void;
  onServiceRequestClick: () => void;
  onSettingsClick: () => void;
  currentUserEmail: string;
  currentUserName: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  notifications: AppNotification[];
  onNotificationClick: (notification: AppNotification) => void;
  /** Opens the sidebar drawer (only shown below the lg breakpoint). */
  onMenuClick: () => void;
  menuOpen: boolean;
}

function initialsFor(name: string | null, email: string): string {
  if (name && name.trim().length > 0) {
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  return (email[0] ?? '?').toUpperCase();
}

export default function Header({
  persona,
  theme,
  onThemeToggle,
  onAddPropertyClick,
  onServiceRequestClick,
  onSettingsClick,
  currentUserEmail,
  currentUserName,
  searchQuery,
  onSearchChange,
  notifications,
  onNotificationClick,
  onMenuClick,
  menuOpen,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [seenKeys, setSeenKeys] = useState(() => loadSeenNotificationKeys(currentUserEmail));
  // Keys that were unread at the moment the panel opened — kept highlighted
  // while it's open, even though opening it marks them as seen.
  const [unreadAtOpen, setUnreadAtOpen] = useState<Set<string>>(new Set());
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { t, formatMoney } = useLocalization();

  const unreadCount = notifications.filter((n) => !seenKeys.has(n.key)).length;

  const openNotifications = () => {
    setUnreadAtOpen(new Set(notifications.filter((n) => !seenKeys.has(n.key)).map((n) => n.key)));
    const keys = notifications.map((n) => n.key);
    saveSeenNotificationKeys(currentUserEmail, keys);
    setSeenKeys(new Set(keys));
    setShowNotifications(true);
  };

  // Close on any click outside the bell/panel, or on Escape.
  useEffect(() => {
    if (!showNotifications) return;
    const onPointerDown = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowNotifications(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showNotifications]);

  const notificationText = (n: AppNotification): { title: string; detail: string } => {
    const sr = n.serviceRequest;
    const p = n.payment;
    switch (n.kind) {
      case 'sr-new':
        return {
          title: t('notifications.srNew'),
          detail: t('notifications.srDetailOwner', { title: sr!.title, property: sr!.propertyName, unit: sr!.unitNumber, tenant: sr!.tenantName }),
        };
      case 'sr-in-progress':
        return { title: t('notifications.srInProgress'), detail: sr!.title };
      case 'sr-completed':
        return { title: t('notifications.srCompleted'), detail: sr!.title };
      case 'payment-received':
      case 'payment-overdue':
      case 'payment-due': {
        const title = t(
          n.kind === 'payment-received' ? (persona === 'owner' ? 'notifications.paymentReceived' : 'notifications.paymentConfirmed')
            : n.kind === 'payment-overdue' ? 'notifications.paymentOverdue'
            : persona === 'owner' ? 'notifications.paymentAwaiting' : 'notifications.paymentDue',
        );
        const amount = formatMoney(n.kind === 'payment-received' && p!.status === 'Partial' ? (p!.partialAmountPaid ?? 0) : p!.totalDue);
        const detail = persona === 'owner'
          ? t('notifications.paymentDetailOwner', { tenant: p!.tenantName, month: p!.month, amount })
          : t('notifications.paymentDetailTenant', { month: p!.month, amount });
        return { title, detail };
      }
    }
  };

  const displayName = currentUserName && currentUserName.trim().length > 0 ? currentUserName : currentUserEmail;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-3 sm:px-6 gap-2 sm:gap-4">

        {/* Mobile menu toggle */}
        <button
          id="btn-open-menu"
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          aria-label={t('header.openMenu')}
          aria-controls="app-sidebar"
          aria-expanded={menuOpen}
        >
          <Menu size={20} />
        </button>

        {/* Left: Search Bar */}
        <div className="flex-1 min-w-0 max-w-lg">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
              <Search size={18} />
            </span>
            <input
              id="search-portfolio"
              type="text"
              placeholder={persona === 'owner' ? t('header.searchPortfolio') : t('header.searchPortal')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-3 sm:pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center shrink-0 gap-0.5 sm:gap-4">

          {/* Theme Toggle */}
          <button
            id="theme-toggle"
            type="button"
            onClick={onThemeToggle}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={theme === 'light' ? t('header.switchToDark') : t('header.switchToLight')}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-amber-400" />}
          </button>

          <PreferencesSelector />

          {/* Notifications Panel */}
          <div className="relative" ref={notificationsRef}>
            <button
              id="btn-notifications"
              type="button"
              onClick={() => (showNotifications ? setShowNotifications(false) : openNotifications())}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors relative cursor-pointer"
              title={t('header.notifications')}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="fixed left-3 right-3 top-16 max-h-[calc(100dvh-5rem)] flex flex-col sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 sm:max-h-none rounded-xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="flex justify-between items-center px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{t('header.notifications')}</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    {t('header.noNotifications')}
                  </div>
                ) : (
                  <ul className="min-h-0 flex-1 overflow-y-auto sm:max-h-96">
                    {notifications.map((n) => {
                      const { icon: Icon, className } = notificationIcon[n.kind];
                      const { title, detail } = notificationText(n);
                      const unread = unreadAtOpen.has(n.key);
                      return (
                        <li key={n.key}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNotifications(false);
                              onNotificationClick(n);
                            }}
                            className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                              unread ? 'bg-sky-50/60 dark:bg-sky-500/10' : ''
                            }`}
                          >
                            <Icon size={16} className={`shrink-0 mt-0.5 ${className}`} />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                                {title}
                                {unread && <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />}
                              </span>
                              <span className="block text-xxs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{detail}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Settings button */}
          <button
            id="btn-settings"
            type="button"
            onClick={onSettingsClick}
            className="hidden sm:block p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={t('header.settings')}
          >
            <Settings size={20} />
          </button>

          {/* User Profile Avatar */}
          <div className="hidden sm:flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-3">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {displayName}
              </p>
              <p className="text-xxs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {persona === 'owner' ? t('header.adminOwner') : t('header.tenant')}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold flex items-center justify-center text-xs ring-2 ring-slate-100 dark:ring-slate-800">
              {initialsFor(currentUserName, currentUserEmail)}
            </div>
          </div>

          {/* Header Actions for Quick UI Interactions */}
          <div className="hidden sm:block">
            {persona === 'owner' ? (
              <button
                id="btn-add-property-header"
                type="button"
                onClick={onAddPropertyClick}
                className="ml-2 px-4 py-2 bg-slate-950 dark:bg-sky-400 hover:bg-slate-900 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                {t('header.addProperty')}
              </button>
            ) : (
              <button
                id="btn-service-request-header"
                type="button"
                onClick={onServiceRequestClick}
                className="ml-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                {t('header.serviceRequest')}
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
