import { supabase } from '../lib/supabase';

export interface CertificatePayload {
  artwork_id: string;
  artist_id: string;
  artwork_title: string;
  artwork_image_url?: string;
  artwork_description?: string;
  artwork_medium?: string;
  artwork_dimensions?: string;
  artwork_year?: string;
  sale_price?: number | null;
  sale_date?: string; // ISO date string YYYY-MM-DD
  buyer_profile_id?: string | null;
  buyer_name: string;
  buyer_email?: string;
  artist_name: string;
  artist_username?: string;
  tier?: 'basic' | 'blockchain';
}

export interface Certificate {
  id: string;
  cert_number: string;
  artwork_id: string;
  artist_id: string;
  artwork_title: string;
  artwork_image_url?: string;
  artwork_description?: string;
  artwork_medium?: string;
  artwork_dimensions?: string;
  artwork_year?: string;
  sale_price?: number | null;
  sale_date: string;
  buyer_profile_id?: string | null;
  buyer_name: string;
  buyer_email?: string;
  artist_name: string;
  artist_username?: string;
  cert_hash: string;
  is_revoked: boolean;
  revoked_at?: string;
  revoked_reason?: string;
  blockchain_network?: string;
  blockchain_tx_hash?: string;
  blockchain_anchored_at?: string;
  tier: 'basic' | 'blockchain';
  created_at: string;
}

// ── Hashing ──────────────────────────────────────────────────────────────────
// Produces a SHA-256 hex digest of the canonical certificate payload.
// This is what gets anchored on-chain (or stored as proof of integrity).
export async function hashCertPayload(payload: CertificatePayload, certNumber: string): Promise<string> {
  const canonical = JSON.stringify({
    cert_number: certNumber,
    artwork_id: payload.artwork_id,
    artist_id: payload.artist_id,
    artwork_title: payload.artwork_title,
    sale_price: payload.sale_price ?? null,
    sale_date: payload.sale_date ?? new Date().toISOString().split('T')[0],
    buyer_name: payload.buyer_name,
    buyer_email: payload.buyer_email ?? '',
    artist_name: payload.artist_name,
  });
  const encoded = new TextEncoder().encode(canonical);
  const hashBuf = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Generate cert number (client-side fallback) ───────────────────────────
function clientGenCertNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return `RG-${new Date().getFullYear()}-${result}`;
}

