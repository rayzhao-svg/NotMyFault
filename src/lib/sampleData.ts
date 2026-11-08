import {
  AnalysisResult,
  LandlordDeduction,
  VisualFinding,
  ResearchSource,
  MarketPriceQuote,
  PolicyComparisonItem,
} from '../types/deposit';
import { computeFinancialTotals } from './calculator';

export const SAMPLE_DEDUCTIONS: LandlordDeduction[] = [
  {
    id: 'charge-wall-350',
    description: 'Living room wall repair & repainting (scuff damage)',
    amount: 350.0,
    category: 'Painting & Drywall',
    userNotes: 'Landlord claimed scuffs required full wall primer and two coats of repaint.',
  },
  {
    id: 'charge-carpet-250',
    description: 'Deep carpet steam cleaning for heavy traffic stains',
    amount: 250.0,
    category: 'Flooring & Carpet',
    userNotes: 'Landlord brought professional steam cleaners after checkout.',
  },
];

export const SAMPLE_FINDINGS: VisualFinding[] = [
  {
    id: 'finding-wall-scuff',
    damageDescription: 'Friction scuff mark on lower drywall (~4 inches above baseboard)',
    location: 'Living room south wall, 12 inches to the left of duplex electrical outlet',
    moveInObservation:
      'Clear, 4.5-inch diagonal charcoal scuff mark and surface abrasion is visible on the beige drywall in the Move-In photograph (dated 2024-06-01).',
    moveOutObservation:
      'The identical 4.5-inch diagonal scuff mark is present at the exact same spatial coordinates relative to the baseboard and outlet in the Move-Out photograph (dated 2025-05-31). No new plaster punctures or expansion observed.',
    classification: 'preexisting',
    confidence: 'high',
    evidenceExplanation:
      'Comparative visual evidence confirms this specific scuff existed prior to tenant occupancy. Under standard lease wear & tear rules, tenants cannot be billed for preexisting cosmetic blemishes.',
    associatedChargeIds: ['charge-wall-350'],
    moveInBox: {
      ymin: 545,
      xmin: 290,
      ymax: 640,
      xmax: 380,
    },
    moveOutBox: {
      ymin: 545,
      xmin: 290,
      ymax: 640,
      xmax: 380,
    },
  },
  {
    id: 'finding-carpet-stain',
    damageDescription: 'Dark circular liquid discoloration / spill spot on carpet fibers',
    location: 'Foreground carpet, ~3 feet from baseboard edge',
    moveInObservation:
      'Carpet in Move-In photograph shows uniform fibers and consistent neutral beige tone with no visible discoloration in this zone.',
    moveOutObservation:
      'Noticeable dark brown organic discoloration (~8 inches diameter) with splatter droplets appears in the foreground carpet.',
    classification: 'new',
    confidence: 'high',
    evidenceExplanation:
      'Stain appears only in the Move-Out photo and is absent at Move-In. This represents a tenancy-period occurrence. Photographic dispute is unsupported; tenant should verify actual contractor cleaning invoice.',
    associatedChargeIds: ['charge-carpet-250'],
    moveInBox: null,
    moveOutBox: {
      ymin: 760,
      xmin: 560,
      ymax: 910,
      xmax: 730,
    },
  },
];

