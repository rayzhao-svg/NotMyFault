import {
  LandlordDeduction,
  VisualFinding,
  FinancialTotals,
  DeductionStatusDetail,
} from '../types/deposit';

/**
 * Deterministically computes financial dispute totals in TypeScript.
 * Guarantees that every charge is accounted for and counted at most once.
 */
export function computeFinancialTotals(
  deductions: LandlordDeduction[],
  findings: VisualFinding[]
): FinancialTotals {
  let totalClaimed = 0;
  let supportedDisputeAmount = 0;
  let unsupportedOrNewAmount = 0;
  let uncertainAmount = 0;
  let disputedCount = 0;
  let acceptedOrUncertainCount = 0;

  const deductionStatuses: Record<string, DeductionStatusDetail> = {};

  for (const deduction of deductions) {
    const amount = Math.max(0, Math.round(deduction.amount * 100) / 100);
    totalClaimed += amount;

    // Find all findings associated with this deduction ID
    const matchedFindings = findings.filter((f) =>
      Array.isArray(f.associatedChargeIds) && f.associatedChargeIds.includes(deduction.id)
    );

    if (matchedFindings.length === 0) {
      // No visual evidence found for this deduction
      deductionStatuses[deduction.id] = {
        status: 'needs_evidence',
        statusLabel: 'Needs Landlord Proof',
        reason: 'No visual damage corresponding to this charge was detected in the submitted photos. Request itemized contractor receipts, invoice dates, and depreciation schedules.',
        disputableAmount: 0,
      };
      uncertainAmount += amount;
      acceptedOrUncertainCount += 1;
      continue;
    }

    // Check if any matched finding indicates preexisting condition
    const preexistingFinding = matchedFindings.find((f) => f.classification === 'preexisting');
    const worsenedFinding = matchedFindings.find((f) => f.classification === 'worsened');
    const newFinding = matchedFindings.find((f) => f.classification === 'new');
    const uncertainFinding = matchedFindings.find((f) => f.classification === 'uncertain');

    if (preexistingFinding) {
      deductionStatuses[deduction.id] = {
        status: 'supported_dispute',
        statusLabel: 'Supported Dispute (Preexisting)',
        reason: preexistingFinding.evidenceExplanation || 'Photographic comparison confirms condition was already present at move-in.',
        primaryFindingId: preexistingFinding.id,
        disputableAmount: amount,
      };
      supportedDisputeAmount += amount;
      disputedCount += 1;
    } else if (newFinding) {
      deductionStatuses[deduction.id] = {
        status: 'unsupported_tenant_liability',
        statusLabel: 'Tenant Liability Likely (New Damage)',
        reason: newFinding.evidenceExplanation || 'Damage was absent at move-in and appears only at move-out.',
        primaryFindingId: newFinding.id,
        disputableAmount: 0,
      };
      unsupportedOrNewAmount += amount;
      acceptedOrUncertainCount += 1;
    } else if (worsenedFinding) {
      deductionStatuses[deduction.id] = {
        status: 'needs_evidence',
        statusLabel: 'Partial Wear / Needs Review',
        reason: worsenedFinding.evidenceExplanation || 'Damage existed previously but shows increased wear. Normal wear & tear depreciation should be evaluated.',
        primaryFindingId: worsenedFinding.id,
        disputableAmount: 0,
      };
      uncertainAmount += amount;
      acceptedOrUncertainCount += 1;
    } else {
      deductionStatuses[deduction.id] = {
        status: 'needs_evidence',
        statusLabel: 'Uncertain Evidence',
        reason: uncertainFinding?.evidenceExplanation || 'Visual comparison was inconclusive due to lighting or perspective.',
        primaryFindingId: uncertainFinding?.id,
        disputableAmount: 0,
      };
      uncertainAmount += amount;
      acceptedOrUncertainCount += 1;
    }
  }

  return {
    totalClaimed: Math.round(totalClaimed * 100) / 100,
    supportedDisputeAmount: Math.round(supportedDisputeAmount * 100) / 100,
    unsupportedOrNewAmount: Math.round(unsupportedOrNewAmount * 100) / 100,
    uncertainAmount: Math.round(uncertainAmount * 100) / 100,
    disputedCount,
    acceptedOrUncertainCount,
    deductionStatuses,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}
