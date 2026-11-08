'use client';

import React from 'react';
import {
  Printer,
  X,
  Scale,
} from 'lucide-react';
import { AnalysisResult } from '../types/deposit';
import { formatCurrency } from '../lib/calculator';
import { generateDisputeLetter } from '../lib/disputeLetter';

interface PrintableReportProps {
  result: AnalysisResult;
  onClose: () => void;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({ result, onClose }) => {
  const totals = result.financialTotals;
  const meta = result.metadata;
  const draft = generateDisputeLetter(result);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6 lg:p-8 flex justify-center">
      {/* Container - Printable Card */}
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden print:m-0 print:p-0 print:shadow-none print:w-full print:max-w-none">
        {/* Screen-only top action bar */}
        <div className="print:hidden sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50/95 backdrop-blur px-6 py-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-teal-600" />
            <span className="font-bold text-slate-900 font-serif">
              NotMyFault Evidence Dossier & Dispute Report
            </span>
            <span className="rounded bg-teal-100 text-teal-800 text-[11px] font-semibold px-2 py-0.5">
              Ready for PDF Export
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print or Save as PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
              title="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 space-y-8 text-slate-900 font-sans print:p-6 print:text-black">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight font-serif text-slate-950">
                  NOTMY<span className="text-teal-700">FAULT</span>
                </span>
                <span className="text-xs uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-700">
                  {meta.isSyntheticDemo ? 'DEMO EVIDENCE AUDIT' : 'OFFICIAL EVIDENCE AUDIT'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                Photographic Audit, Published Landlord Policies & Market Pricing Dossier
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-slate-600">
              <p>Dossier Ref: <strong className="text-slate-900 font-bold">NMF-{Date.now().toString().slice(-6)}</strong></p>
              <p>Generated: {new Date(meta.analyzedAt || Date.now()).toLocaleDateString()}</p>
              {meta.isSyntheticDemo && (
                <p className="text-amber-700 font-semibold mt-0.5">DEMO / AI-GENERATED PHOTOS</p>
              )}
            </div>
          </div>

          {/* Tenancy & Case Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs print:bg-white print:border-slate-400">
            <div>
              <span className="text-slate-500 block uppercase font-semibold text-[10px]">Former Tenant:</span>
              <strong className="text-slate-900 text-sm block mt-0.5">{meta.tenantName || 'Alex Morgan'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-semibold text-[10px]">Landlord / Property:</span>
              <strong className="text-slate-900 text-sm block mt-0.5">{meta.landlordName || 'Oakridge Property Mgmt'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-semibold text-[10px]">Tenancy Term:</span>
              <strong className="text-slate-900 text-sm block mt-0.5">
                {meta.moveInDate || '2024-06-01'} to {meta.moveOutDate || '2025-05-31'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-semibold text-[10px]">Unit Address:</span>
              <strong className="text-slate-900 text-sm block mt-0.5">{meta.propertyAddress || '1428 Elm St, Austin, TX'}</strong>
            </div>
          </div>

          {/* Financial Summary Box */}
          <div className="p-5 rounded-xl border-2 border-slate-900 bg-slate-50/60 print:bg-white">
            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-600 mb-3">
              Security Deposit Financial Accounting
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center divide-x divide-slate-300">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Landlord Claimed</span>
                <span className="text-2xl font-bold font-mono text-slate-900 block mt-1">
                  {formatCurrency(totals.totalClaimed)}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Disputable Recovery</span>
                <span className="text-2xl font-bold font-mono text-emerald-700 block mt-1">
                  {formatCurrency(totals.supportedDisputeAmount)}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-amber-800 uppercase block">Review / Accepted</span>
                <span className="text-2xl font-bold font-mono text-amber-700 block mt-1">
                  {formatCurrency(totals.uncertainAmount + totals.unsupportedOrNewAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Photographic Evidence Side-by-Side if URLs present */}
          {result.moveInImageUrl && result.moveOutImageUrl && (
            <div className="space-y-3 page-break-inside-avoid">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                {meta.isSyntheticDemo ? 'AI-Generated Demo Photo Comparison' : 'Visual Inspection Photographic Comparison'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 text-center">
                  <span className="text-[11px] font-bold text-sky-800 block mb-1 uppercase">Move-In Baseline Photo</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.moveInImageUrl} alt="Move-In Baseline" className="block w-full h-auto rounded border border-slate-200" />
                </div>
                <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 text-center">
                  <span className="text-[11px] font-bold text-emerald-800 block mb-1 uppercase">Move-Out Inspection Photo</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.moveOutImageUrl} alt="Move-Out Inspection" className="block w-full h-auto rounded border border-slate-200" />
                </div>
              </div>
            </div>
          )}

          {/* Itemized Deductions & Findings Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              Itemized Deduction Audit & Findings
            </h3>
            <table className="w-full text-left text-xs border border-slate-200 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-2.5">Item</th>
                  <th className="p-2.5">Charge Description</th>
                  <th className="p-2.5 text-right">Amount</th>
                  <th className="p-2.5">Audit Assessment</th>
                  <th className="p-2.5">Dispute Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {result.deductions.map((d, index) => {
                  const status = totals.deductionStatuses[d.id];
                  const finding = result.findings.find((f) => f.id === status?.primaryFindingId);

                  return (
                    <tr key={d.id} className="align-top">
                      <td className="p-2.5 font-bold font-mono">#{index + 1}</td>
                      <td className="p-2.5 font-medium">{d.description}</td>
                      <td className="p-2.5 text-right font-mono font-bold">{formatCurrency(d.amount)}</td>
                      <td className="p-2.5 font-semibold">
                        {status?.status === 'supported_dispute' ? (
                          <span className="text-emerald-800 font-bold">DISPUTABLE (PREEXISTING)</span>
                        ) : (
                          <span className="text-slate-600">Review Invoices / Accepted</span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-600">
                        {finding?.evidenceExplanation || status?.reason || 'Awaiting contractor proof.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Published Company Policies & Legal Research Table */}
          {result.researchSources && result.researchSources.length > 0 && (
            <div className="space-y-3 page-break-inside-avoid">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>Published Landlord Policies & Statutory Citations</span>
                <span className="text-[10px] text-slate-500 font-normal">Grounded sources</span>
              </h3>
              <table className="w-full text-left text-xs border border-slate-200 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2">Authority / Source</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Policy / Legal Statement</th>
                    <th className="p-2">Application to Tenant Claim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {result.researchSources.map((source) => (
                    <tr key={source.id} className="align-top">
                      <td className="p-2 font-bold">
                        <div>{source.companyName}</div>
                        <div className="text-[10px] text-slate-500 font-normal truncate max-w-[180px]">{source.sourceTitle}</div>
                      </td>
                      <td className="p-2 capitalize text-slate-600">{source.researchCategory.replace('_', ' ')}</td>
                      <td className="p-2 text-slate-800">{source.statement}</td>
                      <td className="p-2 text-slate-600 font-medium">{source.relationToCharge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Market Repair Cost Comparison Table */}
          {result.marketQuotes && result.marketQuotes.length > 0 && (
            <div className="space-y-3 page-break-inside-avoid">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Market Repair Cost Benchmarks
              </h3>
              <table className="w-full text-left text-xs border border-slate-200 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2">Service / Provider</th>
                    <th className="p-2">Market Price Range</th>
                    <th className="p-2">Pricing Method</th>
                    <th className="p-2">Location</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {result.marketQuotes.map((q) => (
                    <tr key={q.id}>
                      <td className="p-2 font-semibold">
                        <div>{q.providerName}</div>
                        <div className="text-[10px] text-slate-500">{q.serviceDescription}</div>
                      </td>
                      <td className="p-2 font-mono font-bold text-slate-900">
                        ${q.priceRangeLow} – ${q.priceRangeHigh}
                      </td>
                      <td className="p-2 text-slate-600">{q.pricingMethod}</td>
                      <td className="p-2 text-slate-600">{q.location}</td>
                      <td className="p-2 font-medium text-teal-800">
                        {q.isUserEntered ? 'User Quote' : 'Verified Public Benchmark'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Formal Tenant Dispute Letter */}
          <div className="space-y-3 page-break-inside-avoid">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              Generated Formal Dispute Letter
            </h3>
            <div className="p-5 rounded-xl border border-slate-300 bg-slate-50/50 font-serif text-xs leading-relaxed whitespace-pre-line text-slate-900 print:bg-white print:border-slate-400">
              {draft.body}
            </div>
          </div>

          {/* Signatures & Statutory Disclaimer */}
          <div className="pt-6 border-t border-slate-300 text-xs text-slate-500 space-y-4 page-break-inside-avoid">
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div>
                <p className="font-semibold text-slate-700">Tenant Signature:</p>
                <div className="mt-8 border-b border-slate-400 w-48" />
                <p className="mt-1 text-[11px] text-slate-400">{meta.tenantName || 'Tenant'} | Date</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Landlord Acknowledgement:</p>
                <div className="mt-8 border-b border-slate-400 w-48" />
                <p className="mt-1 text-[11px] text-slate-400">Authorized Agent | Date</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal pt-2">
              Disclaimer: NotMyFault provides consumer-finance dispute evidence synthesis based on tenant photos, publicly documented fee schedules, and statutory wear-and-tear standards. It does not constitute formal legal counsel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
