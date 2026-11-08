'use client';

import React from 'react';
import {
  UploadCloud,
  Cpu,
  Search,
  FileCheck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface LandingHeroProps {
  onLoadSample: () => void;
  onStartLive: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onLoadSample, onStartLive }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-white pt-12 pb-20 sm:pt-16 sm:pb-24">
      {/* Decorative background grid and glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/60 px-3.5 py-1 text-xs sm:text-sm font-medium text-teal-300 backdrop-blur-sm mb-6">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            <span>AI Tenant Defense & Policy Research Platform</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white font-serif">
            Don&apos;t pay for damage <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              you didn&apos;t cause.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Property managers withhold hundreds of millions in unfair deductions each year.
            <strong> NotMyFault</strong> pairs your move-in and move-out photos, cross-references
            your landlord&apos;s published policies and local repair prices, and produces an
            evidence-backed dispute report to recover your money.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onLoadSample}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3.5 text-sm sm:text-base font-semibold text-navy-950 shadow-lg shadow-teal-500/20 hover:from-teal-400 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all cursor-pointer"
            >
              <Sparkles className="h-5 w-5 text-navy-950" />
              <span>Try Sample Case ($350 Wall Demo)</span>
            </button>

            <button
              type="button"
              onClick={onStartLive}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-sm hover:bg-slate-800 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all cursor-pointer"
            >
              <span>Dispute Your Deductions</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
              <span>Instant sample analysis (no key needed)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-teal-400" />
              <span>Photos processed privately in-memory</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
              <span>Published policies & market quotes</span>
            </div>
          </div>
        </div>

        {/* 4-Step Workflow Section */}
        <div className="mt-16 sm:mt-20">
          <div className="text-center mb-10">
            <h2 className="text-xs uppercase tracking-widest text-teal-400 font-semibold">
              The 4-Step Recovery Process
            </h2>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-100">
              How NotMyFault builds your indisputable deposit claim
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-slate-800 bg-navy-900/70 p-6 backdrop-blur-sm hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-950/80 border border-teal-500/30 text-teal-400 font-bold">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <span className="font-mono text-xs font-bold text-teal-400/80 bg-teal-950/80 px-2.5 py-1 rounded-full border border-teal-500/20">
                  STEP 01
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                1. Upload photos & charges
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Add your move-in and move-out photos alongside itemized deductions and management company details.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-slate-800 bg-navy-900/70 p-6 backdrop-blur-sm hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-950/80 border border-blue-500/30 text-blue-400 font-bold">
                  <Cpu className="h-6 w-6" />
                </div>
                <span className="font-mono text-xs font-bold text-blue-400/80 bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-500/20">
                  STEP 02
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                2. AI identifies unfair charges
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gemini vision detects preexisting scuffs, normal wear and tear, and flags charges unsupported by evidence.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-slate-800 bg-navy-900/70 p-6 backdrop-blur-sm hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-400 font-bold">
                  <Search className="h-6 w-6" />
                </div>
                <span className="font-mono text-xs font-bold text-amber-400/80 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/20">
                  STEP 03
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                3. AI researches policies & costs
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Researches published property manager fee schedules, state security deposit laws, and local market repair prices.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative rounded-2xl border border-slate-800 bg-navy-900/70 p-6 backdrop-blur-sm hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-950/80 border border-teal-500/30 text-teal-400 font-bold">
                  <FileCheck className="h-6 w-6" />
                </div>
                <span className="font-mono text-xs font-bold text-teal-400/80 bg-teal-950/80 px-2.5 py-1 rounded-full border border-teal-500/20">
                  STEP 04
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                4. Evidence-backed dispute report
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Get a formal demand letter and printable PDF packet citing photographic proof, legal statutes, and market quotes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