export const SAMPLE_RESEARCH_SOURCES: ResearchSource[] = [
  {
    id: 'source-oakridge-policy',
    companyName: 'Oakridge Property Management',
    sourceTitle: 'Resident Move-Out Guidelines & Inspection Standards (§ 4.2)',
    sourceUrl: 'https://oakridge-properties.example.com/residents/moveout-guide',
    researchCategory: 'company_policy',
    statement:
      'Minor drywall blemishes, superficial furniture rub marks, and single pinholes under 1/4 inch are considered ordinary residential wear and tear. Outgoing residents shall not be assessed repaint charges for preexisting wall scuffs noted on the move-in condition checklist.',
    publishedDate: '2023-08-15',
    accessedDate: '2026-11-07',
    relationToCharge:
      'Directly contradicts landlord $350 repainting deduction. The scuff mark was both preexisting and within Oakridge published ordinary wear allowance.',
    applicableChargeId: 'charge-wall-350',
    isBindingLeaseOrLaw: false,
    limitations: 'Subject to terms of signed lease agreement.',
  },
  {
    id: 'source-tx-statute-92104',
    companyName: 'Texas Legislature — Property Code',
    sourceTitle: 'Texas Property Code Title 8, Chapter 92 § 92.104: Retention of Security Deposit',
    sourceUrl: 'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm#92.104',
    researchCategory: 'statutory_law',
    statement:
      'A landlord may not retain any portion of a security deposit to cover normal wear and tear. The landlord bears the burden of proving that damage exceeds normal wear and tear.',
    publishedDate: 'Statute in force',
    accessedDate: '2026-11-07',
    relationToCharge:
      'State law strictly prohibits deposit withholdings for preexisting damage or normal wear, providing legal basis for refund of the $350 deduction.',
    applicableChargeId: 'charge-wall-350',
    isBindingLeaseOrLaw: true,
  },
  {
    id: 'source-tx-statute-92103',
    companyName: 'Texas Legislature — Property Code',
    sourceTitle: 'Texas Property Code Title 8, Chapter 92 § 92.103: Obligation to Refund',
    sourceUrl: 'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm#92.103',
    researchCategory: 'statutory_law',
    statement:
      'Except as provided by Section 92.107, the landlord shall refund a security deposit to the tenant on or before the 30th day after the date the tenant surrenders the premises.',
    publishedDate: 'Statute in force',
    accessedDate: '2026-11-07',
    relationToCharge:
      'Sets mandatory 30-day statutory resolution timeline for deposit accounting in Austin, TX.',
    isBindingLeaseOrLaw: true,
  },
  {
    id: 'source-austin-paint-rates',
    companyName: 'Austin Home Services Pricing Index',
    sourceTitle: 'Austin Residential Drywall Repair & Spot Painting Cost Guide',
    sourceUrl: 'https://austin-services-index.example.com/drywall-patching-costs',
    researchCategory: 'market_rate',
    statement:
      'Average cost for patching and single-wall touchup painting in the Austin metropolitan area is $125 to $180 including materials. Full room repaints average $300-$500 only when extensive drywall punctures exist.',
    publishedDate: '2024-Q1',
    accessedDate: '2026-11-07',
    relationToCharge:
      'Even if the scuff were tenant damage, the landlord $350 charge represents a 150% markup over verified local spot-repair market rates.',
    applicableChargeId: 'charge-wall-350',
    isBindingLeaseOrLaw: false,
  },
  {
    id: 'source-austin-carpet-rates',
    companyName: 'Austin Cleaning Contractors Guild',
    sourceTitle: 'Austin Carpet Steam Extraction & Stain Removal Rate Card',
    sourceUrl: 'https://austin-cleaning-guild.example.com/carpet-steam-rates',
    researchCategory: 'market_rate',
    statement:
      'Single-room deep hot-water extraction with spot chemical treatment averages $110 to $155 in Austin, TX.',
    publishedDate: '2024-Q2',
    accessedDate: '2026-11-07',
    relationToCharge:
      'Landlord $250 carpet charge exceeds prevailing Austin steam cleaning market rates ($135 average) by $115.',
    applicableChargeId: 'charge-carpet-250',
    isBindingLeaseOrLaw: false,
  },
];

export const SAMPLE_MARKET_QUOTES: MarketPriceQuote[] = [
  {
    id: 'quote-austin-pro-paint',
    providerName: 'Austin Pro Painters & Drywall',
    category: 'Painting',
    serviceDescription: 'Spot blemish sanding, drywall compound feathering, and spot color match',
    priceRangeLow: 120.0,
    priceRangeHigh: 165.0,
    averagePrice: 135.0,
    pricingMethod: 'Flat rate per spot touchup',
    sourceUrl: 'https://austinpropainters.example.com/pricing',
    location: 'Austin, TX',
    notes: 'Includes color match and minor spackle work.',
    dateAccessed: '2026-11-07',
  },
  {
    id: 'quote-lone-star-handyman',
    providerName: 'Lone Star Handyman Services',
    category: 'Painting',
    serviceDescription: 'Drywall scuff buffing, spot primer, and 1-coat touchup paint',
    priceRangeLow: 110.0,
    priceRangeHigh: 150.0,
    averagePrice: 125.0,
    pricingMethod: 'Hourly (2 hr minimum) + materials',
    sourceUrl: 'https://lonestarhandyman.example.com/rates',
    location: 'Austin, TX',
    notes: 'Lowest documented local comparable repair cost.',
    dateAccessed: '2026-11-07',
  },
  {
    id: 'quote-capital-carpet',
    providerName: 'Capital City Eco-Cleaners',
    category: 'Carpet Cleaning',
    serviceDescription: 'Single-room truck-mounted steam extraction and organic spot treatment',
    priceRangeLow: 115.0,
    priceRangeHigh: 145.0,
    averagePrice: 130.0,
    pricingMethod: 'Per room flat rate',
    sourceUrl: 'https://capitalecomark.example.com/carpet',
    location: 'Austin, TX',
    notes: 'Truck-mounted steam extraction with pet/tannin stain pre-treatment.',
    dateAccessed: '2026-11-07',
  },
  {
    id: 'quote-green-steam-austin',
    providerName: 'Green Steam Austin',
    category: 'Carpet Cleaning',
    serviceDescription: 'Deep steam carpet cleaning and rotary agitation for set-in stains',
    priceRangeLow: 125.0,
    priceRangeHigh: 160.0,
    averagePrice: 140.0,
    pricingMethod: 'Per room flat rate',
    sourceUrl: 'https://greensteamaustin.example.com/specials',
    location: 'Austin, TX',
    notes: 'Includes antimicrobial sanitizing rinse.',
    dateAccessed: '2026-11-07',
  },
];

