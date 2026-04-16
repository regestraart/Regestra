/**
 * lib/solana.ts
 * Regestra Solana client — calls the Netlify anchor-certificate function
 * which mints a Metaplex NFT on Solana as a Certificate of Authenticity.
 *
 * The platform wallet secret lives ONLY in Netlify env vars (server-side).
 * Users never need a Solana wallet — Regestra signs on their behalf.
 *
 * Environment variables (.env.local):
 *   VITE_SOLANA_RPC_URL  — Helius devnet RPC URL (for display/verification only)
 */

export interface AnchorCertParams {
  certNumber:           string;   // "RG-2026-AYCNGQ"
  artworkTitle:         string;
  artistName:           string;
  buyerName:            string;
  saleDate:             string;   // "YYYY-MM-DD"
  salePrice?:           number | null;
  certHash:             string;   // SHA-256 hex (64 chars)
  artworkImageUrl?:     string;
  artworkMedium?:       string;
  artworkDimensions?:   string;
  artworkYear?:         string;
  artworkDescription?:  string;
}

export interface AnchorResult {
  txHash:       string;
  mintAddress:  string;
  network:      string;
  certPda:      string;
  anchoredAt:   string;
  explorerUrl:  string;
}

/**
 * Anchor a Regestra certificate to Solana via the Netlify serverless function.
 * Metaplex mints an NFT with the cert metadata — no custom program needed.
 */
export async function anchorCertificateViaApi(
  params: AnchorCertParams
): Promise<AnchorResult> {
  const res = await fetch("/.netlify/functions/anchor-certificate", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? `Solana anchor failed (${res.status})`);
  }

  return res.json();
}

/**
 * Build the Solscan explorer URL for a transaction or mint address.
 */
export function getSolscanUrl(
  address: string,
  type: "tx" | "token" = "tx",
  network: string = "solana-devnet"
): string {
  const cluster = network.includes("mainnet") ? "" : "?cluster=devnet";
  return type === "token"
    ? `https://solscan.io/token/${address}${cluster}`
    : `https://solscan.io/tx/${address}${cluster}`;
}

// Keep backwards compat — old code called anchorCertificateViaApi with different shape
export { anchorCertificateViaApi as anchorCertificate };
