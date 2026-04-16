# Regestra v26 — Deployment Guide
## Certificates · Subscriptions · Solana Anchor Program

---

## What's new in this build

| File | Purpose |
|------|---------|
| `supabase_certificates.sql` | Certificates table, RLS, cert number generator |
| `supabase_subscriptions.sql` | Subscriptions table, tier limits view, auto-provision trigger |
| `services/certificates.ts` | Certificate DB layer + SHA-256 hashing |
| `services/subscriptions.ts` | Subscription DB layer + tier pricing constants |
| `context/SubscriptionContext.tsx` | Tier-aware React context (wrap in App.tsx) |
| `components/IssueCertificateModal.tsx` | Issue cert UI — gated by subscription tier |
| `components/SubscribeModal.tsx` | 3-tier pricing modal (Starter / Creator / Pro) |
| `components/MarketplaceArtworkModal.tsx` | Updated — triggers cert modal after Mark as Sold |
| `pages/VerifyCertificate.tsx` | Public cert verification page at `/verify/:certNumber` |
| `pages/Subscription.tsx` | Subscription management page at `/subscription` |
| `lib/solana.ts` | Solana client — calls deployed Anchor program |
| `netlify/functions/anchor-certificate.ts` | Serverless function — anchors cert hash to Solana |
| `utils/certificatePDF.ts` | PDF certificate generator (print-to-PDF via browser) |
| `App.tsx` | Updated — adds `SubscriptionProvider`, new routes |
| `package.json` | Updated — adds `@solana/web3.js`, `bs58` |
| `anchor/` | Full Anchor workspace — Rust program + TypeScript tests |

---

## Step 1 — Supabase migrations

Run these **in order** in your Supabase SQL Editor:

```
1. supabase_certificates.sql
2. supabase_subscriptions.sql
```

Both are idempotent — safe to re-run if needed.

After running, verify in Supabase Table Editor:
- `certificates` table exists with all columns
- `subscriptions` table exists
- `subscription_limits` view exists
- Every existing user now has a `starter` subscription row (backfill runs automatically)

---

## Step 2 — Solana Anchor program deployment

### Prerequisites (install once on your machine)

```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 2. Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# 3. Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# 4. Verify
anchor --version   # should show anchor-cli 0.30.x
solana --version
```

### Generate & fund platform wallet

```bash
# Generate a new keypair for the Regestra platform wallet
solana-keygen new --outfile ~/.config/solana/regestra-platform.json

# Set as default wallet
solana config set --keypair ~/.config/solana/regestra-platform.json

# Point to devnet
solana config set --url devnet

# Fund with devnet SOL (for account creation fees)
solana airdrop 2

# Get the base58 private key (you'll need this for .env.local)
cat ~/.config/solana/regestra-platform.json
# This outputs a JSON array — convert to base58:
node -e "
const key = require(process.env.HOME + '/.config/solana/regestra-platform.json');
const bs58 = require('bs58');
console.log(bs58.encode(Buffer.from(key)));
"
```

### Build and deploy

```bash
cd anchor

# Install JS dependencies
yarn install

# Build the Rust program
anchor build

# Get the program ID from the generated keypair
solana address -k target/deploy/regestra-keypair.json
# Output: REGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (your actual program ID)

# Update Anchor.toml — replace the placeholder program ID with the real one
# Update programs/regestra/src/lib.rs — replace declare_id!() with the real one

# Rebuild with correct program ID
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test --provider.cluster devnet
```

### After deployment — update your config

1. Copy the program ID output from `solana address -k target/deploy/regestra-keypair.json`
2. Update `.env.local`:
   ```
   VITE_SOLANA_PROGRAM_ID=YOUR_ACTUAL_PROGRAM_ID
   VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
   ```
3. Set `PLATFORM_WALLET_SECRET` in **Netlify dashboard** (not in .env):
   - Netlify → Site settings → Environment variables
   - Key: `PLATFORM_WALLET_SECRET`
   - Value: base58 private key from above

### Mainnet deployment (when ready)

```bash
# Switch to mainnet
solana config set --url mainnet-beta

# Fund the platform wallet with real SOL (~0.1 SOL covers thousands of certs)
# Transfer SOL to: $(solana address)

# Deploy
anchor deploy --provider.cluster mainnet

# Update .env.local
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

---

## Step 3 — Frontend wiring

### Install new dependencies

```bash
cd regestra_output
npm install
# Installs @solana/web3.js and bs58
```

### Add Subscription link to your nav

In `layout/Layout.tsx` (or wherever your nav lives), add:

```tsx
import { useSubscription } from '../context/SubscriptionContext';

// Inside the component:
const { tier } = useSubscription();

// In the nav:
<Link to="/subscription">
  {tier === 'starter' ? 'Upgrade' : 'Subscription'}
