/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, HelpCircle, ShieldCheck, Sun, Moon } from 'lucide-react';
import { Persona, Theme } from '../types';

interface LoginScreenProps {
  onLogin: (persona: Persona, email: string) => void;
  theme: Theme;
  onThemeToggle: () => void;
}

export default function LoginScreen({ onLogin, theme, onThemeToggle }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<Persona>('owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      if (activeTab === 'owner') {
        setEmail('contact@promanagepro.com');
      } else {
        setEmail('alex.chen@oakwood.com');
      }
    }
    
    // Simulate login
    onLogin(activeTab, email || (activeTab === 'owner' ? 'contact@promanagepro.com' : 'alex.chen@oakwood.com'));
  };

  const handleQuickFill = (persona: Persona) => {
    setActiveTab(persona);
    if (persona === 'owner') {
      setEmail('contact@promanagepro.com');
    } else {
      setEmail('alex.chen@oakwood.com');
    }
    setPassword('••••••••');
    setError('');
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
      {/* Top spacing */}
      <div className="w-full max-w-md flex justify-between items-center select-none">
        <span className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400">
          PROPMANAGE ENTERPRISE
        </span>
        <div className="flex items-center gap-2">
          <button
            id="login-theme-toggle"
            type="button"
            onClick={onThemeToggle}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-center"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} className="text-amber-400" />}
          </button>
          <span className="px-2 py-1 text-xs rounded bg-slate-200/50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
            v2.4 Production
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md my-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            PropManage Pro
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Streamlined asset management for professionals.
          </p>
        </div>

        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-xl relative overflow-hidden">
          {/* Decorative background pulse */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-400 animate-pulse" />

          {/* Persona Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg mb-8">
            <button
              id="tab-owner"
              type="button"
              onClick={() => handleQuickFill('owner')}
              className={`flex-1 py-2.5 text-xs font-bold tracking-wider uppercase rounded-md transition-all duration-200 ${
                activeTab === 'owner'
                  ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              SIGN IN AS OWNER
            </button>
            <button
              id="tab-tenant"
              type="button"
              onClick={() => handleQuickFill('tenant')}
              className={`flex-1 py-2.5 text-xs font-bold tracking-wider uppercase rounded-md transition-all duration-200 ${
                activeTab === 'tenant'
                  ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              SIGN IN AS TENANT
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder={activeTab === 'owner' ? 'name@company.com' : 'alex.chen@oakwood.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  PASSWORD
                </label>
                <a href="#forgot" className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                />
                <button
                  id="toggle-password-visibility"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center">
              <input
                id="keep-logged-in"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:bg-slate-950 dark:border-slate-800"
              />
              <label htmlFor="keep-logged-in" className="ml-2 block text-sm text-slate-600 dark:text-slate-400">
                Keep me logged in
              </label>
            </div>

            {/* Sign In Button */}
            <button
              id="btn-signin"
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-md bg-slate-950 hover:bg-slate-900 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 cursor-pointer"
            >
              Sign In <LogIn size={16} />
            </button>
          </form>

          {/* Quick Credential Hints */}
          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-center">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Demo logins: Click tabs above to autofill. Any password works.
            </span>
          </div>

          {/* Register Info */}
          <div className="mt-4 text-center">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <a href="#register" className="font-semibold text-slate-900 hover:underline dark:text-sky-400 dark:hover:text-sky-300">
                Register your property
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md flex justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 mt-6 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
        <a href="#help" className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
          <HelpCircle size={14} /> Help Center
        </a>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <a href="#privacy" className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
          <ShieldCheck size={14} /> Privacy Policy
        </a>
      </div>
    </div>
  );
}
