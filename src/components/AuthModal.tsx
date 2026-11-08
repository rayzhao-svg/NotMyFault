'use client';

import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Database,
  Trash2,
} from 'lucide-react';
import {
  signInUser,
  signUpUser,
  resetPassword,
  deleteUserAccount,
  isSupabaseConfigured,
} from '../lib/supabase';
import { UserProfile } from '../types/deposit';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onAuthSuccess: (user: UserProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot' | 'profile'>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { user, error } = await signInUser(email, password);
    setIsLoading(false);

    if (error) {
      setErrorMsg(error);
    } else {
      onAuthSuccess(user);
      onClose();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { user, error } = await signUpUser(email, password, displayName);
    setIsLoading(false);

    if (error) {
      setErrorMsg(error);
    } else {
      setSuccessMsg('Account created successfully! Session active.');
      onAuthSuccess(user);
      setTimeout(() => onClose(), 1000);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await resetPassword(email);
    setIsLoading(false);
    if (res.success) {
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    if (confirm('Are you sure you want to permanently delete your NotMyFault account and all saved cases?')) {
      setIsLoading(true);
      await deleteUserAccount(currentUser.id);
      setIsLoading(false);
      onAuthSuccess(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-teal-600" />
            <span className="font-bold text-slate-900 font-serif text-lg">
              {currentUser
                ? 'User Account Settings'
                : tab === 'signup'
                ? 'Create Tenant Account'
                : tab === 'forgot'
                ? 'Reset Password'
                : 'Sign In to NotMyFault'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Backend Indicator */}
        <div className="px-6 py-2 bg-slate-100/80 border-b border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Database className="h-3 w-3 text-teal-600" />
            <span>Database Backend:</span>
          </div>
          {isSupabaseConfigured ? (
            <span className="font-bold text-emerald-700">Supabase Auth & PostgreSQL Connected</span>
          ) : (
            <span className="font-medium text-slate-700">Offline / Demo Session (Configurable)</span>
          )}
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Profile View (if already signed in) */}
        {currentUser ? (
          <div className="p-6 space-y-5 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div>
                <span className="text-slate-500 uppercase text-[10px] font-bold">Email Address:</span>
                <p className="text-sm font-bold text-slate-900">{currentUser.email}</p>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] font-bold">Display Name:</span>
                <p className="text-sm font-medium text-slate-800">{currentUser.displayName || 'Tenant'}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 py-2.5 font-semibold text-xs"
              >
                <Trash2 className="h-4 w-4 text-rose-600" />
                <span>Delete Account & Erase All Cases</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800 py-2.5 font-semibold text-xs"
              >
                Close Settings
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="p-6">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setTab('signin');
                  setErrorMsg(null);
                }}
                className={`flex-1 pb-2.5 text-center transition-colors ${
                  tab === 'signin'
                    ? 'border-b-2 border-teal-600 text-teal-800'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('signup');
                  setErrorMsg(null);
                }}
                className={`flex-1 pb-2.5 text-center transition-colors ${
                  tab === 'signup'
                    ? 'border-b-2 border-teal-600 text-teal-800'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('forgot');
                  setErrorMsg(null);
                }}
                className={`flex-1 pb-2.5 text-center transition-colors ${
                  tab === 'forgot'
                    ? 'border-b-2 border-teal-600 text-teal-800'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Forgot Password
              </button>
            </div>

            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Email:</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="tenant@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Password:</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 text-xs shadow-md transition-colors"
                >
                  {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
                </button>
              </form>
            )}

            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Your Full Name:</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Alex Morgan"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Email Address:</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="tenant@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Create Password:</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 text-xs shadow-md transition-colors"
                >
                  {isLoading ? 'Creating Account...' : 'Register Tenant Account'}
                </button>
              </form>
            )}

            {tab === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Email Address:</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="tenant@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 text-xs shadow-md transition-colors"
                >
                  {isLoading ? 'Sending Link...' : 'Send Password Reset Email'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
