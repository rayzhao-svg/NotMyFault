import { AnalysisResult, DisputeLetterDraft } from '../types/deposit';
import { formatCurrency } from './calculator';

export function generateDisputeLetter(result: AnalysisResult): DisputeLetterDraft {
  const meta = result.metadata;
  const totals = result.financialTotals;

  const tenantName = meta.tenantName?.trim() || 'Alex Morgan';
  const landlordName = meta.landlordName?.trim() || 'Oakridge Property Management';
  const propertyAddress = meta.propertyAddress?.trim() || '1428 Elm Street, Apt 3B, Austin, TX 78701';
  const moveInDate = meta.moveInDate || '2024-06-01';
  const moveOutDate = meta.moveOutDate || '2025-05-31';
  const state = meta.state || 'TX';
  const today = new Date().toISOString().split('T')[0];

  // Identify disputed deductions
  const disputedItems = result.deductions.filter(
    (d) => totals.deductionStatuses[d.id]?.status === 'supported_dispute'
  );

  const needsProofItems = result.deductions.filter(
    (d) => totals.deductionStatuses[d.id]?.status === 'needs_evidence'
  );

  const tenantLiableItems = result.deductions.filter(
    (d) => totals.deductionStatuses[d.id]?.status === 'unsupported_tenant_liability'
  );

  const subject = `Formal Notice of Security Deposit Deduction Dispute — ${propertyAddress}`;

  let body = `${today}

SENT VIA CERTIFIED MAIL & ELECTRONIC DELIVERY

TO:
${landlordName}
Attn: Security Deposit Accounting & Dispositions Department
Property: ${propertyAddress}

FROM:
${tenantName}
Former Tenant at: ${propertyAddress}
Tenancy Dates: ${moveInDate} to ${moveOutDate}

SUBJECT: ${subject}

Dear ${landlordName},

I am writing to formally acknowledge receipt of your itemized security deposit statement regarding my tenancy at ${propertyAddress}, which terminated on ${moveOutDate}.

Your statement itemizes total deductions amounting to ${formatCurrency(totals.totalClaimed)}. Following a forensic review of our move-in condition checklist, date-stamped photographic records, applicable ${state} statutes, and published property management guidelines, I am formally disputing ${formatCurrency(totals.supportedDisputeAmount)} of the claimed deductions.

Under applicable residential landlord-tenant laws (including ${state === 'TX' ? 'Texas Property Code § 92.104' : 'applicable state statutes'} prohibiting deposit withholdings for normal wear and tear), landlords may not withhold deposit funds for preexisting conditions or ordinary living wear. Photographic and policy evidence demonstrates that the disputed condition existed prior to my occupancy and was documented at move-in.

============================================================
SECTION 1: ITEM-BY-ITEM DISPUTES & PHOTOGRAPHIC EVIDENCE
============================================================\n\n`;

  if (disputedItems.length > 0) {
    disputedItems.forEach((item, idx) => {
      const status = totals.deductionStatuses[item.id];
      const finding = result.findings.find((f) => f.id === status?.primaryFindingId);
      const comparison = result.policyComparisons?.find((pc) => pc.chargeId === item.id);

      body += `${idx + 1}. DISPUTED CHARGE: "${item.description}" — Disputed Amount: ${formatCurrency(item.amount)}\n`;
      body += `   • Photographic Evidence: Baseline Move-In (${moveInDate}) vs. Checkout Move-Out (${moveOutDate})\n`;
      body += `   • Location / Landmark: ${finding?.location || 'Inspected room area'}\n`;
      body += `   • Move-In Observation: ${finding?.moveInObservation || 'Damage documented on move-in inspection.'}\n`;
      body += `   • Move-Out Observation: ${finding?.moveOutObservation || 'Condition matches move-in documentation without structural expansion.'}\n`;
      body += `   • Evidentiary Rationale: ${status?.reason || 'Documented preexisting condition; cannot be attributed to current tenant.'}\n`;

      if (comparison?.companyPolicyStatement) {
        body += `   • Published Company Guideline: ${comparison.companyPolicyStatement}\n`;
      }
      if (comparison?.marketRateLow && comparison?.marketRateHigh) {
        body += `   • Local Market Repair Comparison: Local verified average for comparable spot touchups is ${formatCurrency(comparison.marketRateLow)}–${formatCurrency(comparison.marketRateHigh)} (billed amount of ${formatCurrency(item.amount)} represents an unsubstantiated markup).\n`;
      }
      body += `\n`;
    });
  } else {
    body += `No charges currently meet the high-confidence preexisting visual evidence threshold. Please see receipt requests below.\n\n`;
  }

  if (result.researchSources && result.researchSources.length > 0) {
    body += `============================================================
SECTION 2: LEGAL STATUTES & PUBLISHED POLICY CITATIONS
============================================================\n\n`;
    result.researchSources.forEach((src, idx) => {
      body += `${idx + 1}. [${src.researchCategory.toUpperCase().replace('_', ' ')}] ${src.companyName} — ${src.sourceTitle}\n`;
      body += `   • Citation: "${src.statement}"\n`;
      body += `   • Source: ${src.sourceUrl}\n\n`;
    });
  }

  if (needsProofItems.length > 0 || tenantLiableItems.length > 0) {
    body += `============================================================
SECTION 3: MANDATORY ITEMIZATION & THIRD-PARTY INVOICE REQUESTS
============================================================\n\n`;
    const reviewItems = [...needsProofItems, ...tenantLiableItems];
    reviewItems.forEach((item, idx) => {
      const comparison = result.policyComparisons?.find((pc) => pc.chargeId === item.id);
      body += `${idx + 1}. "${item.description}" — Billed Amount: ${formatCurrency(item.amount)}\n`;
      body += `   Please provide an itemized paid contractor receipt, vendor invoice, and proof of payment.`;
      if (comparison?.marketRateLow && comparison?.marketRateHigh) {
        body += ` Note that prevailing local market rates for this service average ${formatCurrency(comparison.marketRateLow)}–${formatCurrency(comparison.marketRateHigh)}.`;
      }
      body += ` Under state law, charges may not exceed the actual, reasonable out-of-pocket repair costs incurred.\n\n`;
    });
  }

  body += `============================================================
SECTION 4: DEMAND FOR REFUND & STATUTORY TIMELINE
============================================================

Based on the attached photographic exhibits and documented policy standards confirming this condition was preexisting, I respectfully demand the immediate return of the disputed funds totaling ${formatCurrency(totals.supportedDisputeAmount)}.

Please remit payment within fifteen (15) calendar days of receipt of this notice to:
Payee Name: ${tenantName}
Forwarding Address: [Insert Your Mailing Address Here]
Direct Electronic Transfer (if preferred): [e.g. Zelle / ACH / Direct Deposit Details]

Enclosed with this notice is the NotMyFault Comparative Forensic Evidence Dossier containing side-by-side photographic records, coordinate overlays, and researched market pricing indexes.

I appreciate your professional cooperation and look forward to resolving this deposit accounting promptly without administrative complaints or small claims adjudication.

Sincerely,

${tenantName}
Former Tenant, ${propertyAddress}
Enclosure: NotMyFault Comparative Photographic Evidence & Policy Report`;

  return {
    subject,
    body,
    generatedAt: today,
    supportedDisputeAmount: totals.supportedDisputeAmount,
    totalClaimed: totals.totalClaimed,
  };
}
