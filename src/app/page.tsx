'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Header } from '../components/Header';
import { LandingHero } from '../components/LandingHero';
import { UploadSection } from '../components/UploadSection';
import { ImageComparison } from '../components/ImageComparison';
import { ResultsDashboard } from '../components/ResultsDashboard';
import { DisputeLetter } from '../components/DisputeLetter';
import { PrintableReport } from '../components/PrintableReport';
import { Dashboard } from '../components/Dashboard';
import { AuthModal } from '../components/AuthModal';
import {
  AnalysisResult,
  LandlordDeduction,
  CaseMetadata,
  UserProfile,
  SavedDisputeCase,
  MarketPriceQuote,
} from '../types/deposit';
import { getSampleAnalysisResult } from '../lib/sampleData';
import { getCurrentUser, signOutUser, saveDisputeCase } from '../lib/supabase';
import { prepareAnalysisImage, serializeApiRequest } from '../lib/uploadImages';
import { RefreshCw, Scale } from 'lucide-react';

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPrintReport, setShowPrintReport] = useState<boolean>(false);
  const [isCaseSaved, setIsCaseSaved] = useState<boolean>(false);

  // User auth & view state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'analysis'>('home');

  const resultsRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check authenticated session
    getCurrentUser().then((user) => {
      if (user) setCurrentUser(user);
    });
  }, []);

  const handleLoadSample = () => {
    setApiError(null);
    const sample = getSampleAnalysisResult();
    setAnalysisResult(sample);
    setSelectedFindingId('finding-wall-scuff');
    setIsCaseSaved(false);
    setCurrentView('home');

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleScrollToUpload = () => {
    setCurrentView('home');
    setTimeout(() => {
      uploadRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleLiveAnalyze = async (payload: {
    moveInBase64: string;
    moveInMimeType: string;
    moveOutBase64: string;
    moveOutMimeType: string;
    deductions: LandlordDeduction[];
    metadata: CaseMetadata;
    runResearch: boolean;
    leaseTextExcerpt?: string;
  }) => {
    setIsLoading(true);
    setApiError(null);
    setIsCaseSaved(false);

    try {
      // Resize transport copies; keep the original photos for previews and reports.
      const [moveIn, moveOut] = await Promise.all([
        prepareAnalysisImage(payload.moveInBase64, payload.moveInMimeType),
        prepareAnalysisImage(payload.moveOutBase64, payload.moveOutMimeType),
      ]);
      const photoBody = serializeApiRequest({
        moveInBase64: moveIn.dataUrl,
        moveInMimeType: moveIn.mimeType,
        moveOutBase64: moveOut.dataUrl,
        moveOutMimeType: moveOut.mimeType,
        deductions: payload.deductions,
        metadata: payload.metadata,
      });
      const researchBody = payload.runResearch
        ? serializeApiRequest({
            managementCompany: payload.metadata.landlordName || 'Property Management',
            city: payload.metadata.city || 'Austin',
            state: payload.metadata.state || 'TX',
            deductions: payload.deductions,
            leaseExcerpt: payload.leaseTextExcerpt,
          })
        : undefined;

      // 1. Analyze photos with Gemini vision
      const photoPromise = fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: photoBody,
      });

      // 2. Concurrently run policy & pricing research if requested
      const researchPromise = payload.runResearch
        ? fetch('/api/research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: researchBody,
          }).then((res) => (res.ok ? res.json() : null)).catch(() => null)
        : Promise.resolve(null);

      const [photoRes, researchData] = await Promise.all([photoPromise, researchPromise]);

      const photoData = await photoRes.json();
      if (!photoRes.ok) {
        throw new Error(photoData.message || photoData.error || 'Failed to analyze photos');
      }

      // Attach client-side image URLs for visual display and research findings
      const resultWithExtras: AnalysisResult = {
        ...photoData,
        moveInImageUrl: payload.moveInBase64,
        moveOutImageUrl: payload.moveOutBase64,
        researchSources: researchData?.sources || photoData.researchSources || [],
        marketQuotes: researchData?.marketQuotes || photoData.marketQuotes || [],
        policyComparisons: researchData?.policyComparisons || photoData.policyComparisons || [],
      };

      setAnalysisResult(resultWithExtras);
      setSelectedFindingId(resultWithExtras.findings[0]?.id || null);
      setCurrentView('home');

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCase = async () => {
    if (!analysisResult) return;
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    try {
      await saveDisputeCase({
        userId: currentUser.id,
        propertyAddress: analysisResult.metadata.propertyAddress || 'Disputed Unit',
        managementCompany: analysisResult.metadata.landlordName || 'Property Management',
        moveInDate: analysisResult.metadata.moveInDate,
        moveOutDate: analysisResult.metadata.moveOutDate,
        depositAmount: analysisResult.metadata.depositAmount || 0,
        totalDeductions: analysisResult.financialTotals.totalClaimed,
        estimatedDisputedAmount: analysisResult.financialTotals.supportedDisputeAmount,
        status: 'analyzed',
        analysisResult: analysisResult,
      });
      setIsCaseSaved(true);
    } catch (err) {
      console.error('Failed to save case', err);
    }
  };

  const handleOpenSavedCase = (disputeCase: SavedDisputeCase) => {
    setAnalysisResult(disputeCase.analysisResult);
    setSelectedFindingId(disputeCase.analysisResult.findings?.[0]?.id || null);
    setIsCaseSaved(true);
    setCurrentView('home');
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAddUserQuote = (quote: MarketPriceQuote) => {
    if (!analysisResult) return;
    const currentQuotes = analysisResult.marketQuotes || [];
    setAnalysisResult({
      ...analysisResult,
      marketQuotes: [quote, ...currentQuotes],
    });
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setCurrentView('home');
  };

  return (
    <>
      <Header
        onLoadSample={handleLoadSample}
        onScrollToUpload={handleScrollToUpload}
        isSampleActive={analysisResult?.metadata.isSyntheticDemo}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
        currentView={currentView}
        onNavigateView={(v) => setCurrentView(v)}
      />

      <main className="flex-1 pb-24">
        {/* View 1: Authenticated User Dashboard */}
        {currentView === 'dashboard' && currentUser ? (
          <Dashboard
            user={currentUser}
            onOpenCase={handleOpenSavedCase}
            onStartNewDispute={handleScrollToUpload}
            onLoadSampleCase={handleLoadSample}
          />
        ) : (
          /* View 2: Main Intake and Results Flow */
          <>
            <LandingHero
              onLoadSample={handleLoadSample}
              onStartLive={handleScrollToUpload}
            />

            <div ref={uploadRef}>
              <UploadSection
                onAnalyze={handleLiveAnalyze}
                onLoadSample={handleLoadSample}
                isLoading={isLoading}
                errorMessage={apiError}
                onClearError={() => setApiError(null)}
              />
            </div>

            {/* Results & Dispute Section (Shown when analysis exists) */}
            {analysisResult && (
              <div ref={resultsRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 space-y-10">
                {/* Results Section Divider / Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-300 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-xs">
                        ✓
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
                        Evidence Audit & Dispute Dossier
                      </h2>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      Inspected property:{' '}
                      <strong className="text-slate-900">
                        {analysisResult.metadata.propertyAddress || 'Austin, TX'}
                      </strong>
                      {' '}({analysisResult.metadata.landlordName || 'Oakridge Property Management'})
                      {' '}• Analyzed {new Date(analysisResult.metadata.analyzedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleScrollToUpload}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                      <span>Audit Another Room</span>
                    </button>
                  </div>
                </div>

                {/* Side-by-Side Image Inspector with Normalized Bounding Box Support */}
                <ImageComparison
                  moveInUrl={analysisResult.moveInImageUrl || '/sample-move-in.svg'}
                  moveOutUrl={analysisResult.moveOutImageUrl || '/sample-move-out.svg'}
                  moveInDate={analysisResult.metadata.moveInDate || '2024-06-01'}
                  moveOutDate={analysisResult.metadata.moveOutDate || '2025-05-31'}
                  findings={analysisResult.findings}
                  selectedFindingId={selectedFindingId}
                  onSelectFinding={setSelectedFindingId}
                  roomComparisonNotes={analysisResult.roomComparisonNotes}
                  isComparable={analysisResult.comparable}
                />

                {/* Financial & Itemized Audit Dashboard + Policy Research + Repair Quotes */}
                <ResultsDashboard
                  result={analysisResult}
                  selectedFindingId={selectedFindingId}
                  onSelectFinding={setSelectedFindingId}
                  onSaveCase={handleSaveCase}
                  isCaseSaved={isCaseSaved}
                  onAddUserQuote={handleAddUserQuote}
                />

                {/* Formal Dispute Letter Generator */}
                <DisputeLetter
                  result={analysisResult}
                  onOpenPrintReport={() => setShowPrintReport(true)}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Printable Report Modal */}
      {showPrintReport && analysisResult && (
        <PrintableReport
          result={analysisResult}
          onClose={() => setShowPrintReport(false)}
        />
      )}

      {/* Auth Modal for Supabase & Local Session Management */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          // If a case was pending save, save it now
          if (analysisResult && user) {
            saveDisputeCase({
              userId: user.id,
              propertyAddress: analysisResult.metadata.propertyAddress || 'Disputed Unit',
              managementCompany: analysisResult.metadata.landlordName || 'Property Management',
              moveInDate: analysisResult.metadata.moveInDate,
              moveOutDate: analysisResult.metadata.moveOutDate,
              depositAmount: analysisResult.metadata.depositAmount || 0,
              totalDeductions: analysisResult.financialTotals.totalClaimed,
              estimatedDisputedAmount: analysisResult.financialTotals.supportedDisputeAmount,
              status: 'analyzed',
              analysisResult: analysisResult,
            }).then(() => setIsCaseSaved(true));
          }
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 mt-auto text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-teal-600" />
            <span className="font-bold text-slate-800 font-serif">NotMyFault</span>
            <span>— Don&apos;t pay for damage you didn&apos;t cause.</span>
          </div>
          <p className="text-center sm:text-right">
            Consumer finance deposit defense. Published fee schedules &amp; local market pricing benchmarks.
          </p>
        </div>
      </footer>
    </>
  );
}
