import { supabase } from '../lib/supabase';

export interface VerificationRequest {
  id: string;
  user_id: string;
  full_legal_name: string;
  website_url?: string;
  instagram_url?: string;
  portfolio_url?: string;
  statement: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  // joined from profiles
  profiles?: {
    full_name: string;
    username: string;
    avatar_url?: string;
    email?: string;
  };
}

export const verificationDb = {

  // Get current user's request
  async getMyRequest(userId: string): Promise<VerificationRequest | null> {
    const { data, error } = await supabase
      .from('artist_verification_requests')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as VerificationRequest | null;
  },

  // Submit a new verification request
  async submit(userId: string, payload: {
    full_legal_name: string;
    website_url?: string;
    instagram_url?: string;
    portfolio_url?: string;
    statement: string;
  }): Promise<VerificationRequest> {
    const { data, error } = await supabase
      .from('artist_verification_requests')
      .upsert({
        user_id: userId,
        ...payload,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        reviewed_by: null,
        rejection_reason: null,
      }, { onConflict: 'user_id' })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as VerificationRequest;
  },

  // Admin: get all requests with profile info (uses SECURITY DEFINER to bypass RLS)
  async getAll(status?: 'pending' | 'approved' | 'rejected'): Promise<VerificationRequest[]> {
    // Try the RPC function first (bypasses RLS)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_verification_requests', {
      p_status: status ?? null,
    });

    if (!rpcError && rpcData) {
      return ((rpcData ?? []) as any[]).map(row => ({
        id: row.id,
        user_id: row.user_id,
        full_legal_name: row.full_legal_name,
        website_url: row.website_url,
        instagram_url: row.instagram_url,
        portfolio_url: row.portfolio_url,
        statement: row.statement,
        status: row.status,
        submitted_at: row.submitted_at,
        reviewed_at: row.reviewed_at,
        reviewed_by: row.reviewed_by,
        rejection_reason: row.rejection_reason,
        profiles: {
          full_name: row.profile_full_name,
          username: row.profile_username,
          avatar_url: row.profile_avatar_url,
        },
      })) as VerificationRequest[];
    }

    // Fallback: direct query
    console.warn('RPC failed, falling back to direct query:', rpcError?.message);
    let q = supabase
      .from('artist_verification_requests')
      .select('*, profiles(full_name, username, avatar_url)')
      .order('submitted_at', { ascending: false });
    if (status) q = (q as any).eq('status', status);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as VerificationRequest[];
  },

  // Admin: approve
  async approve(requestId: string, adminEmail: string): Promise<void> {
    const { error } = await supabase.rpc('approve_artist_verification', {
      p_request_id: requestId,
      p_admin_email: adminEmail,
    });
    if (error) throw new Error(error.message);
  },

  // Admin: reject
  async reject(requestId: string, adminEmail: string, reason: string): Promise<void> {
    const { error } = await supabase.rpc('reject_artist_verification', {
      p_request_id: requestId,
      p_admin_email: adminEmail,
      p_reason: reason,
    });
    if (error) throw new Error(error.message);
  },
};
