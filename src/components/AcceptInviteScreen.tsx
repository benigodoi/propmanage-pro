/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { User, Lock, Building2, Sun, Moon } from 'lucide-react';
import { Theme } from '../types';
import { getMyProfile, updateMyProfile, updatePassword } from '../lib/api/profile';
import { supabase } from '../lib/supabaseClient';
import { isPasswordValid } from '../lib/password';
import PasswordChecklist from './PasswordChecklist';
import { useLocalization } from '../contexts/LocalizationContext';

interface AcceptInviteScreenProps {
  theme: Theme;
  userEmail: string;
  onThemeToggle: () => void;
  onDone: () => void;
}

// An invite lands here in one of two states, depending on how the invite
// was created:
// - A profile already exists (an admin pre-assigned org_id/role, e.g. via
//   the manual SQL step for adding a teammate to an existing org) — the
//   invitee just sets their name and password.
// - No profile exists yet (a plain invite with no metadata, meant for an
//   independent new customer) — the invitee names their own organization,
//   which calls the same create_organization RPC self-serve signup uses.
export default function AcceptInviteScreen({ theme, userEmail, onThemeToggle, onDone }: AcceptInviteScreenProps) {
  const { t } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [isNewOrg, setIsNewOrg] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [existingPhone, setExistingPhone] = useState('');

  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((profile) => {
        setOrgName(profile.orgName);
        setFullName(profile.fullName ?? '');
        setExistingPhone(profile.phone ?? '');
      })
      .catch(() => {
        // No profile row yet — this invite is for a brand-new, independent
        // organization rather than a seat in an existing one.
        setIsNewOrg(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isNewOrg && !orgName.trim()) {
      setError(t('invite.enterOrgName'));
      return;
    }
    if (!fullName.trim()) {
      setError(t('invite.enterYourName'));
      return;
    }
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
      if (isNewOrg) {
        const { error: rpcError } = await supabase.rpc('create_organization', { org_name: orgName.trim() });
        if (rpcError) throw rpcError;
        await updateMyProfile({ fullName: fullName.trim(), phone: '' });
      } else {
        await updateMyProfile({ fullName: fullName.trim(), phone: existingPhone });
      }
      await updatePassword(newPassword);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('invite.setupFailed'));
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
          className="p-1.5 rounded-lg text-ink-muted hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-center"
          title={theme === 'light' ? t('header.switchToDark') : t('header.switchToLight')}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} className="text-amber-400" />}
        </button>
      </div>

      <div className="w-full max-w-md my-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink font-sans">
            {!isNewOrg && orgName ? t('invite.welcomeTo', { orgName }) : t('invite.welcome')}
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">
            {userEmail ? t('invite.finishSetupFor', { email: userEmail }) : t('invite.finishSetup')}
          </p>
        </div>

        <div className="bg-surface border border-line rounded-xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-400 animate-pulse" />

          {loading ? (
            <p className="text-sm text-ink-muted text-center py-4">{t('invite.loadingInvite')}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-danger bg-danger-soft border border-red-200 dark:border-red-900/50 rounded-lg">
                  {error}
                </div>
              )}

              {isNewOrg && (
                <div>
                  <label htmlFor="invite-org-name" className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">
                    {t('invite.orgNameLabel')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-ink-faint">
                      <Building2 size={16} />
                    </span>
                    <input
                      id="invite-org-name"
                      type="text"
                      required
                      placeholder="Acme Property Management"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-field border border-line rounded-lg text-ink placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="invite-full-name" className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">
                  {t('invite.yourName')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-ink-faint">
                    <User size={16} />
                  </span>
                  <input
                    id="invite-full-name"
                    type="text"
                    required
                    placeholder="Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-field border border-line rounded-lg text-ink placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="invite-new-password" className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">
                  {t('invite.choosePassword')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-ink-faint">
                    <Lock size={16} />
                  </span>
                  <input
                    id="invite-new-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-field border border-line rounded-lg text-ink placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="invite-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">
                  {t('settings.confirmPassword')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-ink-faint">
                    <Lock size={16} />
                  </span>
                  <input
                    id="invite-confirm-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-field border border-line rounded-lg text-ink placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              {newPassword.length > 0 && <PasswordChecklist password={newPassword} />}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-md bg-primary hover:bg-primary-hover text-on-primary cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? t('invite.settingUp') : t('invite.completeSetup')}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="w-full max-w-md mt-6" />
    </div>
  );
}
