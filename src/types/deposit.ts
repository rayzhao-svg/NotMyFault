export type DamageClassification = 'preexisting' | 'new' | 'worsened' | 'uncertain';

export type DeductionStatus = 'supported_dispute' | 'needs_evidence' | 'unsupported_tenant_liability';

export interface BoundingBox {
  ymin: number; // 0 - 1000
  xmin: number; // 0 - 1000
  ymax: number; // 0 - 1000
  xmax: number; // 0 - 1000
}

export interface LandlordDeduction {
  id: string;
  description: string;
  amount: number;
  category?: string;
  userNotes?: string;
  analysis_status?: DeductionStatus;
}

export interface VisualFinding {
  id: string;
  damageDescription: string;
  location: string;
  moveInObservation: string;
  moveOutObservation: string;
  classification: DamageClassification;
  confidence: 'high' | 'medium' | 'low';
  evidenceExplanation: string;
  associatedChargeIds: string[];
  moveInBox?: BoundingBox | null;
  moveOutBox?: BoundingBox | null;
}

export interface DeductionStatusDetail {
  status: DeductionStatus;
  statusLabel: string;
  reason: string;
  primaryFindingId?: string;
  disputableAmount: number;
}

export interface FinancialTotals {
  totalClaimed: number;
  supportedDisputeAmount: number;
  unsupportedOrNewAmount: number;
  uncertainAmount: number;
  disputedCount: number;
  acceptedOrUncertainCount: number;
  deductionStatuses: Record<string, DeductionStatusDetail>;
}

export type ResearchCategory =
  | 'company_policy'
  | 'statutory_law'
  | 'market_rate'
  | 'contractual_lease';

export interface ResearchSource {
  id: string;
  disputeId?: string;
  companyName: string;
  sourceUrl: string;
  sourceTitle: string;
  researchCategory: ResearchCategory;
  statement: string;
  publishedDate?: string;
  accessedDate: string;
  relationToCharge: string;
  limitations?: string;
  applicableChargeId?: string;
  isBindingLeaseOrLaw?: boolean;
}

export interface MarketPriceQuote {
  id: string;
  providerName: string;
  category: string;
  serviceDescription: string;
  priceRangeLow: number;
  priceRangeHigh: number;
  averagePrice: number;
  pricingMethod: string; // e.g. "per patch", "flat rate", "hourly"
  sourceUrl?: string;
  location: string;
  isUserEntered?: boolean;
  notes?: string;
  dateAccessed: string;
}

export interface PolicyComparisonItem {
  chargeId: string;
  description: string;
  landlordAmount: number;
  companyPolicyStatement?: string;
  companyPolicySource?: { title: string; url: string };
  marketRateLow?: number;
  marketRateHigh?: number;
  marketRateSource?: { name: string; url: string };
  photographicEvidence: string;
  aiAssessment: string;
  disputablePotential: 'high' | 'moderate' | 'unsupported';
}

export interface CaseMetadata {
  moveInDate?: string;
  moveOutDate?: string;
  roomName?: string;
  tenantName?: string;
  landlordName?: string; // Property Management Company
  propertyAddress?: string;
  city?: string;
  state?: string;
  depositAmount?: number;
  leaseDocumentName?: string;
  analyzedAt: string;
  isSyntheticDemo?: boolean;
}

export interface AnalysisResult {
  id?: string;
  comparable: boolean;
  roomComparisonNotes: string;
  findings: VisualFinding[];
  deductions: LandlordDeduction[];
  financialTotals: FinancialTotals;
  metadata: CaseMetadata;
  researchSources?: ResearchSource[];
  marketQuotes?: MarketPriceQuote[];
  policyComparisons?: PolicyComparisonItem[];
  moveInImageUrl?: string;
  moveOutImageUrl?: string;
}

export interface DisputeLetterDraft {
  subject: string;
  body: string;
  generatedAt: string;
  supportedDisputeAmount: number;
  totalClaimed: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  createdAt?: string;
}

export interface SavedDisputeCase {
  id: string;
  userId: string;
  propertyAddress: string;
  managementCompany: string;
  moveInDate?: string;
  moveOutDate?: string;
  depositAmount: number;
  totalDeductions: number;
  estimatedDisputedAmount: number;
  status: 'draft' | 'analyzed' | 'disputed' | 'resolved';
  createdAt: string;
  updatedAt: string;
  analysisResult: AnalysisResult;
}
