'use client';

import React from 'react';
import {
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Scale,
  Sparkles,
  Building,
} from 'lucide-react';
import { PolicyComparisonItem, ResearchSource } from '../types/deposit';
import { formatCurrency } from '../lib/calculator';

interface PolicyComparisonProps {
  comparisons?: PolicyComparisonItem[];
  sources?: ResearchSource[];
  managementCompany?: string;
  isSyntheticDemo?: boolean;
}

export const PolicyComparison: React.FC<PolicyComparisonProps> = ({
  comparisons = [],
  sources = [],
  managementCompany = 'Property Management',
  isSyntheticDemo = false,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
              <BookOpen className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-serif">
              Policy & Pricing Forensic Comparison
            </h3>
            {isSyntheticDemo && (
              <span className="rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 border border-amber-300">
                Synthetic Research Demo
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comparing landlord deductions against verified published guidelines for{' '}
            <strong className="text-slate-900">{managementCompany}</strong> and local market rates.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Scale className="h-4 w-4 text-teal-600" />
          <span>Sourced from published schedules & state codes</span>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="space-y-5">
        {comparisons.map((item, idx) => {
          const isHighDispute = item.disputablePotential === 'high';
          const isModerate = item.disputablePotential === 'moderate';

          return (
            <div
              key={item.chargeId || idx}
              className={`rounded-xl border p-5 transition-all ${
                isHighDispute
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : isModerate
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              {/* Card Title & Disputable Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Deduction Item #{idx + 1}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">
                    {item.description}
                  </h4>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Landlord Billed</span>
                    <span className="text-lg font-bold font-mono text-slate-900">
                      {formatCurrency(item.landlordAmount)}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold border ${
                      isHighDispute
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : isModerate
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    {isHighDispute
                      ? '★ Strong Dispute Grounds'
                      : isModerate
                      ? 'Invoice Review Warranted'
                      : 'Tenant Liability Likely'}
                  </span>
                </div>
              </div>

              {/* Forensic Grid */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* 1. Documented Company Policy */}
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block mb-1">
                      1. Company Policy & Guidelines
                    </span>
                    <p className="text-slate-800 leading-relaxed italic">
                      &ldquo;{item.companyPolicyStatement || 'No publicly published fee schedule available for this management company.'}&rdquo;
                    </p>
                  </div>
                  {item.companyPolicySource?.url && (
                    <a
                      href={item.companyPolicySource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline pt-2 border-t border-slate-100"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate">{item.companyPolicySource.title || 'View Policy Source'}</span>
                    </a>
                  )}
                </div>

                {/* 2. Market Repair Comparison */}
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block mb-1">
                      2. Local Market Repair Benchmark
                    </span>
                    {item.marketRateLow && item.marketRateHigh ? (
                      <div>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-lg font-bold font-mono text-slate-900">
                            {formatCurrency(item.marketRateLow)} – {formatCurrency(item.marketRateHigh)}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">
                          Prevailing local contractor rate for comparable spot repair scope.
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-600 mt-1">
                        Pricing varies by specific contractor quote; request itemized proof of invoice.
                      </p>
                    )}
                  </div>
                  {item.marketRateSource?.url && (
                    <a
                      href={item.marketRateSource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline pt-2 border-t border-slate-100"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate">{item.marketRateSource.name || 'View Rate Guide'}</span>
                    </a>
                  )}
                </div>

                {/* 3. Photographic Grounding */}
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block mb-1">
                      3. Photographic Evidence Match
                    </span>
                    <p className="text-slate-800 leading-relaxed">
                      {item.photographicEvidence}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-teal-800 font-semibold text-[11px]">
                    <Sparkles className="h-3 w-3 text-teal-600" />
                    <span>Cross-referenced with inspection photos</span>
                  </div>
                </div>
              </div>

              {/* AI Assessment Callout */}
              <div className="mt-4 p-3 rounded-lg bg-slate-100/80 border border-slate-200/80 text-xs flex items-start gap-2.5 text-slate-800">
                <ShieldCheck className="h-4 w-4 text-teal-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 font-semibold">Auditor Finding & Rationale: </strong>
                  {item.aiAssessment}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sourced Citations Accordion / List */}
      {sources.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-slate-500" />
            Verified Citations & Statutory Grounds ({sources.length} sources)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sources.map((src) => (
              <div
                key={src.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                      {src.companyName}
                    </span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-700">
                      {src.researchCategory.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-600 line-clamp-2 mt-1 italic">
                    &ldquo;{src.statement}&rdquo;
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Ref: {src.sourceTitle}</span>
                  <a
                    href={src.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold"
                  >
                    <span>View Citation</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
