'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Info,
  Building2,
  MapPin,
  FileText,
  Search,
  DollarSign,
} from 'lucide-react';
import { LandlordDeduction, CaseMetadata } from '../types/deposit';
import { formatCurrency } from '../lib/calculator';

interface UploadSectionProps {
  onAnalyze: (payload: {
    moveInBase64: string;
    moveInMimeType: string;
    moveOutBase64: string;
    moveOutMimeType: string;
    deductions: LandlordDeduction[];
    metadata: CaseMetadata;
    runResearch: boolean;
    leaseTextExcerpt?: string;
  }) => Promise<void>;
  onLoadSample: () => void;
  isLoading: boolean;
  errorMessage: string | null;
  onClearError: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onAnalyze,
  onLoadSample,
  isLoading,
  errorMessage,
  onClearError,
}) => {
  // Image state
  const [moveInImage, setMoveInImage] = useState<{
    dataUrl: string;
    name: string;
    sizeKb: number;
    mimeType: string;
  } | null>(null);

  const [moveOutImage, setMoveOutImage] = useState<{
    dataUrl: string;
    name: string;
    sizeKb: number;
    mimeType: string;
  } | null>(null);

  // Metadata state
  const [moveInDate, setMoveInDate] = useState<string>('2024-06-01');
  const [moveOutDate, setMoveOutDate] = useState<string>('2025-05-31');
  const [roomName, setRoomName] = useState<string>('Living Room');
  const [tenantName, setTenantName] = useState<string>('Alex Morgan');
  const [landlordName, setLandlordName] = useState<string>('Oakridge Property Management');
  const [propertyAddress, setPropertyAddress] = useState<string>(
    '1428 Elm Street, Apt 3B'
  );
  const [city, setCity] = useState<string>('Austin');
  const [state, setState] = useState<string>('TX');
  const [depositAmount, setDepositAmount] = useState<number>(1800);
  const [leaseFileName, setLeaseFileName] = useState<string>('');
  const [leaseTextExcerpt, setLeaseTextExcerpt] = useState<string>('');
  const [runResearch, setRunResearch] = useState<boolean>(true);

  // Deductions state
  const [deductions, setDeductions] = useState<LandlordDeduction[]>([
    {
      id: 'charge-1',
      description: 'Living room wall repair & repainting (scuff mark)',
      amount: 350.0,
      category: 'Painting',
    },
    {
      id: 'charge-2',
      description: 'Deep carpet steam cleaning for heavy traffic stains',
      amount: 250.0,
      category: 'Flooring',
    },
  ]);

  const [validationError, setValidationError] = useState<string | null>(null);

  const moveInInputRef = useRef<HTMLInputElement>(null);
  const moveOutInputRef = useRef<HTMLInputElement>(null);
  const leaseInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (
    file: File,
    setter: React.Dispatch<
      React.SetStateAction<{
        dataUrl: string;
        name: string;
        sizeKb: number;
        mimeType: string;
      } | null>
    >
  ) => {
    setValidationError(null);
    onClearError();

    if (!file.type.startsWith('image/')) {
      setValidationError('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setValidationError(`Image is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum allowed is 12MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setter({
          dataUrl: e.target.result,
          name: file.name,
          sizeKb: Math.round(file.size / 1024),
          mimeType: file.type || 'image/jpeg',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLeaseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLeaseFileName(file.name);
    // If it's a text/markdown file, read it, or extract name
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          setLeaseTextExcerpt(ev.target.result.slice(0, 4000));
        }
      };
      reader.readAsText(file);
    } else {
      setLeaseTextExcerpt(`Uploaded move-out document: ${file.name}`);
    }
  };

  const handleAddDeduction = () => {
    const nextId = `charge-${Date.now()}`;
    setDeductions([
      ...deductions,
      {
        id: nextId,
        description: '',
        amount: 100,
        category: 'Repairs',
      },
    ]);
  };

  const handleRemoveDeduction = (id: string) => {
    if (deductions.length <= 1) {
      setValidationError('You must have at least one deduction to evaluate.');
      return;
    }
    setDeductions(deductions.filter((d) => d.id !== id));
  };

  const handleUpdateDeduction = (
    id: string,
    field: 'description' | 'amount' | 'category',
    val: string | number
  ) => {
    setDeductions(
      deductions.map((d) => {
        if (d.id === id) {
          return { ...d, [field]: val };
        }
        return d;
      })
    );
  };

  const totalDeductionsAmount = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    onClearError();

    if (!moveInImage) {
      setValidationError('Please upload your Move-In inspection photo.');
      return;
    }

    if (!moveOutImage) {
      setValidationError('Please upload your Move-Out inspection photo.');
      return;
    }

    const validDeductions = deductions.filter(
      (d) => d.description.trim().length > 0 && Number(d.amount) > 0
    );

    if (validDeductions.length === 0) {
      setValidationError('Please enter at least one valid deduction with a description and dollar amount.');
      return;
    }

    await onAnalyze({
      moveInBase64: moveInImage.dataUrl,
      moveInMimeType: moveInImage.mimeType,
      moveOutBase64: moveOutImage.dataUrl,
      moveOutMimeType: moveOutImage.mimeType,
      deductions: validDeductions,
      runResearch,
      leaseTextExcerpt: leaseTextExcerpt.trim() || undefined,
      metadata: {
        moveInDate,
        moveOutDate,
        roomName,
        tenantName,
        landlordName,
        propertyAddress: `${propertyAddress}, ${city}, ${state}`.trim(),
        city,
        state,
        depositAmount,
        leaseDocumentName: leaseFileName || undefined,
        analyzedAt: new Date().toISOString(),
        isSyntheticDemo: false,
      },
    });
  };

  return (
    <div id="upload-section" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
        {/* Card Header */}
        <div className="border-b border-slate-200 bg-slate-50/60 px-6 py-6 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                NotMyFault Intake
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                Audit Your Security Deposit Deductions
              </h2>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Upload move-in & move-out photos, specify your rental company, and let AI cross-reference evidence against landlord policies.
            </p>
          </div>
          <button
            type="button"
            onClick={onLoadSample}
            className="self-start sm:self-center inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-teal-600" />
            <span>Load Working Sample Case</span>
          </button>
        </div>

        {/* Global Error Banners */}
        {(errorMessage || validationError) && (
          <div className="p-6 bg-rose-50 border-b border-rose-200 text-rose-900 text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Notice</p>
              <p className="mt-0.5 text-rose-800">{errorMessage || validationError}</p>
              {errorMessage?.includes('GEMINI_API_KEY') && (
                <div className="mt-3 p-3 bg-white/90 rounded-lg border border-rose-300 text-xs text-slate-700">
                  <p className="font-semibold text-slate-900">How to configure your API key:</p>
                  <p className="mt-1">
                    Paste your key in <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700 font-mono">.env.local</code>:
                  </p>
                  <pre className="mt-1.5 p-2 bg-slate-900 text-teal-300 rounded font-mono text-xs overflow-x-auto">
                    GEMINI_API_KEY=AIzaSy...
                  </pre>
                  <p className="mt-2 text-slate-600">
                    Or click <button type="button" onClick={onLoadSample} className="text-teal-700 font-bold underline">Try Sample Case</button> to test all features instantly without an API key.
                  </p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setValidationError(null);
                onClearError();
              }}
              className="text-rose-500 hover:text-rose-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-10">
          {/* Section 1: Photographic Evidence Uploads */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-950 text-white text-xs font-bold">
                  1
                </span>
                Move-In & Move-Out Photo Evidence
              </h3>
              <span className="text-xs text-slate-500">Matching angles recommended</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Move-in Upload */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-500" />
                      Move-In Photograph (Baseline)
                    </label>
                    <span className="text-xs text-slate-500">Documented at key handover</span>
                  </div>

                  {!moveInImage ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) {
                          handleFileProcess(e.dataTransfer.files[0], setMoveInImage);
                        }
                      }}
                      onClick={() => moveInInputRef.current?.click()}
                      className="mt-2 border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-white hover:bg-teal-50/20 group"
                    >
                      <input
                        ref={moveInInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileProcess(e.target.files[0], setMoveInImage);
                          }
                        }}
                      />
                      <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-800">
                        Click to select or drag Move-In photo
                      </p>
                      <p className="text-xs text-slate-500 mt-1">JPEG, PNG, WebP up to 12MB</p>
                    </div>
                  ) : (
                    <div className="mt-2 relative rounded-xl border border-slate-200 overflow-hidden bg-slate-900 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={moveInImage.dataUrl}
                        alt="Move-In Preview"
                        className="w-full h-56 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end justify-between p-3 text-white">
                        <div>
                          <p className="text-xs font-semibold truncate max-w-[200px]">
                            {moveInImage.name}
                          </p>
                          <p className="text-[10px] text-slate-300">{moveInImage.sizeKb} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMoveInImage(null)}
                          className="rounded-lg bg-rose-600/90 hover:bg-rose-600 p-1.5 text-white shadow-sm transition-colors"
                          title="Remove Move-In photo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Move-In Date:
                  </label>
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="text-xs rounded-md border-slate-300 py-1 px-2 border focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Move-out Upload */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Move-Out Photograph (Inspection)
                    </label>
                    <span className="text-xs text-slate-500">Documented at move-out</span>
                  </div>

                  {!moveOutImage ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) {
                          handleFileProcess(e.dataTransfer.files[0], setMoveOutImage);
                        }
                      }}
                      onClick={() => moveOutInputRef.current?.click()}
                      className="mt-2 border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-white hover:bg-teal-50/20 group"
                    >
                      <input
                        ref={moveOutInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileProcess(e.target.files[0], setMoveOutImage);
                          }
                        }}
                      />
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-800">
                        Click to select or drag Move-Out photo
                      </p>
                      <p className="text-xs text-slate-500 mt-1">JPEG, PNG, WebP up to 12MB</p>
                    </div>
                  ) : (
                    <div className="mt-2 relative rounded-xl border border-slate-200 overflow-hidden bg-slate-900 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={moveOutImage.dataUrl}
                        alt="Move-Out Preview"
                        className="w-full h-56 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end justify-between p-3 text-white">
                        <div>
                          <p className="text-xs font-semibold truncate max-w-[200px]">
                            {moveOutImage.name}
                          </p>
                          <p className="text-[10px] text-slate-300">{moveOutImage.sizeKb} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMoveOutImage(null)}
                          className="rounded-lg bg-rose-600/90 hover:bg-rose-600 p-1.5 text-white shadow-sm transition-colors"
                          title="Remove Move-Out photo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Move-Out Date:
                  </label>
                  <input
                    type="date"
                    value={moveOutDate}
                    onChange={(e) => setMoveOutDate(e.target.value)}
                    className="text-xs rounded-md border-slate-300 py-1 px-2 border focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Landlord Deductions List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-950 text-white text-xs font-bold">
                    2
                  </span>
                  Itemized Landlord Deductions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter deductions exactly as listed on your landlord&apos;s security deposit accounting statement.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs uppercase text-slate-500 font-semibold block">
                  Total Deductions
                </span>
                <span className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
                  {formatCurrency(totalDeductionsAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {deductions.map((deduction, index) => (
                <div
                  key={deduction.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-sm hover:border-slate-300 transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex-shrink-0 self-start sm:self-center">
                    #{index + 1}
                  </span>

                  <div className="flex-1">
                    <label className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">
                      Charge Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Living room wall repainting for scuff marks"
                      value={deduction.description}
                      onChange={(e) => handleUpdateDeduction(deduction.id, 'description', e.target.value)}
                      className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div className="w-full sm:w-36">
                    <label className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">
                      Amount ($)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="350.00"
                        value={deduction.amount || ''}
                        onChange={(e) =>
                          handleUpdateDeduction(
                            deduction.id,
                            'amount',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full text-sm font-mono font-medium rounded-lg border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveDeduction(deduction.id)}
                    className="self-end sm:self-end mt-2 sm:mt-0 p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete charge"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleAddDeduction}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg px-3 py-2 border border-teal-200 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Another Charge</span>
                </button>

                <p className="text-xs text-slate-500">
                  {deductions.length} {deductions.length === 1 ? 'charge' : 'charges'} entered
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Company Policy & Legal Jurisdiction Profile */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-950 text-white text-[10px] font-bold">
                  3
                </span>
                Property Management & Jurisdiction Research Profile
              </h3>
              <label className="flex items-center gap-2 text-xs font-semibold text-teal-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={runResearch}
                  onChange={(e) => setRunResearch(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <Search className="w-3.5 h-3.5 text-teal-600" />
                <span>AI Policy & Market Quote Grounding</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">
                  Property Mgmt / Landlord:
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={landlordName}
                    onChange={(e) => setLandlordName(e.target.value)}
                    placeholder="e.g. Oakridge Property Mgmt"
                    className="w-full rounded-md border border-slate-300 pl-8 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">City:</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Austin"
                    className="w-full rounded-md border border-slate-300 pl-8 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">State:</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="TX"
                  maxLength={2}
                  className="w-full rounded-md border border-slate-300 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white uppercase font-mono"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Original Deposit ($):</label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="number"
                    value={depositAmount || ''}
                    onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                    placeholder="1800"
                    className="w-full rounded-md border border-slate-300 pl-8 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Room / Area Inspected:</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Living Room"
                  className="w-full rounded-md border border-slate-300 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Property Address:</label>
                <input
                  type="text"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  placeholder="1428 Elm Street, Apt 3B"
                  className="w-full rounded-md border border-slate-300 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Tenant Full Name:</label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full rounded-md border border-slate-300 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>

            {/* Optional Lease Agreement Upload / Text */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Optional: Lease Agreement / Move-Out Policy Excerpt</span>
                </label>
                <button
                  type="button"
                  onClick={() => leaseInputRef.current?.click()}
                  className="text-[11px] text-teal-700 hover:text-teal-800 font-medium underline"
                >
                  {leaseFileName ? `Replace (${leaseFileName})` : 'Upload Policy File'}
                </button>
                <input
                  ref={leaseInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.doc,.docx"
                  onChange={handleLeaseUpload}
                  className="hidden"
                />
              </div>
              <textarea
                rows={2}
                value={leaseTextExcerpt}
                onChange={(e) => setLeaseTextExcerpt(e.target.value)}
                placeholder="Paste key lease clauses regarding wear and tear, repainting, carpet cleaning schedules, or leave blank to research online..."
                className="w-full text-xs rounded-md border border-slate-300 p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
              />
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info className="h-4 w-4 text-teal-600 flex-shrink-0" />
              <span>
                NotMyFault processes evidence securely in-memory. Citations and market rates are sourced and grounded.
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-navy-950 hover:bg-navy-900 disabled:bg-slate-400 px-7 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-navy-950 focus:ring-offset-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                    <span>Analyzing Photos & Researching Policies...</span>
                  </>
                ) : (
                  <>
                    <span>Run AI Evidence Audit & Research</span>
                    <ArrowRight className="h-4 w-4 text-teal-400" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
