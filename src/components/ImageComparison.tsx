'use client';

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Layers,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import { VisualFinding, BoundingBox } from '../types/deposit';

interface ImageComparisonProps {
  moveInUrl: string;
  moveOutUrl: string;
  moveInDate?: string;
  moveOutDate?: string;
  findings: VisualFinding[];
  selectedFindingId: string | null;
  onSelectFinding: (findingId: string | null) => void;
  roomComparisonNotes?: string;
  isComparable?: boolean;
  isSyntheticDemo?: boolean;
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({
  moveInUrl,
  moveOutUrl,
  moveInDate = 'Move-In',
  moveOutDate = 'Move-Out',
  findings,
  selectedFindingId,
  onSelectFinding,
  roomComparisonNotes,
  isComparable = true,
  isSyntheticDemo = false,
}) => {
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [hoveredFindingId, setHoveredFindingId] = useState<string | null>(null);

  const activeFindingId = hoveredFindingId || selectedFindingId;

  const getBoxStyle = (classification: string, isSelected: boolean) => {
    switch (classification) {
      case 'preexisting':
        return isSelected
          ? 'border-emerald-400 bg-emerald-500/30 ring-4 ring-emerald-400/50 shadow-lg shadow-emerald-500/30'
          : 'border-emerald-500 bg-emerald-500/20 hover:bg-emerald-500/30';
      case 'new':
        return isSelected
          ? 'border-rose-400 bg-rose-500/30 ring-4 ring-rose-400/50 shadow-lg shadow-rose-500/30'
          : 'border-rose-500 bg-rose-500/20 hover:bg-rose-500/30';
      case 'worsened':
        return isSelected
          ? 'border-amber-400 bg-amber-500/30 ring-4 ring-amber-400/50 shadow-lg shadow-amber-500/30'
          : 'border-amber-500 bg-amber-500/20 hover:bg-amber-500/30';
      default:
        return isSelected
          ? 'border-sky-400 bg-sky-500/30 ring-4 ring-sky-400/50 shadow-lg shadow-sky-500/30'
          : 'border-sky-500 bg-sky-500/20 hover:bg-sky-500/30';
    }
  };

  const getBadge = (classification: string) => {
    switch (classification) {
      case 'preexisting':
        return {
          label: 'Preexisting Blemish (Disputable)',
          color: 'bg-emerald-600 text-white',
          icon: CheckCircle,
        };
      case 'new':
        return {
          label: 'New Damage (At Move-Out)',
          color: 'bg-rose-600 text-white',
          icon: XCircle,
        };
      case 'worsened':
        return {
          label: 'Worsened Wear',
          color: 'bg-amber-600 text-white',
          icon: AlertTriangle,
        };
      default:
        return {
          label: 'Inconclusive Area',
          color: 'bg-slate-600 text-white',
          icon: HelpCircle,
        };
    }
  };

  const renderBoundingBox = (box: BoundingBox, finding: VisualFinding, photoType: 'moveIn' | 'moveOut') => {
    const isSelected = activeFindingId === finding.id;
    const badge = getBadge(finding.classification);

    const top = `${box.ymin / 10}%`;
    const left = `${box.xmin / 10}%`;
    const width = `${Math.max(4, (box.xmax - box.xmin) / 10)}%`;
    const height = `${Math.max(4, (box.ymax - box.ymin) / 10)}%`;

    return (
      <div
        key={`${photoType}-${finding.id}`}
        style={{ top, left, width, height }}
        onMouseEnter={() => setHoveredFindingId(finding.id)}
        onMouseLeave={() => setHoveredFindingId(null)}
        onClick={() => onSelectFinding(selectedFindingId === finding.id ? null : finding.id)}
        className={`absolute border-2 rounded-md transition-all duration-200 cursor-pointer pointer-events-auto z-20 ${getBoxStyle(
          finding.classification,
          isSelected
        )}`}
      >
        {/* Label Tag */}
        <div
          className={`absolute -top-7 left-0 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase whitespace-nowrap shadow-md pointer-events-none transition-opacity ${
            isSelected ? 'opacity-100 z-30 scale-105' : 'opacity-85'
          } ${badge.color}`}
        >
          {finding.classification === 'preexisting' ? '★ Preexisting' : finding.classification}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 font-serif">
              Visual Evidence Inspector
            </h3>
            {isSyntheticDemo && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                AI-generated demo photos
              </span>
            )}
            {isComparable ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <CheckCircle className="h-3 w-3" />
                {isSyntheticDemo ? 'Matching Sample Room' : 'Verified Matching Room'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                <AlertTriangle className="h-3 w-3" />
                Different Rooms or Unmatched
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Click on highlighted boxes or deduction cards below to focus corresponding evidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBoxes(!showBoxes)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {showBoxes ? (
              <>
                <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                <span>Hide Callouts</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 text-slate-500" />
                <span>Show Callouts</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Room Verification Note */}
      {roomComparisonNotes && (
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 flex items-start gap-2.5">
          <Layers className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-900 font-semibold">
              {isSyntheticDemo ? 'Sample Scene Comparison: ' : 'Forensic Room Landmark Check: '}
            </strong>
            {roomComparisonNotes}
          </p>
        </div>
      )}

      {/* Side-by-side image canvas */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Move-In Image Container */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Move-In Baseline ({moveInDate})
            </span>
            <span className="text-[11px] text-slate-500">Initial condition</span>
          </div>

          <div className="relative rounded-xl border border-slate-300 overflow-hidden bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={moveInUrl}
              alt="Move-In Baseline Photo"
              className="block w-full h-auto select-none"
            />

            {/* Bounding box layer */}
            {showBoxes && (
              <div className="absolute inset-0 pointer-events-none">
                {findings.map((f) => {
                  if (f.moveInBox) {
                    return renderBoundingBox(f.moveInBox, f, 'moveIn');
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Move-Out Image Container */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Move-Out Inspection ({moveOutDate})
            </span>
            <span className="text-[11px] text-slate-500">End-of-lease checkout</span>
          </div>

          <div className="relative rounded-xl border border-slate-300 overflow-hidden bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={moveOutUrl}
              alt="Move-Out Inspection Photo"
              className="block w-full h-auto select-none"
            />

            {/* Bounding box layer */}
            {showBoxes && (
              <div className="absolute inset-0 pointer-events-none">
                {findings.map((f) => {
                  if (f.moveOutBox) {
                    return renderBoundingBox(f.moveOutBox, f, 'moveOut');
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend & Active Finding Callout */}
      <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-emerald-500/40 border border-emerald-500" />
            <span className="text-slate-700 font-medium">Preexisting Damage (Disputable)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-rose-500/40 border border-rose-500" />
            <span className="text-slate-700 font-medium">New Damage (Move-Out Only)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-500/40 border border-amber-500" />
            <span className="text-slate-700 font-medium">Worsened Wear / Inconclusive</span>
          </div>
        </div>

        {selectedFindingId && (
          <button
            type="button"
            onClick={() => onSelectFinding(null)}
            className="text-teal-700 hover:text-teal-900 font-semibold underline text-xs"
          >
            Clear Selected Highlight
          </button>
        )}
      </div>
    </div>
  );
};
