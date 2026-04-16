/**
 * utils/certMetadata.ts
 * Builds the NFT metadata JSON for a Regestra Certificate of Authenticity.
 * This metadata is stored on-chain via Metaplex and visible on Solscan/explorers.
 */

export interface CertNftMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{ trait_type: string; value: string | number }>;
  properties: {
    category: string;
    creators: Array<{ address: string; share: number }>;
  };
}

export interface CertMetadataParams {
  certNumber: string;       // e.g. "RG-2026-AYCNGQ"
  artworkTitle: string;
  artistName: string;
  artistWallet: string;     // platform wallet pubkey
  buyerName: string;
  saleDate: string;
  salePrice?: number | null;
  certHash: string;         // SHA-256 hex
  artworkImageUrl?: string;
  artworkMedium?: string;
  artworkDimensions?: string;
  artworkYear?: string;
  artworkDescription?: string;
}

// Regestra branded certificate badge image (hosted on regestra.com)
// Replace with actual IPFS/Arweave URI once uploaded
const CERT_BADGE_IMAGE = 'https://regestra.com/cert-badge.png';

export function buildCertMetadata(params: CertMetadataParams): CertNftMetadata {
  const verifyUrl = `https://regestra.com/verify/${params.certNumber}`;

  const attributes: Array<{ trait_type: string; value: string | number }> = [
    { trait_type: 'Certificate Number',   value: params.certNumber },
    { trait_type: 'Artwork Title',        value: params.artworkTitle },
    { trait_type: 'Artist',               value: params.artistName },
    { trait_type: 'Acquired By',          value: params.buyerName },
    { trait_type: 'Sale Date',            value: params.saleDate },
    { trait_type: 'Integrity Hash',       value: params.certHash },
    { trait_type: 'Issued By',            value: 'Regestra' },
    { trait_type: 'Platform',             value: 'regestra.com' },
  ];

  if (params.salePrice != null) {
    attributes.push({ trait_type: 'Sale Price (USD)', value: params.salePrice });
  }
  if (params.artworkMedium) {
    attributes.push({ trait_type: 'Medium', value: params.artworkMedium });
  }
  if (params.artworkDimensions) {
    attributes.push({ trait_type: 'Dimensions', value: params.artworkDimensions });
  }
  if (params.artworkYear) {
    attributes.push({ trait_type: 'Year Created', value: params.artworkYear });
  }

  const description = [
    `Certificate of Authenticity issued by Regestra for "${params.artworkTitle}" by ${params.artistName}.`,
    params.artworkDescription ? `\n\n${params.artworkDescription}` : '',
    `\n\nVerify this certificate at: ${verifyUrl}`,
    `\n\nIntegrity Hash (SHA-256): ${params.certHash}`,
  ].join('');

  return {
    name:         `Regestra COA · ${params.certNumber}`,
    symbol:       'RGCOA',
    description:  description.trim(),
    image:        params.artworkImageUrl ?? CERT_BADGE_IMAGE,
    external_url: verifyUrl,
    attributes,
    properties: {
      category: 'certificate',
      creators: [
        { address: params.artistWallet, share: 100 },
      ],
    },
  };
}
