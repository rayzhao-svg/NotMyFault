'use client';

import React from 'react';
import { ShieldCheck, Sparkles, Scale, User, LogOut, FolderKanban } from 'lucide-react';
import { UserProfile } from '../types/deposit';

interface HeaderProps {
  onLoadSample: () => void;
  onScrollToUpload: () => void;
  isSampleActive?: boolean;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  currentView: 'home' | 'dashboard' | 'analysis';
  onNavigateView: (view: 'home' | 'dashboard' | 'analysis') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSample,
  onScrollToUpload,
  isSampleActive = false,
  currentUser,
  onOpenAuth,
  onSignOut,
  currentView,
  onNavigateView,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => onNavigateView('home')}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-navy-950 via-navy-900 to-teal-800 text-white shadow-sm ring-1 ring-navy-950/10">
            <Scale className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                NotMy<span className="text-teal-600">Fault</span>
              </span>
              <span className="hidden rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-teal-800 sm:inline-block">
                Deposit Defense
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Don&apos;t pay for damage you didn&apos;t cause.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onLoadSample}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all shadow-sm ${
              isSampleActive
                ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100 ring-1 ring-teal-600/20'
            }`}
          >
            <Sparkles className="h-4 w-4 text-teal-600" />
            <span className="hidden sm:inline">Try Sample Case</span>
            <span className="sm:hidden">Sample</span>
            <span className="hidden md:inline text-xs text-teal-600/80 font-normal">($350 Demo)</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateView(currentView === 'dashboard' ? 'home' : 'dashboard')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-navy-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FolderKanban className="h-4 w-4 text-teal-500" />
                <span className="hidden sm:inline">Saved Disputes</span>
                <span className="sm:hidden">Cases</span>
              </button>

              <button
                type="button"
                onClick={onSignOut}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <User className="h-4 w-4 text-slate-500" />
              <span>Sign In</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onNavigateView('home');
              onScrollToUpload();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-navy-950 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow hover:bg-navy-900 transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            <span>New Dispute</span>
          </button>
        </div>
      </div>
    </header>
  );
};
