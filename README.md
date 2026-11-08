# NotMyFault 🛡️
> **Don't pay for damage you didn't cause.**

**NotMyFault** is a consumer-finance security deposit defense platform. When landlords withhold deposit money for preexisting wear or inflated repair fees, NotMyFault pairs move-in and move-out photos, cross-references published company damage policies and statutory wear-and-tear laws, benchmarks local market repair prices, and generates an evidence-backed dispute dossier to help tenants recover their funds.

---

## Key Capabilities

1. **AI Photographic Audit**:
   - Compares move-in baseline photos against move-out inspection images.
   - Detects preexisting wall blemishes, wear-and-tear, or tenant-responsible damage.
   - Normalizes bounding boxes (0–1000 scale) for visual highlighting.

2. **Published Damage Policy & Statutory Research**:
   - Researches property management company published wear-and-tear policies and move-out fee schedules.
   - Cites applicable state security deposit statutes (e.g. Texas Property Code § 92.104, § 92.109 bad-faith penalties, 30-day statutory return deadlines).
   - Distinguishes binding lease provisions & law from non-binding industry benchmarks.

3. **Repair Cost Benchmarks & Quotes**:
   - Searches local market repair quotes (e.g. Austin drywall patch rates, professional carpet extraction).
   - Displays price ranges, pricing methods (per patch, flat rate, hourly), and provider sources.
   - Allows tenants to input their own real contractor quotes with notes for direct comparison.

4. **Tenant Accounts & PostgreSQL Cloud / Local Session**:
   - Secure authentication via Supabase Auth (Sign Up, Sign In, Password Reset, Profile Management, Account Deletion).
   - PostgreSQL schema with Row Level Security for `profiles`, `disputes`, `deductions`, `evidence`, `analysis_results`, and `research_sources`.
   - Seamless offline/local session fallback when Supabase keys are not configured.
   - Tenant dashboard to save cases, reopen past disputes, track recovery potential, and download reports.

5. **Instant 1-Click Working Demo ("Try Sample Case")**:
   - Full Austin apartment case ($350 wall repaint disputable, $250 carpet cleaning review).
   - Works immediately out of the box with zero setup or API keys required.

6. **Evidence-Backed Dispute Letter & Printable PDF Report**:
   - Professional formal demand letter ready to copy or download as `.txt`.
   - Complete printable evidence dossier (`window.print()`) for PDF export or certified mail delivery.

---

## Quick Start

### 1. Installation & Running

```bash
cd /Users/yuanruizhao/.gemini/antigravity/scratch/deposit-detective

# Start the application server
npm run dev

# Or build and run for production
npm run build && npm run start
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Environment Configuration

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

- **Gemini API Key** (Required for live photo analysis & live policy research):
  ```env
  GEMINI_API_KEY=AIzaSy...
  ```
  *(Obtain a key from [Google AI Studio](https://aistudio.google.com/app/apikey))*

- **Supabase Credentials** (Optional for PostgreSQL cloud database persistence):
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  ```

---

## Automated Verification

Run the comprehensive test suite verifying financial math, policy research, sample case data, and API endpoints:

```bash
node test-suite.js
```
