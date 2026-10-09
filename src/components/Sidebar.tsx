/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LayoutDashboard,
  Building,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  FolderOpen,
  Wrench,
  Settings
} from 'lucide-react';
import { Persona, OwnerScreen, TenantScreen } from '../types';
import React from 'react';
import { useLocalization } from '../contexts/LocalizationContext';

interface SidebarProps {
  persona: Persona;
  currentUserEmail: string;
  currentUserName: string | null;
  activeOwnerScreen: OwnerScreen;
  activeTenantScreen: TenantScreen;
  onOwnerScreenChange: (s: OwnerScreen) => void;
  onTenantScreenChange: (s: TenantScreen) => void;
  onLogout: () => void;
  onGenerateReportClick: () => void;
  onServiceRequestClick: () => void;
  /** Owner only: shown as a badge on the Service Requests nav item. */
  pendingServiceRequestCount?: number;
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

export default function Sidebar({
  persona,
  currentUserEmail,
  currentUserName,
  activeOwnerScreen,
  activeTenantScreen,
  onOwnerScreenChange,
  onTenantScreenChange,
  onLogout,
  onGenerateReportClick,
  onServiceRequestClick,
  pendingServiceRequestCount = 0,
}: SidebarProps) {
  const { t } = useLocalization();
  const displayName = currentUserName && currentUserName.trim().length > 0 ? currentUserName : currentUserEmail;

  const handleNavClick = (screen: any) => {
    if (persona === 'owner') {
      onOwnerScreenChange(screen as OwnerScreen);
    } else {
      onTenantScreenChange(screen as TenantScreen);
    }
  };

  const ownerNavItems = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
    { id: 'properties', label: t('sidebar.properties'), icon: Building },
    { id: 'payments', label: t('sidebar.payments'), icon: CreditCard },
    { id: 'service-requests', label: t('sidebar.serviceRequests'), icon: Wrench, badge: pendingServiceRequestCount },
    { id: 'reports', label: t('sidebar.reports'), icon: FileText },
  ];

  const tenantNavItems: { id: string; label: string; icon: typeof Wrench; badge?: number }[] = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
    { id: 'property-details', label: t('sidebar.propertyDetails'), icon: Building },
    { id: 'payments', label: t('sidebar.payments'), icon: CreditCard },
    { id: 'documents', label: t('sidebar.documents'), icon: FolderOpen },
  ];

  const currentNavItems = persona === 'owner' ? ownerNavItems : tenantNavItems;
  const currentActiveScreen = persona === 'owner' ? activeOwnerScreen : activeTenantScreen;

  return (
    <aside className="w-70 flex flex-col justify-between h-screen bg-[#faf8f9] dark:bg-[#020617] border-r border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 transition-colors duration-200">
      
      {/* Top Section */}
      <div className="flex flex-col">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200/50 dark:border-slate-800/50">
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            PropManage Pro
          </span>
        </div>

        {/* Profile Info block */}
        <div className="p-4 mx-3 my-4 bg-white dark:bg-[#0f172a] border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold flex items-center justify-center text-sm ring-2 ring-slate-100 dark:ring-slate-800">
            {initialsFor(currentUserName, currentUserEmail)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {displayName}
            </p>
            <p className="text-xxs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide truncate">
              {persona === 'owner' ? t('sidebar.propertyManager') : t('sidebar.tenant')}
            </p>
          </div>
        </div>

        {/* Nav list */}
        <nav className="px-3 space-y-1">
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentActiveScreen === item.id;
            return (
              <button
                id={`sidebar-nav-${item.id}`}
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-200/80 dark:bg-sky-950/45 text-slate-950 dark:text-sky-400 border-l-4 border-slate-900 dark:border-sky-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-slate-900 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'} />
                {item.label}
                {!!item.badge && (
                  <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-white text-xxs font-extrabold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 flex flex-col gap-4">
        
        {/* Dynamic CTA box */}
        {persona === 'owner' ? (
          <button
            id="sidebar-cta-generate-reports"
            type="button"
            onClick={onGenerateReportClick}
            className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-900 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-center shadow-sm cursor-pointer"
          >
            {t('sidebar.generateReports')}
          </button>
        ) : (
          <button
            id="sidebar-cta-service-request"
            type="button"
            onClick={onServiceRequestClick}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-center shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Wrench size={14} />
            {t('sidebar.serviceRequest')}
          </button>
        )}

        {/* Footer actions */}
        <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-4 space-y-1">
          <button
            id="sidebar-footer-settings"
            type="button"
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all cursor-pointer ${
              currentActiveScreen === 'settings' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : ''
            }`}
          >
            <Settings size={16} />
            {t('sidebar.settings')}
          </button>

          <button
            id="sidebar-footer-help"
            type="button"
            onClick={() => handleNavClick('help')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all cursor-pointer ${
              currentActiveScreen === 'help' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : ''
            }`}
          >
            <HelpCircle size={16} />
            {t('sidebar.helpCenter')}
          </button>

          <button
            id="sidebar-footer-logout"
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-left cursor-pointer"
          >
            <LogOut size={16} />
            {t('sidebar.logOut')}
          </button>
        </div>
      </div>
      
    </aside>
  );
}