// ── DB operations ─────────────────────────────────────────────────────────
export const certDb = {
  async create(payload: CertificatePayload): Promise<Certificate> {
    // 1. Generate cert number (try DB function first, fallback to client)
    let certNumber: string;
    try {
      const { data } = await supabase.rpc('generate_cert_number');
      certNumber = data ?? clientGenCertNumber();
    } catch {
      certNumber = clientGenCertNumber();
    }

    // 2. Hash
    const certHash = await hashCertPayload(payload, certNumber);

    // 3. Insert — owner_id = buyer if on Regestra, otherwise artist holds it
    const owner_id = payload.buyer_profile_id ?? payload.artist_id;

    const { data, error } = await supabase
      .from('certificates')
      .insert({
        ...payload,
        cert_number: certNumber,
        cert_hash: certHash,
        sale_date: payload.sale_date ?? new Date().toISOString().split('T')[0],
        tier: payload.tier ?? 'basic',
        owner_id,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data as Certificate;
  },

  async getByArtwork(artworkId: string): Promise<Certificate | null> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('artwork_id', artworkId)
      .eq('is_revoked', false)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Certificate | null;
  },

  async getByCertNumber(certNumber: string): Promise<Certificate | null> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('cert_number', certNumber)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Certificate | null;
  },

  async getByArtist(artistId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Certificate[];
  },

  async revoke(certId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('certificates')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_reason: reason,
      })
      .eq('id', certId);
    if (error) throw new Error(error.message);
  },

  // Called after blockchain anchoring succeeds
  async updateBlockchainAnchor(certId: string, network: string, txHash: string): Promise<void> {
    const { error } = await supabase
      .from('certificates')
      .update({
        blockchain_network: network,
        blockchain_tx_hash: txHash,
        blockchain_anchored_at: new Date().toISOString(),
        tier: 'blockchain',
      })
      .eq('id', certId);
    if (error) throw new Error(error.message);
  },

  // Get all certificates for an artwork (provenance chain — shows ownership history)
  async getProvenanceHistory(artworkTitle: string, artistId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('artist_id', artistId)
      .ilike('artwork_title', artworkTitle)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Certificate[];
  },

  // Get all certificates for a specific artwork ID
  async getAllByArtwork(artworkId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('artwork_id', artworkId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Certificate[];
  },
  async getAll(limit = 50, offset = 0): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('is_revoked', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return (data ?? []) as Certificate[];
  },

  // Featured = blockchain-anchored certs first, then most recent
  async getFeatured(limit = 20): Promise<Certificate[]> {
    // First get blockchain certs
    const { data: blockchain } = await supabase
      .from('certificates')
      .select('*')
      .eq('is_revoked', false)
      .eq('tier', 'blockchain')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Then fill with recent basic certs if needed
    const blockchainCerts = (blockchain ?? []) as Certificate[];
    if (blockchainCerts.length >= limit) return blockchainCerts;

    const remaining = limit - blockchainCerts.length;
    const blockchainIds = blockchainCerts.map(c => c.id);
    const { data: basic } = await supabase
      .from('certificates')
      .select('*')
      .eq('is_revoked', false)
      .eq('tier', 'basic')
      .order('created_at', { ascending: false })
      .limit(remaining);

    return [...blockchainCerts, ...((basic ?? []) as Certificate[])];
  },

  // Search by cert number, artist name, artwork title, or buyer name
  async search(query: string, limit = 20): Promise<Certificate[]> {
    const q = query.trim();
    if (!q) return this.getFeatured(limit);
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('is_revoked', false)
      .or(
        `cert_number.ilike.%${q}%,artwork_title.ilike.%${q}%,artist_name.ilike.%${q}%,buyer_name.ilike.%${q}%`
      )
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as Certificate[];
  },

  async getTotalCount(): Promise<number> {
    const { count } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true })
      .eq('is_revoked', false);
    return count ?? 0;
  },

  // Verify cert integrity client-side (re-hash and compare)
  async verify(certNumber: string): Promise<{
    valid: boolean;
    cert: Certificate | null;
    hashMatch: boolean;
    message: string;
  }> {
    const cert = await this.getByCertNumber(certNumber);
    if (!cert) return { valid: false, cert: null, hashMatch: false, message: 'Certificate not found.' };
    if (cert.is_revoked) return { valid: false, cert, hashMatch: false, message: 'This certificate has been revoked.' };

    // Re-compute hash from stored fields
    const recomputed = await hashCertPayload(
      {
        artwork_id: cert.artwork_id,
        artist_id: cert.artist_id,
        artwork_title: cert.artwork_title,
        sale_price: cert.sale_price,
        sale_date: cert.sale_date,
        buyer_name: cert.buyer_name,
        buyer_email: cert.buyer_email,
        artist_name: cert.artist_name,
        artist_username: cert.artist_username,
      },
      cert.cert_number
    );

    const hashMatch = recomputed === cert.cert_hash;
    return {
      valid: hashMatch,
      cert,
      hashMatch,
      message: hashMatch ? 'Certificate is authentic.' : 'Certificate data has been tampered with.',
    };
  },

  // ── Wallet methods ──────────────────────────────────────────────────────────

  // Certs owned by a user (where owner_id = userId)
  async getOwned(userId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_revoked', false)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Certificate[];
  },

  // Certs issued by a user as artist
  async getIssued(userId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('artist_id', userId)
      .eq('is_revoked', false)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Certificate[];
  },

  // Full transfer history for a cert
  async getTransferHistory(certId: string): Promise<CertTransfer[]> {
    const { data, error } = await supabase
      .from('cert_transfers')
      .select('*')
      .eq('cert_id', certId)
      .order('transferred_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as CertTransfer[];
  },

  // Transfer a certificate to a new owner
  async transfer(
    certId: string,
    fromUserId: string,
    transfer: {
      to_user_id?: string | null;
      to_name: string;
      to_username?: string;
      transfer_type: 'sale' | 'transfer' | 'gift' | 'external';
      sale_price?: number | null;
      sale_date: string;
      artwork_medium?: string;
      artwork_dimensions?: string;
      artwork_year?: string;
      artwork_description?: string;
      note?: string;
    }
  ): Promise<void> {
    // 1. Get current cert to validate ownership
    const { data: cert, error: fetchErr } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certId)
      .single();
    if (fetchErr || !cert) throw new Error('Certificate not found.');
    if (cert.owner_id !== fromUserId && cert.artist_id !== fromUserId) {
      throw new Error('You do not own this certificate.');
    }

    // 2. Record the transfer history
    const fromProfile = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', fromUserId)
      .single();
    const fromName = fromProfile.data?.full_name || fromProfile.data?.username || 'Unknown';

    const { error: transferErr } = await supabase
      .from('cert_transfers')
      .insert({
        cert_id: certId,
        from_user_id: fromUserId,
        to_user_id: transfer.to_user_id ?? null,
        from_name: fromName,
        to_name: transfer.to_name,
        to_username: transfer.to_username ?? null,
        transfer_type: transfer.transfer_type,
        sale_price: transfer.sale_price ?? null,
        sale_date: transfer.sale_date,
        artwork_medium: transfer.artwork_medium ?? null,
        artwork_dimensions: transfer.artwork_dimensions ?? null,
        artwork_year: transfer.artwork_year ?? null,
        artwork_description: transfer.artwork_description ?? null,
        note: transfer.note ?? null,
      });
    if (transferErr) throw new Error(transferErr.message);

    // 3. Update certificate ownership
    const { error: updateErr } = await supabase
      .from('certificates')
      .update({
        owner_id: transfer.to_user_id ?? null,
        buyer_name: transfer.to_name,
        buyer_email: transfer.to_username ? `@${transfer.to_username.replace(/^@/, '')}` : null,
        buyer_profile_id: transfer.to_user_id ?? null,
        sale_price: transfer.sale_price ?? cert.sale_price,
        sale_date: transfer.sale_date,
      })
      .eq('id', certId);
    if (updateErr) throw new Error(updateErr.message);

    // 4. If new owner is on Regestra, add artwork to their collection
    if (transfer.to_user_id && cert.artwork_image_url) {
      try {
        const { error: collErr } = await supabase.rpc('add_to_collection', {
          p_user_id: transfer.to_user_id,
          p_artwork: {
            id: cert.artwork_id ?? cert.id,
            title: cert.artwork_title,
            artistName: cert.artist_name,
            image: cert.artwork_image_url,
            description: cert.artwork_description,
          },
        });
        if (collErr) console.warn('Collection add failed (non-fatal):', collErr.message);
      } catch { /* non-fatal */ }
    }
  },
};

// ── Types ────────────────────────────────────────────────────────────────────
export interface CertTransfer {
  id: string;
  cert_id: string;
  from_user_id?: string;
  to_user_id?: string;
  from_name: string;
  to_name: string;
  to_username?: string;
  transfer_type: 'sale' | 'transfer' | 'gift' | 'external';
  sale_price?: number | null;
  sale_date: string;
  artwork_medium?: string;
  artwork_dimensions?: string;
  artwork_year?: string;
  artwork_description?: string;
  note?: string;
  transferred_at: string;
}
