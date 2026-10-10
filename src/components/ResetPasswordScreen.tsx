/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, ShieldCheck, Sun, Moon } from 'lucide-react';
import { Theme } from '../types';
import { updatePassword } from '../lib/api/profile';
import { isPasswordValid } from '../lib/password';
import PasswordChecklist from './PasswordChecklist';
import { useLocalization } from '../contexts/LocalizationContext';

interface ResetPasswordScreenProps {
  theme: Theme;
  onThemeToggle: () => void;
  onDone: () => void;
}

export default function ResetPasswordScreen({ theme, onThemeToggle, onDone }: ResetPasswordScreenProps) {
  const { t } = useLocalization();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isPasswordValid(newPassword)) {
      setError(t('settings.passwordRequirementsNotMet'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('settings.passwordsDoNotMatch'));
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(newPassword);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.passwordUpdateFailed'));
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between items-center p-6 relative transition-colors duration-300"
      style={{
        backgroundImage: theme === 'dark'
          ? 'linear-gradient(rgba(15, 20, 24, 0.85), rgba(15, 20, 24, 0.95)), url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop")'
          : 'linear-gradient(rgba(252, 248, 250, 0.85), rgba(252, 248, 250, 0.95)), url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-md flex justify-end items-center select-none">
        <button
          type="button"
          onClick={onThemeToggle}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-center"
          title={theme === 'light' ? t('header.switchToDark') : t('header.switchToLight')}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} className="text-amber-400" />}
        </button>
      </div>

      <div className="w-full max-w-md my-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            {t('resetPassword.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t('resetPassword.subtitle')}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-400 animate-pulse" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/50 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="reset-new-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                {t('settings.newPassword')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  id="reset-new-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reset-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                {t('settings.confirmPassword')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  id="reset-confirm-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            {newPassword.length > 0 && <PasswordChecklist password={newPassword} />}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-md bg-slate-950 hover:bg-slate-900 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? t('common.saving') : t('resetPassword.submit')}
            </button>
          </form>
        </div>
      </div>

      <div className="w-full max-w-md flex justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 mt-6 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
        <span className="flex items-center gap-1">
          <ShieldCheck size={14} /> {t('resetPassword.sessionNote')}
        </span>
      </div>
    </div>
  );
}
