import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, SavedDisputeCase } from '../types/deposit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local fallback user storage key for demonstration/development without cloud setup
const LOCAL_USER_KEY = 'notmyfault_auth_user';
const LOCAL_DISPUTES_KEY = 'notmyfault_saved_disputes';

export async function getCurrentUser(): Promise<UserProfile | null> {
  if (isSupabaseConfigured && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email || '',
      displayName: user.user_metadata?.display_name || user.email?.split('@')[0],
      createdAt: user.created_at,
    };
  }

  // Client-side local storage fallback
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(LOCAL_USER_KEY);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export async function signUpUser(email: string, password: string, displayName?: string): Promise<{ user: UserProfile | null; error: string | null }> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] },
      },
    });
    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: 'User creation failed' };

    const profile: UserProfile = {
      id: data.user.id,
      email: data.user.email || email,
      displayName: displayName || email.split('@')[0],
      createdAt: data.user.created_at,
    };
    return { user: profile, error: null };
  }

  // Local fallback
  const mockUser: UserProfile = {
    id: `local-user-${Date.now()}`,
    email,
    displayName: displayName || email.split('@')[0],
    createdAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
  }
  return { user: mockUser, error: null };
}

export async function signInUser(email: string, password: string): Promise<{ user: UserProfile | null; error: string | null }> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: 'Login failed' };

    const profile: UserProfile = {
      id: data.user.id,
      email: data.user.email || email,
      displayName: data.user.user_metadata?.display_name || email.split('@')[0],
      createdAt: data.user.created_at,
    };
    return { user: profile, error: null };
  }

  // Local fallback
  const mockUser: UserProfile = {
    id: 'local-demo-user',
    email,
    displayName: email.split('@')[0],
    createdAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
  }
  return { user: mockUser, error: null };
}

export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_USER_KEY);
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; message: string }> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Password reset link sent to your email.' };
  }
  return {
    success: true,
    message: 'Demo mode: Password reset request simulated for ' + email + '.',
  };
}

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  if (userId && isSupabaseConfigured && supabase) {
    // If Supabase service role is available, user deletion can occur via RPC or server route
    const { error } = await supabase.rpc('delete_user', { user_id: userId });
    if (error) {
      await supabase.auth.signOut();
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_DISPUTES_KEY);
  }
  return { success: true };
}

// ----------------- Disputes Database Operations -----------------

export async function fetchUserDisputes(userId: string): Promise<SavedDisputeCase[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('disputes')
      .select(`
        *,
        analysis_results (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      return data.map((d) => ({
        id: d.id,
        userId: d.user_id,
        propertyAddress: d.property_address,
        managementCompany: d.management_company || 'Property Manager',
        moveInDate: d.move_in_date,
        moveOutDate: d.move_out_date,
        depositAmount: Number(d.deposit_amount) || 0,
        totalDeductions: Number(d.total_deductions) || 0,
        estimatedDisputedAmount: Number(d.analysis_results?.[0]?.estimated_disputed_amount) || 0,
        status: d.status || 'analyzed',
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        analysisResult: d.analysis_results?.[0]?.structured_findings || {},
      }));
    }
  }

  // Local storage fallback
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_DISPUTES_KEY);
    if (raw) {
      try {
        const all: SavedDisputeCase[] = JSON.parse(raw);
        return all.filter((c) => c.userId === userId || userId === 'local-demo-user' || c.userId.startsWith('local-'));
      } catch {
        return [];
      }
    }
  }
  return [];
}

export async function saveDisputeCase(
  caseData: Omit<SavedDisputeCase, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SavedDisputeCase> {
  const caseId = `case-${Date.now()}`;
  const newCase: SavedDisputeCase = {
    ...caseData,
    id: caseId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: disputeRow, error: dispError } = await supabase
        .from('disputes')
        .insert({
          user_id: caseData.userId,
          property_address: caseData.propertyAddress,
          management_company: caseData.managementCompany,
          move_in_date: caseData.moveInDate,
          move_out_date: caseData.moveOutDate,
          deposit_amount: caseData.depositAmount,
          total_deductions: caseData.totalDeductions,
          status: caseData.status,
        })
        .select()
        .single();

      if (!dispError && disputeRow) {
        newCase.id = disputeRow.id;
        // Save analysis result row
        await supabase.from('analysis_results').insert({
          dispute_id: disputeRow.id,
          structured_findings: caseData.analysisResult,
          estimated_disputed_amount: caseData.estimatedDisputedAmount,
        });

        // Save deductions
        if (caseData.analysisResult?.deductions) {
          const deductionRows = caseData.analysisResult.deductions.map((d) => ({
            id: `${disputeRow.id}-${d.id}`,
            dispute_id: disputeRow.id,
            description: d.description,
            amount: d.amount,
            analysis_status: caseData.analysisResult.financialTotals?.deductionStatuses?.[d.id]?.status || 'needs_evidence',
          }));
          await supabase.from('deductions').insert(deductionRows);
        }
      }
    } catch {
      // Continue to local storage if remote fails
    }
  }

  // Always sync to client-side localStorage as reliable offline/session cache
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_DISPUTES_KEY);
    const list: SavedDisputeCase[] = raw ? JSON.parse(raw) : [];
    const updated = [newCase, ...list.filter((c) => c.id !== newCase.id)];
    localStorage.setItem(LOCAL_DISPUTES_KEY, JSON.stringify(updated));
  }

  return newCase;
}

export async function deleteDisputeCase(caseId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('disputes').delete().eq('id', caseId);
  }
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_DISPUTES_KEY);
    if (raw) {
      try {
        const list: SavedDisputeCase[] = JSON.parse(raw);
        const filtered = list.filter((c) => c.id !== caseId);
        localStorage.setItem(LOCAL_DISPUTES_KEY, JSON.stringify(filtered));
      } catch {
        // Ignored
      }
    }
  }
  return true;
}
