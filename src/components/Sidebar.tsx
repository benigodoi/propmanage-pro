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
  Settings,
  X,
  Home
} from 'lucide-react';
import { Persona, OwnerScreen, TenantScreen } from '../types';
import React, { useEffect, useRef, useState } from 'react';
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
  onServiceRequestClick: () => void;
  /** Owner only: shown as a badge on the Service Requests nav item. */
  pendingServiceRequestCount?: number;
  /** Below the lg breakpoint the sidebar is an off-canvas drawer. */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

// Matches Tailwind's `lg` breakpoint, where the drawer becomes a static sidebar.
const DESKTOP_QUERY = '(min-width: 1024px)';

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  onServiceRequestClick,
  pendingServiceRequestCount = 0,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const { t } = useLocalization();
  const asideRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isDesktop = useIsDesktop();
  const drawerOpen = mobileOpen && !isDesktop;
  const displayName = currentUserName && currentUserName.trim().length > 0 ? currentUserName : currentUserEmail;

  const handleNavClick = (screen: any) => {
    if (persona === 'owner') {
      onOwnerScreenChange(screen as OwnerScreen);
    } else {
      onTenantScreenChange(screen as TenantScreen);
    }
    onMobileClose();
  };

  // Growing past the breakpoint turns the drawer into the static sidebar, so
  // drop the open state rather than leaving the scroll lock behind.
  useEffect(() => {
    if (isDesktop && mobileOpen) onMobileClose();
  }, [isDesktop, mobileOpen, onMobileClose]);

  // While the drawer is open on mobile it behaves as a modal: focus moves into
  // it, Tab cycles within it, Escape closes it, the page behind doesn't scroll,
  // and focus returns to whatever opened it (the hamburger) on close.
  useEffect(() => {
    if (!drawerOpen) return;
    // Safari doesn't focus a button on click, so fall back to the toggle.
    const returnFocusTo =
      document.activeElement instanceof HTMLElement && document.activeElement !== document.body
        ? document.activeElement
        : document.querySelector<HTMLElement>('[aria-controls="app-sidebar"]');
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onMobileClose();
        return;
      }
      const aside = asideRef.current;
      if (e.key !== 'Tab' || !aside) return;
      const focusable = aside.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const outside = !aside.contains(active);
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
      returnFocusTo?.focus();
    };
  }, [drawerOpen, onMobileClose]);

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
    <>
    {/* Mobile backdrop */}
    <div
      aria-hidden="true"
      onClick={onMobileClose}
      className={`fixed inset-0 z-[41] bg-zinc-950/50 lg:hidden transition-opacity duration-200 ${
        mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    />
    <aside
      id="app-sidebar"
      ref={asideRef}
      // Off-screen on mobile when closed: keep its controls out of the tab order.
      inert={!isDesktop && !mobileOpen}
      role={drawerOpen ? 'dialog' : undefined}
      aria-modal={drawerOpen ? true : undefined}
      aria-label={drawerOpen ? t('header.openMenu') : undefined}
      className={`fixed inset-y-0 left-0 z-[42] w-64 max-w-[85vw] flex flex-col justify-between h-dvh overflow-y-auto bg-sidebar border-r border-line shrink-0 transition-[transform,background-color,border-color] duration-200 lg:sticky lg:top-0 lg:z-auto lg:max-w-none lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}
    >
      
      {/* Top Section */}
      <div className="flex flex-col gap-5 px-3 pt-3">
        {/* Brand */}
        <div className="h-12 flex items-center justify-between pl-2">
          <span className="flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <Home size={16} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-ink">PropManage Pro</span>
          </span>
          <button
            id="sidebar-close"
            ref={closeButtonRef}
            type="button"
            onClick={onMobileClose}
            className="lg:hidden h-11 w-11 flex items-center justify-center rounded-lg text-ink-muted hover:bg-muted transition-colors cursor-pointer"
            aria-label={t('sidebar.closeMenu')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav list */}
        <nav className="space-y-0.5">
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentActiveScreen === item.id;
            return (
              <button
                id={`sidebar-nav-${item.id}`}
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 min-h-11 lg:min-h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-primary-soft text-primary-ink'
                    : 'text-ink-muted hover:text-ink hover:bg-muted'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
                {item.label}
                {!!item.badge && (
                  <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 flex flex-col gap-3">

        {/* Tenant CTA: opens the service request form */}
        {persona === 'tenant' && (
          <button
            id="sidebar-cta-service-request"
            type="button"
            onClick={() => {
              onServiceRequestClick();
              onMobileClose();
            }}
            className="w-full h-11 lg:h-10 px-4 bg-primary hover:bg-primary-hover text-on-primary rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Wrench size={16} />
            {t('sidebar.serviceRequest')}
          </button>
        )}

        {/* Footer actions */}
        <div className="space-y-0.5">
          {([
            { id: 'settings', label: t('sidebar.settings'), icon: Settings },
            { id: 'help', label: t('sidebar.helpCenter'), icon: HelpCircle },
          ] as const).map(({ id, label, icon: Icon }) => {
            const isActive = currentActiveScreen === id;
            return (
              <button
                key={id}
                id={`sidebar-footer-${id}`}
                type="button"
                onClick={() => handleNavClick(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 min-h-11 lg:min-h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive ? 'bg-primary-soft text-primary-ink' : 'text-ink-muted hover:text-ink hover:bg-muted'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Profile + log out */}
        <div className="p-2.5 bg-surface border border-line rounded-xl shadow-card flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-primary-soft text-primary-ink font-semibold flex items-center justify-center text-xs">
            {initialsFor(currentUserName, currentUserEmail)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink truncate">{displayName}</p>
            <p className="text-xs text-ink-muted truncate">
              {persona === 'owner' ? t('sidebar.propertyManager') : t('sidebar.tenant')}
            </p>
          </div>
          <button
            id="sidebar-footer-logout"
            type="button"
            onClick={onLogout}
            aria-label={t('sidebar.logOut')}
            title={t('sidebar.logOut')}
            className="h-11 w-11 lg:h-9 lg:w-9 shrink-0 flex items-center justify-center rounded-lg text-ink-muted hover:text-danger hover:bg-danger-soft transition-colors cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

    </aside>
    </>
  );
}
