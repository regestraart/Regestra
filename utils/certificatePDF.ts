/**
 * generateCertificatePDF
 * Builds a styled Certificate of Authenticity PDF using the browser's
 * print/canvas pipeline — no external PDF library required.
 *
 * Opens a hidden iframe, writes the HTML, then triggers window.print()
 * scoped to that iframe so the user sees a print/save dialog.
 */

import type { Certificate } from '../services/certificates';

export async function generateCertificatePDF(cert: Certificate): Promise<void> {
  const html = buildCertificateHTML(cert);

  // Open a new window/tab with the certificate HTML — user can print/save as PDF
  const win = window.open('', '_blank');
  if (!win) {
    // Popup blocked fallback: download as .html
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Regestra-Certificate-${cert.cert_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  win.document.write(html);
  win.document.close();

  // Give fonts/images a moment to load then trigger print
  win.addEventListener('load', () => {
    setTimeout(() => win.print(), 400);
  });
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return 'Not disclosed';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function buildCertificateHTML(cert: Certificate): string {
  const verifyUrl = `https://regestra.com/verify/${cert.cert_number}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}&bgcolor=ffffff&color=4c1d95&margin=4`;

  const artworkImageHTML = cert.artwork_image_url
    ? `<img src="${cert.artwork_image_url}" alt="${cert.artwork_title}" class="artwork-image" />`
    : `<div class="artwork-placeholder">Artwork</div>`;

  const blockchainHTML = cert.tier === 'blockchain' && cert.blockchain_tx_hash
    ? `
      <div class="blockchain-badge">
        <div class="blockchain-icon">⛓</div>
        <div>
          <div class="blockchain-title">Blockchain Anchored · ${cert.blockchain_network ?? 'Polygon'}</div>
          <div class="blockchain-hash">${cert.blockchain_tx_hash}</div>
        </div>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificate of Authenticity — ${cert.cert_number}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      background: #f5f3ff;
      display: flex;
      justify-content: center;
      padding: 40px 20px;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .no-print { display: none !important; }
      .cert-page { box-shadow: none; margin: 0; }
    }

    /* Print instructions bar */
    .print-bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: #4c1d95; color: #fff; padding: 12px 24px;
      display: flex; align-items: center; justify-content: space-between;
      font-size: 14px; font-weight: 600;
    }
    .print-bar-btn {
      background: #fff; color: #4c1d95; border: none; border-radius: 8px;
      padding: 8px 18px; font-weight: 700; cursor: pointer; font-size: 14px;
    }
    @media print { .print-bar { display: none; } }

    .cert-page {
      background: #ffffff;
      width: 794px; /* A4 width */
      min-height: 1123px;
      padding: 60px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      position: relative;
      overflow: hidden;
      margin-top: 60px;
    }

    /* Corner decorations */
    .corner {
      position: absolute;
      width: 80px; height: 80px;
      border-color: #7c3aed;
      border-style: solid;
      opacity: 0.25;
    }
    .corner-tl { top: 20px; left: 20px; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
    .corner-tr { top: 20px; right: 20px; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
    .corner-bl { bottom: 20px; left: 20px; border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
    .corner-br { bottom: 20px; right: 20px; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }

    /* Header */
    .cert-header {
      text-align: center;
      padding-bottom: 28px;
      border-bottom: 1px solid #ede9fe;
      margin-bottom: 32px;
    }
    .cert-logo {
      font-family: 'Playfair Display', serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.25em;
      color: #7c3aed;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .cert-heading {
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      font-weight: 900;
      color: #1a1729;
      line-height: 1.1;
    }
    .cert-subheading {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.15em;
      color: #9ca3af;
      text-transform: uppercase;
      margin-top: 8px;
    }

    /* Body layout */
    .cert-body {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 36px;
      margin-bottom: 32px;
    }

    .artwork-image {
      width: 220px;
      height: 260px;
      object-fit: cover;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    .artwork-placeholder {
      width: 220px;
      height: 260px;
      background: #f3f0ff;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
      font-size: 14px;
    }

    .cert-details {}
    .cert-artwork-title {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      font-weight: 700;
      color: #1a1729;
      line-height: 1.2;
      margin-bottom: 4px;
    }
    .cert-artist-name {
      font-size: 14px;
      color: #7c3aed;
      font-weight: 600;
      margin-bottom: 24px;
    }

    .cert-field {
      margin-bottom: 14px;
    }
    .cert-field-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #9ca3af;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .cert-field-value {
      font-size: 14px;
      color: #1a1729;
      font-weight: 500;
      line-height: 1.4;
    }

    /* Divider */
    .cert-divider {
      height: 1px;
      background: #ede9fe;
      margin: 28px 0;
    }

    /* Bottom strip */
    .cert-bottom {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
      align-items: start;
    }

    .cert-hash-section {
      background: #f9f8ff;
      border: 1px solid #ede9fe;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .cert-hash-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #7c3aed;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .cert-hash-value {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      color: #4c1d95;
      word-break: break-all;
      line-height: 1.6;
    }
    .cert-number-display {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      font-weight: 700;
      color: #7c3aed;
      letter-spacing: 0.1em;
      margin-top: 8px;
    }

    .cert-qr {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .cert-qr img {
      width: 100px;
      height: 100px;
      border: 1px solid #ede9fe;
      border-radius: 8px;
    }
    .cert-qr-label {
      font-size: 9px;
      color: #9ca3af;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-align: center;
    }

    /* Blockchain badge */
    .blockchain-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 10px 14px;
      margin-top: 14px;
    }
    .blockchain-icon { font-size: 18px; }
    .blockchain-title {
      font-size: 11px;
      font-weight: 700;
      color: #15803d;
      margin-bottom: 3px;
    }
    .blockchain-hash {
      font-family: 'Courier New', monospace;
      font-size: 9px;
      color: #166534;
      word-break: break-all;
    }

    /* Footer */
    .cert-footer {
      margin-top: 28px;
      padding-top: 18px;
      border-top: 1px solid #ede9fe;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cert-footer-brand {
      font-family: 'Playfair Display', serif;
      font-size: 14px;
      font-weight: 700;
      color: #7c3aed;
    }
    .cert-footer-url {
      font-size: 11px;
      color: #9ca3af;
    }
    .cert-issued-date {
      font-size: 11px;
      color: #6b7280;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <span>Certificate of Authenticity — ${cert.cert_number}</span>
    <button class="print-bar-btn" onclick="window.print()">Save as PDF / Print</button>
  </div>

  <div class="cert-page">
    <!-- Corner decorations -->
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <!-- Header -->
    <div class="cert-header">
      <div class="cert-logo">Regestra</div>
      <div class="cert-heading">Certificate of Authenticity</div>
      <div class="cert-subheading">This certifies the original work described below</div>
    </div>

    <!-- Body -->
    <div class="cert-body">
      ${artworkImageHTML}

      <div class="cert-details">
        <div class="cert-artwork-title">${cert.artwork_title}</div>
        <div class="cert-artist-name">by ${cert.artist_name}${cert.artist_username ? ` (@${cert.artist_username})` : ''}</div>

        ${cert.artwork_year ? `
        <div class="cert-field">
          <div class="cert-field-label">Year</div>
          <div class="cert-field-value">${cert.artwork_year}</div>
        </div>` : ''}

        ${cert.artwork_medium ? `
        <div class="cert-field">
          <div class="cert-field-label">Medium</div>
          <div class="cert-field-value">${cert.artwork_medium}</div>
        </div>` : ''}

        ${cert.artwork_dimensions ? `
        <div class="cert-field">
          <div class="cert-field-label">Dimensions</div>
          <div class="cert-field-value">${cert.artwork_dimensions}</div>
        </div>` : ''}

        ${cert.artwork_description ? `
        <div class="cert-field">
          <div class="cert-field-label">Description</div>
          <div class="cert-field-value">${cert.artwork_description}</div>
        </div>` : ''}

        <div class="cert-divider"></div>

        <div class="cert-field">
          <div class="cert-field-label">Transferred to</div>
          <div class="cert-field-value">${cert.buyer_name}${cert.buyer_email ? `<span style="color:#7c3aed;margin-left:8px;font-size:13px">${cert.buyer_email}</span>` : ''}</div>
        </div>

        <div class="cert-field">
          <div class="cert-field-label">Sale date</div>
          <div class="cert-field-value">${formatDate(cert.sale_date)}</div>
        </div>

        ${cert.sale_price != null ? `
        <div class="cert-field">
          <div class="cert-field-label">Sale price</div>
          <div class="cert-field-value">${formatPrice(cert.sale_price)}</div>
        </div>` : ''}
      </div>
    </div>

    <!-- Hash + QR -->
    <div class="cert-bottom">
      <div>
        <div class="cert-hash-section">
          <div class="cert-hash-label">SHA-256 Integrity Hash</div>
          <div class="cert-hash-value">${cert.cert_hash}</div>
          <div class="cert-number-display">${cert.cert_number}</div>
        </div>
        ${blockchainHTML}
      </div>
      <div class="cert-qr">
        <img src="${qrUrl}" alt="Verify certificate" />
        <div class="cert-qr-label">Scan to verify</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="cert-footer">
      <div>
        <div class="cert-footer-brand">Regestra</div>
        <div class="cert-footer-url">regestra.com/verify/${cert.cert_number}</div>
      </div>
      <div class="cert-issued-date">
        Issued ${formatDate(cert.created_at)}<br />
        <span style="font-size:10px;color:#d1d5db;">Certificate ID: ${cert.id}</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}
