/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, Bell, Settings, Sun, Moon } from 'lucide-react';
import { Persona, Theme } from '../types';
import React, { useState } from 'react';

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
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const displayName = currentUserName && currentUserName.trim().length > 0 ? currentUserName : currentUserEmail;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-6 gap-4">

        {/* Left: Search Bar */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
              <Search size={18} />
            </span>
            <input
              id="search-portfolio"
              type="text"
              placeholder={persona === 'owner' ? 'Search portfolio...' : 'Search portal...'}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* Theme Toggle */}
          <button
            id="theme-toggle"
            type="button"
            onClick={onThemeToggle}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-amber-400" />}
          </button>

          {/* Notifications Panel */}
          <div className="relative">
            <button
              id="btn-notifications"
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors relative cursor-pointer"
            >
              <Bell size={20} />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="flex justify-between items-center px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Notifications</span>
                </div>
                <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  No notifications yet.
                </div>
              </div>
            )}
          </div>

          {/* Settings button */}
          <button
            id="btn-settings"
            type="button"
            onClick={onSettingsClick}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings size={20} />
          </button>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-3">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {displayName}
              </p>
              <p className="text-xxs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {persona === 'owner' ? 'Admin / Owner' : 'Tenant'}
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
                Add Property
              </button>
            ) : (
              <button
                id="btn-service-request-header"
                type="button"
                onClick={onServiceRequestClick}
                className="ml-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Service Request
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
