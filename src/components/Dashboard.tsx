'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderKanban,
  PlusCircle,
  Trash2,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle,
  Database,
  ArrowRight,
  Search,
  Sparkles,
} from 'lucide-react';
import { UserProfile, SavedDisputeCase } from '../types/deposit';
import { fetchUserDisputes, deleteDisputeCase, isSupabaseConfigured } from '../lib/supabase';

interface DashboardProps {
  user: UserProfile;
  onOpenCase: (disputeCase: SavedDisputeCase) => void;
  onStartNewDispute: () => void;
  onLoadSampleCase: () => void;
}

export function Dashboard({
  user,
  onOpenCase,
  onStartNewDispute,
  onLoadSampleCase,
}: DashboardProps) {
  const [cases, setCases] = useState<SavedDisputeCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUserDisputes(user.id);
      setCases(data);
    } catch (err) {
      console.error('Failed to load disputes', err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const handleDelete = async (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this dispute case? This action cannot be undone.')) {
      return;
    }
    setDeletingId(caseId);
    try {
      await deleteDisputeCase(caseId);
      setCases((prev) => prev.filter((c) => c.id !== caseId));
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCases = cases.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.propertyAddress || '').toLowerCase().includes(q) ||
      (c.managementCompany || '').toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  const totalDeductions = cases.reduce((acc, c) => acc + (c.totalDeductions || 0), 0);
  const totalDisputed = cases.reduce((acc, c) => acc + (c.estimatedDisputedAmount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-navy-900 to-navy-800 text-white p-6 sm:p-8 rounded-2xl shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authenticated Tenant Portal</span>
            <span className="text-navy-300">|</span>
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              {isSupabaseConfigured ? 'Supabase Cloud Sync' : 'Local Encrypted Session'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {user.displayName || user.email.split('@')[0]}
          </h1>
          <p className="text-sm text-navy-200 max-w-xl">
            Manage your active security deposit disputes, review AI photographic evidence, inspect landlord policy comparisons, and download evidence dispute packages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onStartNewDispute}
            className="flex items-center gap-2 px-5 py-3 bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold rounded-xl shadow-lg transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Start New Dispute</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Cases</span>
            <FolderKanban className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{cases.length}</div>
          <div className="text-xs text-slate-500 mt-1">Saved tenant case files</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Deductions</span>
            <DollarSign className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">${totalDeductions.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Charged across all landlords</div>
        </div>

        <div className="p-5 bg-white border border-teal-200 bg-teal-50/50 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-teal-800 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Disputable Recovery</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-900">${totalDisputed.toLocaleString()}</div>
          <div className="text-xs text-teal-700 mt-1">Supported by photographic & policy evidence</div>
        </div>
      </div>

      {/* Cases List Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your Deposit Disputes</h2>
            <p className="text-xs text-slate-500">Click any dispute to view analysis, edit deductions, or download evidence letters</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by address or landlord..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Case Table / Cards */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
            <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">Loading your dispute cases...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 space-y-4">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900">No deposit disputes found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery
                  ? `No cases matched "${searchQuery}". Clear your search query to see all cases.`
                  : "You haven't saved any deposit disputes yet. You can start a new dispute or try out our sample Austin apartment case."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={onStartNewDispute}
                className="inline-flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Start New Dispute</span>
              </button>
              <button
                onClick={onLoadSampleCase}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Load Sample Case</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredCases.map((c) => (
              <div
                key={c.id}
                onClick={() => onOpenCase(c)}
                className="group p-5 bg-white rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                      {c.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">Case ID: {c.id}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-base group-hover:text-teal-700 transition-colors">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{c.propertyAddress || 'Rental Property Unit'}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Landlord: {c.managementCompany || 'Property Manager'}</span>
                    {c.moveInDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        In: {c.moveInDate} {c.moveOutDate ? `| Out: ${c.moveOutDate}` : ''}
                      </span>
                    )}
                    <span>Created: {new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="text-xs text-slate-500">Claimed / Disputed</div>
                    <div className="text-sm font-bold text-slate-900">
                      ${c.totalDeductions.toLocaleString()} / <span className="text-teal-600">${c.estimatedDisputedAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(c.id, e)}
                      disabled={deletingId === c.id}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete case"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 group-hover:text-teal-700">
                      <span>Open Case</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Helpful Guidance */}
      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">
            Tenant Rights & Account Privacy
          </p>
          <p>
            Your uploaded move-in/move-out photos and itemized deductions are evaluated strictly for your dispute. If Supabase cloud database keys are configured in <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">.env.local</code>, disputes sync securely with Row Level Security. Otherwise, data is maintained privately inside your authenticated browser session.
          </p>
        </div>
      </div>
    </div>
  );
}
