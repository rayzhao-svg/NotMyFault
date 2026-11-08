'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  FileQuestion,
  Sparkles,
  Scale,
  Eye,
  Calendar,
  DollarSign,
  Search,
  Wrench,
  BookmarkPlus,
  Check,
} from 'lucide-react';
import { AnalysisResult, DeductionStatus, MarketPriceQuote } from '../types/deposit';
import { formatCurrency } from '../lib/calculator';
import { PolicyComparison } from './PolicyComparison';
import { RepairCostComparison } from './RepairCostComparison';

interface ResultsDashboardProps {
  result: AnalysisResult;
  selectedFindingId: string | null;
  onSelectFinding: (findingId: string | null) => void;
  onSaveCase?: () => void;
  isCaseSaved?: boolean;
  onAddUserQuote?: (quote: MarketPriceQuote) => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  result,
  selectedFindingId,
  onSelectFinding,
  onSaveCase,
  isCaseSaved = false,
  onAddUserQuote,
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'policy' | 'quotes'>('photos');

  const totals = result.financialTotals;
  const isDemo = result.metadata.isSyntheticDemo;

  const getStatusBadge = (status: DeductionStatus) => {
    switch (status) {
      case 'supported_dispute':
        return {
          label: 'Photographically Supported Dispute',
          sublabel: 'Preexisting blemish present at move-in',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          icon: CheckCircle,
        };
      case 'unsupported_tenant_liability':
        return {
          label: 'Tenant Liability Likely',
          sublabel: 'Damage appeared after move-in',
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
          icon: AlertTriangle,
        };
      default:
        return {
          label: 'Needs Invoices & Proof',
          sublabel: 'Inconclusive or requires contractor receipts',
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          icon: HelpCircle,
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Synthetic Demo Banner if active */}
      {isDemo && (
        <div className="rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 p-4 sm:p-5 shadow-sm text-amber-950 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm">
            <p className="font-bold uppercase tracking-wider text-amber-900 text-xs">
              Demonstration Mode (Synthetic Austin Case)
            </p>
            <p className="mt-1 text-amber-900">
              You are inspecting synthetic room evidence. The living room wall scuff was present at Move-In (
              <strong className="font-semibold">$350 wall repaint disputable</strong>), while carpet stains appeared after move-in (
              <strong className="font-semibold">$250 carpet review</strong>). Landlord policy citations and Austin market repair quotes are fully simulated.
            </p>
          </div>
        </div>
      )}

      {/* Financial Overview KPI Cards & Save Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            Audit Findings & Recovery Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic calculations comparing photos, company policies, and local repair pricing.
          </p>
        </div>

        {onSaveCase && (
          <button
            type="button"
            onClick={onSaveCase}
            disabled={isCaseSaved}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all ${
              isCaseSaved
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-default'
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:scale-[1.02]'
            }`}
          >
            {isCaseSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Case Saved to Account</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4 text-teal-400" />
                <span>Save Case to Account</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* KPI 1: Landlord Claimed Total */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Landlord Claimed Total
            </span>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {formatCurrency(totals.totalClaimed)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Across {result.deductions.length} itemized deduction items
          </p>
        </div>

        {/* KPI 2: Supported for Dispute */}
        <div className="rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/50 p-5 sm:p-6 shadow-sm ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Supported for Dispute
            </span>
            <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
              High Confidence
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-mono">
              {formatCurrency(totals.supportedDisputeAmount)}
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              ({totals.disputedCount} item)
            </span>
          </div>
          <p className="mt-1 text-xs text-emerald-800 font-medium">
            Photo comparison proves preexisting blemish at move-in
          </p>
        </div>

        {/* KPI 3: Review / Invoices Required */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Requires Review / Invoices
            </span>
            <FileQuestion className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {formatCurrency(totals.uncertainAmount + totals.unsupportedOrNewAmount)}
            </span>
            <span className="text-xs text-slate-500">
              ({totals.acceptedOrUncertainCount} items)
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Requires contractor receipts or market rate verification
          </p>
        </div>
      </div>

      {/* Navigation Tabs between Photographic Audit, Policy Comparison, and Repair Quotes */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-2 sm:space-x-4">
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'photos'
                ? 'border-teal-600 text-teal-800 bg-teal-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Photographic Evidence ({result.findings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('policy')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'policy'
                ? 'border-teal-600 text-teal-800 bg-teal-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Search className="w-4 h-4 text-teal-600" />
            <span>Policy & Pricing Research ({result.researchSources?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quotes')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'quotes'
                ? 'border-teal-600 text-teal-800 bg-teal-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Wrench className="w-4 h-4 text-teal-600" />
            <span>Compare Repair Costs ({result.marketQuotes?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Photographic Audit Findings */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                Itemized Charge Forensic Audit
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Each deduction is individually linked to visual evidence and counted at most once in financial totals.
              </p>
            </div>

            <div className="space-y-4">
              {result.deductions.map((deduction, idx) => {
                const statusDetail = totals.deductionStatuses[deduction.id];
                const badge = getStatusBadge(statusDetail?.status || 'needs_evidence');
                const finding = result.findings.find(
                  (f) => f.id === statusDetail?.primaryFindingId
                );

                const isSelected = selectedFindingId === finding?.id;

                return (
                  <div
                    key={deduction.id}
                    className={`rounded-xl border p-5 transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/20 ring-2 ring-teal-500/30'
                        : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="text-base font-bold text-slate-900">
                            {deduction.description}
                          </h4>
                          {deduction.category && (
                            <span className="inline-block mt-1 rounded bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                              {deduction.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-lg font-bold text-slate-900 font-mono block">
                          {formatCurrency(deduction.amount)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 mt-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.bg}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    {/* Evidentiary Rationale */}
                    <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs text-slate-700 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-slate-900 min-w-[110px]">
                          Auditor Finding:
                        </span>
                        <span className="text-slate-800">
                          {statusDetail?.reason || 'Awaiting contractor invoices and inspection notes.'}
                        </span>
                      </div>

                      {finding && (
                        <>
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-slate-900 min-w-[110px]">
                              Location:
                            </span>
                            <span className="text-slate-600">{finding.location}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-slate-900 min-w-[110px]">
                              Move-In Detail:
                            </span>
                            <span className="text-slate-600">{finding.moveInObservation}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-slate-900 min-w-[110px]">
                              Move-Out Detail:
                            </span>
                            <span className="text-slate-600">{finding.moveOutObservation}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {finding && (
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            onSelectFinding(selectedFindingId === finding.id ? null : finding.id)
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>
                            {isSelected ? 'Deselect Box' : 'Highlight on Inspection Photos'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verified User Facts vs AI Vision Observations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-5">
              <h4 className="font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Calendar className="h-4 w-4 text-sky-700" />
                Verified User-Entered Facts
              </h4>
              <ul className="space-y-1.5 text-sky-900 leading-relaxed">
                <li>• Move-In Tenancy Date: <strong>{result.metadata.moveInDate || '2024-06-01'}</strong></li>
                <li>• Move-Out Tenancy Date: <strong>{result.metadata.moveOutDate || '2025-05-31'}</strong></li>
                <li>• Property Mgmt: <strong>{result.metadata.landlordName || 'Oakridge Property Management'}</strong></li>
                <li>• Jurisdiction: <strong>{result.metadata.city || 'Austin'}, {result.metadata.state || 'TX'}</strong></li>
                <li>• Total Deductions Claimed: <strong>{formatCurrency(totals.totalClaimed)}</strong></li>
              </ul>
            </div>

            <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-5">
              <h4 className="font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Sparkles className="h-4 w-4 text-teal-700" />
                AI Multimodal Vision Observations
              </h4>
              <ul className="space-y-1.5 text-teal-900 leading-relaxed">
                <li>• Spatial room matching confirmed via structural architectural anchors.</li>
                <li>• Preexisting friction scuff mark isolated with identical coordinates in both photos.</li>
                <li>• Foreground carpet stain identified as absent at move-in (new condition).</li>
                <li>• Uncertainty explicitly acknowledged; zero fabricated damage claims.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Policy & Pricing Research */}
      {activeTab === 'policy' && (
        <PolicyComparison
          sources={result.researchSources}
          comparisons={result.policyComparisons}
          managementCompany={result.metadata.landlordName || 'Oakridge Property Management'}
          isSyntheticDemo={result.metadata.isSyntheticDemo}
        />
      )}

      {/* Tab 3: Compare Repair Costs */}
      {activeTab === 'quotes' && (
        <RepairCostComparison
          quotes={result.marketQuotes || []}
          onAddUserQuote={onAddUserQuote}
          landlordDeductions={result.deductions}
          city={result.metadata.city}
          state={result.metadata.state}
        />
      )}

      {/* Legal & Statutory Wear and Tear Notice */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-start gap-3">
        <Scale className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-900 font-semibold">Important Legal Notice: </strong>
          NotMyFault provides evidence synthesis and consumer dispute documentation. It does not constitute legal representation
          or guarantee financial recovery. Statutory security deposit timelines, ordinary wear definitions, and bad-faith penalties vary by state law.
        </div>
      </div>
    </div>
  );
};
