'use client';

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Download,
  Printer,
  Mail,
  Edit3,
  RotateCcw,
} from 'lucide-react';
import { AnalysisResult } from '../types/deposit';
import { generateDisputeLetter } from '../lib/disputeLetter';
import { formatCurrency } from '../lib/calculator';

interface DisputeLetterProps {
  result: AnalysisResult;
  onOpenPrintReport: () => void;
}

export const DisputeLetter: React.FC<DisputeLetterProps> = ({
  result,
  onOpenPrintReport,
}) => {
  const [letterBody, setLetterBody] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const draft = generateDisputeLetter(result);
    setLetterBody(draft.body);
  }, [result]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(letterBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([letterBody], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Deposit_Dispute_Letter_${result.metadata.propertyAddress?.replace(/[^a-zA-Z0-9]/g, '_') || 'Evidence'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleReset = () => {
    const draft = generateDisputeLetter(result);
    setLetterBody(draft.body);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900 font-serif">
              Landlord Evidence-Backed Dispute Letter
            </h3>
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
              Disputing {formatCurrency(result.financialTotals.supportedDisputeAmount)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Polite, legally structured formal dispute letter citing date-stamped photographic evidence.
            You can edit this letter directly below.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-200" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Letter</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Save .txt</span>
          </button>

          <button
            type="button"
            onClick={onOpenPrintReport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-900 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4 text-teal-400" />
            <span>Download Evidence Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Editable Letter Body */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="flex items-center gap-1 font-medium">
            <Edit3 className="h-3.5 w-3.5 text-teal-600" />
            Editable Formal Notice Text:
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
            title="Reset letter to original generated version"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Draft</span>
          </button>
        </div>

        <textarea
          rows={18}
          value={letterBody}
          onChange={(e) => setLetterBody(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-4 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed focus:bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-inner"
        />
      </div>

      {/* Delivery Instructions */}
      <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50/60 p-4 text-xs text-teal-950 flex items-start gap-3">
        <Mail className="h-4 w-4 text-teal-700 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-teal-900">Recommended Transmission Method: </strong>
          Send this notice via <strong>Certified Mail with Return Receipt Requested</strong> to your landlord&apos;s
          official business address, and simultaneously email a copy along with your attached PDF Evidence Report.
          This establishes timestamped legal proof of delivery should formal small claims adjudication become necessary.
        </div>
      </div>
    </div>
  );
};
