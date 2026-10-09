/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { User, Mail, Lock, ShieldCheck, Loader2, Globe } from 'lucide-react';
import { Persona } from '../types';
import { getMyProfile, updateMyProfile, updateMyEmail, updatePassword } from '../lib/api/profile';
import { isPasswordValid } from '../lib/password';
import PasswordChecklist from './PasswordChecklist';
import { useLocalization } from '../contexts/LocalizationContext';
import type { Locale, CurrencyCode } from '../lib/api/profile';

interface SettingsScreenProps {
  persona: Persona;
  onProfileUpdated: () => void;
}

function FieldMessage({ message, tone }: { message: string; tone: 'success' | 'error' }) {
  return (
    <p className={`text-xs font-semibold mt-2 ${tone === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
      {message}
    </p>
  );
}

export default function SettingsScreen({ persona, onProfileUpdated }: SettingsScreenProps) {
  const { t, locale, currency, setLocale, setCurrency, rate } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  const [email, setEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    getMyProfile()
      .then((profile) => {
        setOrgName(profile.orgName);
        setFullName(profile.fullName ?? '');
        setPhone(profile.phone ?? '');
        setEmail(profile.email ?? '');
      })
      .catch((err) => {
        console.error('Failed to load profile', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      await updateMyProfile({ fullName, phone });
      setProfileMessage({ text: t('settings.profileUpdated'), tone: 'success' });
      onProfileUpdated();
    } catch (err) {
      setProfileMessage({ text: err instanceof Error ? err.message : t('settings.profileUpdateFailed'), tone: 'error' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSaving(true);
    setEmailMessage(null);
    try {
      await updateMyEmail(email);
      setEmailMessage({ text: t('settings.emailUpdated'), tone: 'success' });
      onProfileUpdated();
    } catch (err) {
      setEmailMessage({ text: err instanceof Error ? err.message : t('settings.emailUpdateFailed'), tone: 'error' });
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (!isPasswordValid(newPassword)) {
      setPasswordMessage({ text: t('settings.passwordRequirementsNotMet'), tone: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: t('settings.passwordsDoNotMatch'), tone: 'error' });
      return;
    }
    setPasswordSaving(true);
    try {
      await updatePassword(newPassword);
      setPasswordMessage({ text: t('settings.passwordUpdated'), tone: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage({ text: err instanceof Error ? err.message : t('settings.passwordUpdateFailed'), tone: 'error' });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('settings.title')}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Read-only context */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-500 shrink-0">
          <ShieldCheck size={20} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">{orgName || t('settings.organization')}</p>
          <p className="text-xxs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            {persona === 'owner' ? t('settings.adminAccount') : t('settings.tenantAccount')}
          </p>
        </div>
      </div>

      {/* Preferences card */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Globe size={16} className="text-sky-500" /> {t('preferences.title')}
        </h3>
        <div>
          <p className="block text-[10px] font-bold text-slate-400 uppercase mb-2">{t('preferences.language')}</p>
          <div className="flex gap-2">
            {(['en', 'ro'] as Locale[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setLocale(opt)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  locale === opt
                    ? 'bg-slate-950 dark:bg-sky-400 text-white dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t(opt === 'en' ? 'preferences.english' : 'preferences.romanian')}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="block text-[10px] font-bold text-slate-400 uppercase mb-2">{t('preferences.currency')}</p>
          <div className="flex gap-2">
            {(['EUR', 'RON'] as CurrencyCode[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setCurrency(opt)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  currency === opt
                    ? 'bg-slate-950 dark:bg-sky-400 text-white dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {opt === 'EUR' ? t('preferences.euro') : t('preferences.ron')}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            {t('preferences.rateNote', { rate: rate.toFixed(2) })}
          </p>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <User size={16} className="text-sky-500" /> {t('settings.profile')}
        </h3>
        <div>
          <label htmlFor="settings-full-name" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t('settings.fullName')}</label>
          <input
            id="settings-full-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t('settings.yourName')}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
          />
        </div>
        <div>
          <label htmlFor="settings-phone" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t('settings.phone')}</label>
          <input
            id="settings-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
          />
        </div>
        {profileMessage && <FieldMessage message={profileMessage.text} tone={profileMessage.tone} />}
        <button
          type="submit"
          disabled={profileSaving}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-900 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-60"
        >
          {profileSaving ? t('common.saving') : t('settings.saveProfile')}
        </button>
      </form>

      {/* Email form */}
      <form onSubmit={handleEmailSubmit} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Mail size={16} className="text-sky-500" /> {t('settings.email')}
        </h3>
        <div>
          <label htmlFor="settings-email" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t('settings.emailAddress')}</label>
          <input
            id="settings-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
          />
        </div>
        {emailMessage && <FieldMessage message={emailMessage.text} tone={emailMessage.tone} />}
        <button
          type="submit"
          disabled={emailSaving}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-900 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-60"
        >
          {emailSaving ? t('common.saving') : t('settings.updateEmail')}
        </button>
      </form>

      {/* Password form */}
      <form onSubmit={handlePasswordSubmit} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Lock size={16} className="text-sky-500" /> {t('settings.password')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="settings-new-password" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t('settings.newPassword')}</label>
            <input
              id="settings-new-password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
            />
          </div>
          <div>
            <label htmlFor="settings-confirm-password" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t('settings.confirmPassword')}</label>
            <input
              id="settings-confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
            />
          </div>
        </div>
        {newPassword.length > 0 && <PasswordChecklist password={newPassword} />}
        {passwordMessage && <FieldMessage message={passwordMessage.text} tone={passwordMessage.tone} />}
        <button
          type="submit"
          disabled={passwordSaving}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-900 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-60"
        >
          {passwordSaving ? t('common.saving') : t('settings.updatePassword')}
        </button>
      </form>
    </div>
  );
}