export const SAMPLE_POLICY_COMPARISONS: PolicyComparisonItem[] = [
  {
    chargeId: 'charge-wall-350',
    description: 'Living room wall repair & repainting (scuff damage)',
    landlordAmount: 350.0,
    companyPolicyStatement:
      'Oakridge Move-Out Guide § 4.2 states minor scuffs are normal wear and outgoing residents shall not be charged for preexisting blemishes.',
    companyPolicySource: {
      title: 'Oakridge Move-Out Handbook § 4.2',
      url: 'https://oakridge-properties.example.com/residents/moveout-guide',
    },
    marketRateLow: 110.0,
    marketRateHigh: 165.0,
    marketRateSource: {
      name: 'Lone Star Handyman ($125 avg)',
      url: 'https://lonestarhandyman.example.com/rates',
    },
    photographicEvidence:
      'Identical 4.5-inch scuff clearly visible on Move-In photo (2024-06-01) at matching coordinates.',
    aiAssessment:
      'Dispute is strongly supported. The blemish was documented prior to occupancy, falls under the company published normal wear policy, and the $350 fee exceeds local spot repair market rates by 150%.',
    disputablePotential: 'high',
  },
  {
    chargeId: 'charge-carpet-250',
    description: 'Deep carpet steam cleaning for heavy traffic stains',
    landlordAmount: 250.0,
    companyPolicyStatement:
      'Tenant is responsible for stains appearing during tenancy; landlord must provide paid third-party vendor invoice.',
    companyPolicySource: {
      title: 'Texas Property Code § 92.104',
      url: 'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm#92.104',
    },
    marketRateLow: 115.0,
    marketRateHigh: 155.0,
    marketRateSource: {
      name: 'Austin Steam Cleaning Index ($130 avg)',
      url: 'https://austin-cleaning-guild.example.com/carpet-steam-rates',
    },
    photographicEvidence:
      'Stain is not visible at move-in; appears only at move-out in foreground carpet.',
    aiAssessment:
      'Tenant is likely responsible for cleaning costs, but the $250 fee is $115 above Austin market rates ($130). Request actual contractor receipt and invoice.',
    disputablePotential: 'moderate',
  },
];

export function getSampleAnalysisResult(): AnalysisResult {
  const deductions = [...SAMPLE_DEDUCTIONS];
  const findings = [...SAMPLE_FINDINGS];
  const financialTotals = computeFinancialTotals(deductions, findings);

  return {
    id: 'sample-case-austin-3b',
    comparable: true,
    roomComparisonNotes:
      'Both photos capture the identical living room angle, confirmed by matching wall corner geometry, ceiling trim, right-hand window frame, and duplex electrical outlet location.',
    findings,
    deductions,
    financialTotals,
    researchSources: SAMPLE_RESEARCH_SOURCES,
    marketQuotes: SAMPLE_MARKET_QUOTES,
    policyComparisons: SAMPLE_POLICY_COMPARISONS,
    metadata: {
      moveInDate: '2024-06-01',
      moveOutDate: '2025-05-31',
      roomName: 'Living Room',
      tenantName: 'Alex Morgan',
      landlordName: 'Oakridge Property Management',
      propertyAddress: '1428 Elm Street, Apt 3B, Austin, TX 78701',
      city: 'Austin',
      state: 'TX',
      depositAmount: 1800.0,
      leaseDocumentName: 'Sample_Standard_Residential_Lease_Austin.pdf',
      analyzedAt: new Date().toISOString(),
      isSyntheticDemo: true,
    },
    moveInImageUrl: '/sample-move-in.svg',
    moveOutImageUrl: '/sample-move-out.svg',
  };
}
