'use client';

import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  ExternalLink,
  Award,
  MapPin,
} from 'lucide-react';
import { MarketPriceQuote } from '../types/deposit';
import { formatCurrency } from '../lib/calculator';

interface RepairCostComparisonProps {
  quotes: MarketPriceQuote[];
  location?: string;
  onAddUserQuote?: (quote: MarketPriceQuote) => void;
  isSyntheticDemo?: boolean;
  landlordDeductions?: { id: string; description: string; amount: number }[];
  city?: string;
  state?: string;
}

export const RepairCostComparison: React.FC<RepairCostComparisonProps> = ({
  quotes,
  location,
  onAddUserQuote,
  isSyntheticDemo = false,
  city,
  state,
}) => {
  const displayLocation = location || (city && state ? `${city}, ${state}` : 'Austin, TX');
  const [localQuotes, setLocalQuotes] = useState<MarketPriceQuote[]>(quotes);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [providerName, setProviderName] = useState<string>('');
  const [category, setCategory] = useState<string>('Painting');
  const [quoteAmount, setQuoteAmount] = useState<string>('130.00');
  const [serviceDescription, setServiceDescription] = useState<string>('Local contractor written estimate');
  const [notes, setNotes] = useState<string>('Obtained by tenant via email');

  // Find lowest price
  const lowestPrice = Math.min(...localQuotes.map((q) => q.priceRangeLow || q.averagePrice || 99999));

  const handleAddQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerName.trim() || !quoteAmount) return;

    const amt = parseFloat(quoteAmount) || 120;
    const newQuote: MarketPriceQuote = {
      id: `user-quote-${Date.now()}`,
      providerName: providerName.trim(),
      category,
      serviceDescription: serviceDescription.trim() || 'Tenant-obtained contractor quote',
      priceRangeLow: amt,
      priceRangeHigh: amt,
      averagePrice: amt,
      pricingMethod: 'Confirmed Contractor Quote',
      location: displayLocation,
      isUserEntered: true,
      notes: notes.trim(),
      dateAccessed: new Date().toISOString().split('T')[0],
    };

    const updated = [newQuote, ...localQuotes];
    setLocalQuotes(updated);
    if (onAddUserQuote) onAddUserQuote(newQuote);

    setShowAddForm(false);
    setProviderName('');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
              <Wrench className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-serif">
              Local Repair Cost Benchmarks
            </h3>
            {isSyntheticDemo && (
              <span className="rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 border border-amber-300">
                Demo Quotes
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-slate-400" />
            <span>
              Publicly advertised repair and cleaning rates in <strong className="text-slate-800">{location}</strong>.
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer self-start sm:self-center"
        >
          <Plus className="h-4 w-4 text-teal-400" />
          <span>Add Your Real Quote</span>
        </button>
      </div>

      {/* User Quote Input Form */}
      {showAddForm && (
        <form onSubmit={handleAddQuoteSubmit} className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-teal-950 uppercase tracking-wide">
              Add Contractor Quote You Obtained
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-600 block mb-1 font-medium">Provider Name:</label>
              <input
                type="text"
                placeholder="e.g. Austin Pro Painters"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 bg-white text-slate-900"
                required
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-medium">Repair Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 bg-white text-slate-900"
              >
                <option value="Painting">Painting & Drywall</option>
                <option value="Carpet Cleaning">Carpet Steam Cleaning</option>
                <option value="General Cleaning">Deep Cleaning</option>
                <option value="Repairs">General Handyman / Repairs</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-medium">Quoted Amount ($):</label>
              <input
                type="number"
                step="0.01"
                placeholder="130.00"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 bg-white text-slate-900 font-mono font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 block mb-1 font-medium">Scope of Work:</label>
              <input
                type="text"
                placeholder="e.g. Patch scuff and paint wall with materials included"
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1 font-medium">Quote Verification Notes:</label>
              <input
                type="text"
                placeholder="e.g. Received via contractor PDF estimate"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-1.5 rounded text-xs shadow-sm"
            >
              Save Quote to Comparison
            </button>
          </div>
        </form>
      )}

      {/* Quotes Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
            <tr>
              <th className="p-3">Service Provider</th>
              <th className="p-3">Category</th>
              <th className="p-3">Scope / Scope of Work</th>
              <th className="p-3">Rate Structure</th>
              <th className="p-3 text-right">Advertised / Quoted Rate</th>
              <th className="p-3 text-right">Source Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {localQuotes.map((q) => {
              const isLowest = q.priceRangeLow === lowestPrice || q.averagePrice === lowestPrice;

              return (
                <tr
                  key={q.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isLowest ? 'bg-emerald-50/40 font-medium' : ''
                  }`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{q.providerName}</span>
                      {q.isUserEntered && (
                        <span className="rounded bg-sky-100 text-sky-800 text-[10px] px-1.5 py-0.2 font-semibold">
                          Tenant Quote
                        </span>
                      )}
                      {isLowest && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 font-bold">
                          <Award className="h-3 w-3" />
                          Lowest Quote
                        </span>
                      )}
                    </div>
                    {q.notes && <p className="text-[11px] text-slate-500 mt-0.5">{q.notes}</p>}
                  </td>

                  <td className="p-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 font-medium">
                      {q.category}
                    </span>
                  </td>

                  <td className="p-3 text-slate-700 max-w-xs">{q.serviceDescription}</td>

                  <td className="p-3 text-slate-500">{q.pricingMethod}</td>

                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {q.priceRangeLow === q.priceRangeHigh ? (
                      formatCurrency(q.averagePrice)
                    ) : (
                      `${formatCurrency(q.priceRangeLow)} – ${formatCurrency(q.priceRangeHigh)}`
                    )}
                  </td>

                  <td className="p-3 text-right">
                    {q.sourceUrl ? (
                      <a
                        href={q.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold"
                      >
                        <span>Rates</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">User Document</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 flex items-center justify-between">
        <span>
          <strong>Pricing Integrity: </strong>Rates are indexed from verified local contractor rate sheets. No quotes are requested or submitted externally without authorization.
        </span>
        <span className="font-semibold text-slate-800">
          Lowest Documented Rate: {formatCurrency(lowestPrice)}
        </span>
      </div>
    </div>
  );
};
