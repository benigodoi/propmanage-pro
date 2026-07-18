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
  ShieldAlert, 
  FolderOpen,
  Wrench
} from 'lucide-react';
import { Persona, OwnerScreen, TenantScreen } from '../types';
import React from 'react';

interface SidebarProps {
  persona: Persona;
  activeOwnerScreen: OwnerScreen;
  activeTenantScreen: TenantScreen;
  onOwnerScreenChange: (s: OwnerScreen) => void;
  onTenantScreenChange: (s: TenantScreen) => void;
  onLogout: () => void;
  onGenerateReportClick: () => void;
  onServiceRequestClick: () => void;
}

export default function Sidebar({
  persona,
  activeOwnerScreen,
  activeTenantScreen,
  onOwnerScreenChange,
  onTenantScreenChange,
  onLogout,
  onGenerateReportClick,
  onServiceRequestClick,
}: SidebarProps) {
  
  const handleNavClick = (screen: any) => {
    if (persona === 'owner') {
      onOwnerScreenChange(screen as OwnerScreen);
    } else {
      onTenantScreenChange(screen as TenantScreen);
    }
  };

  const ownerNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'properties', label: 'Properties', icon: Building },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const tenantNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'property-details', label: 'Property Details', icon: Building },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
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
          <img
            src={persona === 'owner'
              ? 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120'
              : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
            }
            alt="User avatar"
            referrerPolicy="no-referrer"
            className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {persona === 'owner' ? 'Alex Thompson' : 'Alex Chen'}
            </p>
            <p className="text-xxs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide truncate">
              {persona === 'owner' ? 'PROPERTY MANAGER' : 'Tenant | Unit 402'}
            </p>
            <p className="text-xxs font-medium text-slate-500 dark:text-slate-400 truncate">
              {persona === 'owner' ? 'Admin Account' : 'Oakwood Lofts'}
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
            Generate Reports
          </button>
        ) : (
          <button
            id="sidebar-cta-service-request"
            type="button"
            onClick={onServiceRequestClick}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-center shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Wrench size={14} />
            Service Request
          </button>
        )}

        {/* Footer actions */}
        <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-4 space-y-1">
          <button
            id="sidebar-footer-help"
            type="button"
            onClick={() => handleNavClick('help')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all cursor-pointer ${
              currentActiveScreen === 'help' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : ''
            }`}
          >
            <HelpCircle size={16} />
            Help Center
          </button>
          
          <button
            id="sidebar-footer-logout"
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-left cursor-pointer"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </div>
      
    </aside>
  );
}
