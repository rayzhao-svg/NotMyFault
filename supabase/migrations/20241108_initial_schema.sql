-- Supabase PostgreSQL Migration for NotMyFault
-- Run this migration in your Supabase SQL Editor or via Supabase CLI

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz default now()
);

-- 2. Disputes Table
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  property_address text not null,
  management_company text,
  move_in_date text,
  move_out_date text,
  deposit_amount numeric(10,2) default 0.00,
  total_deductions numeric(10,2) default 0.00,
  status text default 'analyzed',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Deductions Table
create table if not exists public.deductions (
  id text primary key,
  dispute_id uuid references public.disputes(id) on delete cascade,
  description text not null,
  amount numeric(10,2) not null,
  analysis_status text default 'needs_evidence'
);

-- 4. Evidence Table
create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid references public.disputes(id) on delete cascade,
  image_type text not null, -- 'move_in', 'move_out', 'lease_doc', 'repair_quote'
  private_storage_path text not null,
  uploaded_at timestamptz default now()
);

-- 5. Analysis Results Table
create table if not exists public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid references public.disputes(id) on delete cascade,
  structured_findings jsonb not null,
  estimated_disputed_amount numeric(10,2) default 0.00,
  created_at timestamptz default now()
);

-- 6. Research Sources Table
create table if not exists public.research_sources (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid references public.disputes(id) on delete cascade,
  company_name text,
  source_url text,
  source_title text,
  research_category text, -- 'company_policy', 'statutory_law', 'market_rate', 'contractual_lease'
  findings text,
  retrieved_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_disputes_user_id on public.disputes(user_id);
create index if not exists idx_deductions_dispute_id on public.deductions(dispute_id);
create index if not exists idx_evidence_dispute_id on public.evidence(dispute_id);
create index if not exists idx_analysis_results_dispute_id on public.analysis_results(dispute_id);
create index if not exists idx_research_sources_dispute_id on public.research_sources(dispute_id);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.disputes enable row level security;
alter table public.deductions enable row level security;
alter table public.evidence enable row level security;
alter table public.analysis_results enable row level security;
alter table public.research_sources enable row level security;

-- RLS Policies for Profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- RLS Policies for Disputes
create policy "Users can view their own disputes"
  on public.disputes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own disputes"
  on public.disputes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own disputes"
  on public.disputes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own disputes"
  on public.disputes for delete
  using (auth.uid() = user_id);

-- RLS Policies for Child Tables via Dispute Ownership
create policy "Users can view deductions of their own disputes"
  on public.deductions for select
  using (dispute_id in (select id from public.disputes where user_id = auth.uid()));

create policy "Users can insert deductions into their own disputes"
  on public.deductions for insert
  with check (dispute_id in (select id from public.disputes where user_id = auth.uid()));

create policy "Users can delete deductions of their own disputes"
  on public.deductions for delete
  using (dispute_id in (select id from public.disputes where user_id = auth.uid()));

create policy "Users can view evidence of their own disputes"
  on public.evidence for select
  using (dispute_id in (select id from public.disputes where user_id = auth.uid()));

create policy "Users can insert evidence into their own disputes"
  on public.evidence for insert
  with check (dispute_id in (select id from public.disputes where user_id = auth.uid()));

create policy "Users can view analysis results of their own disputes"
  on public.analysis_results for select
  using (dispute_id in (select id from public.disputes where user_id = auth.uid()));

create policy "Users can insert analysis results into their own disputes"
  on public.analysis_results for insert
  with check (dispute_id in (select id from public.disputes where user_id = auth.uid()));

create policy "Users can view research sources of their own disputes"
  on public.research_sources for select
  using (dispute_id in (select id from public.disputes where user_id = auth.uid()));

create policy "Users can insert research sources into their own disputes"
  on public.research_sources for insert
  with check (dispute_id in (select id from public.disputes where user_id = auth.uid()));

-- Automatic profile creation on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile after signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
