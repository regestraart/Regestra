/**
 * netlify/functions/anchor-certificate.ts
 *
 * Mints an NFT on Solana devnet via Metaplex as a
 * Certificate of Authenticity anchor for Regestra.
 *
 * No custom Anchor program needed — uses Metaplex's mpl-token-metadata
 * which is already deployed on devnet and mainnet.
 *
 * Environment variables (Netlify dashboard only, never in .env):
 *   PLATFORM_WALLET_SECRET  — base58 private key of platform Solana wallet
 *   SOLANA_RPC_URL          — Helius RPC endpoint
 */

import type { Handler } from "@netlify/functions";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  keypairIdentity,
  generateSigner,
  percentAmount,
} from "@metaplex-foundation/umi";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { buildCertMetadata } from "../../utils/certMetadata";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const NETWORK = RPC_URL.includes("mainnet") ? "solana-mainnet" : "solana-devnet";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const params = JSON.parse(event.body ?? "{}");
    const {
      certNumber, artworkTitle, artistName, buyerName,
      saleDate, salePrice, certHash, artworkImageUrl,
      artworkMedium, artworkDimensions, artworkYear, artworkDescription,
    } = params;

    if (!certNumber || !certHash || !artworkTitle || !artistName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const secret = process.env.PLATFORM_WALLET_SECRET;
    if (!secret) throw new Error("PLATFORM_WALLET_SECRET not configured");

    // Load platform wallet
    const platformKeypair = Keypair.fromSecretKey(bs58.decode(secret));

    // Initialize Metaplex UMI with Helius RPC
    const umi = createUmi(RPC_URL).use(mplTokenMetadata());
    umi.use(keypairIdentity(fromWeb3JsKeypair(platformKeypair)));

    // Build Regestra branded NFT metadata
    const metadata = buildCertMetadata({
      certNumber,
      artworkTitle,
      artistName,
      artistWallet: platformKeypair.publicKey.toBase58(),
      buyerName: buyerName ?? "Unknown",
      saleDate: saleDate ?? new Date().toISOString().split("T")[0],
      salePrice,
      certHash,
      artworkImageUrl,
      artworkMedium,
      artworkDimensions,
      artworkYear,
      artworkDescription,
    });

    // Use the Regestra verify URL as the metadata URI
    // This keeps the transaction small while still linking to full cert data
    // For mainnet: upload full JSON to Arweave/IPFS and use that URI instead
    const metadataUri = `https://regestra.com/verify/${certNumber}`;

    // Keep name short to reduce transaction size
    const nftName = `RG COA ${certNumber}`;
    const nftSymbol = `RGCOA`;

    // Generate unique mint keypair for this certificate
    const mint = generateSigner(umi);

    // Mint the certificate NFT
    const { signature } = await createNft(umi, {
      mint,
      name:                  nftName,
      symbol:                nftSymbol,
      uri:                   metadataUri,
      sellerFeeBasisPoints:  percentAmount(1.5),
      isMutable:             false,
    }).sendAndConfirm(umi, {
      confirm: { commitment: "confirmed" },
    });

    const txHash      = bs58.encode(signature);
    const mintAddress = mint.publicKey.toString();
    const explorerUrl = `https://solscan.io/token/${mintAddress}${
      NETWORK === "solana-devnet" ? "?cluster=devnet" : ""
    }`;

    console.log(`✅ Regestra COA minted | cert: ${certNumber} | mint: ${mintAddress} | tx: ${txHash}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        txHash,
        mintAddress,
        network:    NETWORK,
        certPda:    mintAddress,
        anchoredAt: new Date().toISOString(),
        explorerUrl,
      }),
    };

  } catch (e: any) {
    console.error("Metaplex anchor error:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message ?? "Certificate anchor failed" }),
    };
  }
};