</Link>
```

### Add solanaAddress to artist prop in MarketplaceArtworkModal

The `IssueCertificateModal` accepts `artist.solanaAddress` for Pro-tier blockchain anchoring.
Pass the artist's Solana wallet address if they've connected one, or use the platform wallet
as a placeholder until artists connect wallets in Phase 2.

```tsx
// In MarketplaceArtworkModal, update the IssueCertificateModal call:
artist={{
  id: currentUserId,
  name: artwork.artistName ?? "Artist",
  solanaAddress: currentUser?.solanaAddress ?? platformWalletAddress,
}}
```

---

## Step 4 — Stripe integration (Creator / Pro payments)

The subscription modal has stub calls ready. To activate:

### 1. Create products in Stripe dashboard
- Creator: $10/mo recurring
- Pro: $25/mo recurring
- Copy the Price IDs to `.env.local`

### 2. Add Stripe to package.json
```bash
npm install @stripe/stripe-js
```

### 3. Create Netlify function `netlify/functions/create-checkout.ts`

```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const handler = async (event) => {
  const { userId, tier, successUrl, cancelUrl } = JSON.parse(event.body);
  const priceId = tier === 'pro'
    ? process.env.STRIPE_PRICE_PRO
    : process.env.STRIPE_PRICE_CREATOR;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, tier },
  });

  return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
};
```

### 4. Add webhook handler `netlify/functions/stripe-webhook.ts`

```typescript
// Handles checkout.session.completed → calls subscriptionDb.upgrade()
// Set STRIPE_WEBHOOK_SECRET in Netlify env vars
```

### 5. Replace the stub in SubscribeModal.tsx

```typescript
// Replace the simulate comment with:
const res = await fetch('/.netlify/functions/create-checkout', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    tier: selected,
    successUrl: `${window.location.origin}/#/subscription?success=true`,
    cancelUrl: `${window.location.origin}/#/subscription`,
  }),
});
const { url } = await res.json();
window.location.href = url;
```

---

## Step 5 — REG token payment (Phase 2)

The `SubscribeModal` has a REG payment toggle already wired. To activate:

1. Deploy the REG SPL token: `spl-token create-token --decimals 6`
2. Integrate Phantom wallet: `npm install @solana/wallet-adapter-react`
3. On payment, transfer REG from user wallet → platform burn address
4. Confirm tx, then call `subscriptionDb.upgradeWithReg(userId, tier, txHash)`

The burn address receives the tokens and the Solana program tracks retirement.

---

## Tier summary

| Feature | Starter | Creator ($10/mo) | Pro ($25/mo) |
|---------|---------|-----------------|-------------|
| Artwork listings | 5 | Unlimited | Unlimited |
| Certificate issuance | ✗ | ✓ SHA-256 + PDF | ✓ Solana anchored |
| Verified Artist badge | ✗ | ✓ | ✓ |
| Analytics dashboard | ✗ | ✓ | ✓ |
| Blockchain provenance | ✗ | ✗ | ✓ |
| Resale royalty tracking | ✗ | ✗ | ✓ 1.5% |
| API access | ✗ | ✗ | ✓ |
| REG discount | ✗ | 20% | 20% |

---

## Certificate flow (end to end)

```
Artist marks work as sold
  → IssueCertificateModal opens
  → useSubscription() checks tier
     Starter → paywall → SubscribeModal
     Creator → issue cert (SHA-256, PDF only)
     Pro     → issue cert + anchor to Solana
                 → anchorCertificateViaApi()
                 → Netlify function → Solana devnet/mainnet
                 → tx hash stored in certificates.blockchain_tx_hash
  → PDF downloaded by artist
  → QR code on PDF → regestra.com/#/verify/RG-YYYY-XXXXXX
  → VerifyCertificate page → certDb.verify() → SHA-256 recompute
  → If Pro: shows Solana tx hash + PolygonScan link
```

---

## File structure (new files only)

```
regestra_output/
├── App.tsx                              ← Updated (SubscriptionProvider + routes)
├── package.json                         ← Updated (+solana/web3.js, bs58)
├── .env.local                           ← Updated (Solana + Stripe vars)
├── supabase_certificates.sql            ← NEW — run first
├── supabase_subscriptions.sql           ← NEW — run second
├── context/
│   └── SubscriptionContext.tsx          ← NEW
├── services/
│   ├── certificates.ts                  ← NEW
│   └── subscriptions.ts                 ← NEW
├── lib/
│   └── solana.ts                        ← NEW
├── netlify/functions/
│   └── anchor-certificate.ts            ← NEW
├── components/
│   ├── IssueCertificateModal.tsx        ← NEW
│   ├── SubscribeModal.tsx               ← NEW
│   └── MarketplaceArtworkModal.tsx      ← UPDATED
├── pages/
│   ├── VerifyCertificate.tsx            ← NEW
│   └── Subscription.tsx                 ← NEW
└── utils/
    └── certificatePDF.ts                ← NEW

anchor/                                  ← NEW Anchor workspace
├── Anchor.toml
├── Cargo.toml
├── package.json
├── tsconfig.json
├── programs/regestra/
│   ├── Cargo.toml
│   └── src/lib.rs                       ← Full Rust program
└── tests/
    └── regestra.ts                      ← TypeScript tests
```
