import React, { useEffect, useRef, useState } from "react";
import { X, Tag, User, ShoppingBag, CheckCircle, Trash2, Loader2, AlertTriangle, Award } from "lucide-react";
import { Artwork } from "../data/mock";
import { db } from "../services/db";
import { IssueCertificateModal } from "./IssueCertificateModal";
import type { Certificate } from "../services/certificates";

interface MarketplaceArtworkModalProps {
  artwork: Artwork;
  currentUserId?: string;
  onClose: () => void;
  onListingUpdate?: () => void;
}

const P  = "#7c3aed";
const P2 = "#6d28d9";
const T  = "#0d9488";

/* ── Confirm dialog ─────────────────────────────────────────────────────── */
const ConfirmDialog: React.FC<{
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}> = ({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, loading }) => (
  <>
    <style>{`
      .cdlg-backdrop {
        position: fixed; inset: 0; z-index: 1100;
        background: rgba(8,6,22,0.6); backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center; padding: 20px;
        animation: cdlg-in 160ms ease forwards;
      }
      @keyframes cdlg-in { from { opacity: 0; } to { opacity: 1; } }
      .cdlg-card {
        background: #fff; border-radius: 20px;
        padding: 28px 28px 24px;
        max-width: 380px; width: 100%;
        box-shadow: 0 24px 60px rgba(0,0,0,0.35);
        animation: cdlg-card-in 240ms cubic-bezier(0.22,1.2,0.36,1) forwards;
      }
      @keyframes cdlg-card-in {
        from { opacity: 0; transform: scale(0.9) translateY(12px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
    `}</style>
    <div className="cdlg-backdrop" onClick={onCancel}>
      <div className="cdlg-card" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <AlertTriangle size={20} color="#f59e0b" />
          <span style={{ fontWeight: 800, fontSize: "1rem", color: "#1a1729" }}>{title}</span>
        </div>
        <p style={{ fontSize: "0.88rem", color: "#6b7280", lineHeight: 1.6, margin: "0 0 22px" }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{ padding: "9px 18px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", fontSize: "0.85rem", fontWeight: 700, color: "#6b7280", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: confirmColor, fontSize: "0.85rem", fontWeight: 800, color: "#fff", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}
          >
            {loading && <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  </>
);

/* ── Main modal ─────────────────────────────────────────────────────────── */
export const MarketplaceArtworkModal: React.FC<MarketplaceArtworkModalProps> = ({
  artwork,
  currentUserId,
  onClose,
  onListingUpdate,
}) => {
  const modalRef    = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const isSeller = !!currentUserId && currentUserId === artwork.artistId;
  const isActive = artwork.listingStatus === "active" || (!artwork.listingStatus && artwork.listedForSale);
  const isSold   = artwork.listingStatus === "sold";

  const [confirm, setConfirm]   = useState<null | "sold" | "unlist" | "profile" | "delete">(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState<string | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [issuedCert, setIssuedCert]       = useState<Certificate | null>(null);

  /* Focus trap + ESC + body scroll lock */
  useEffect(() => {
    const timer = setTimeout(() => closeBtnRef.current?.focus(), 60);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (confirm) setConfirm(null); else onClose(); return; }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, a[href], input, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !el.hasAttribute("disabled"));
        if (!focusable.length) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
        else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
      }
    };
    document.addEventListener("keydown", handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { clearTimeout(timer); document.removeEventListener("keydown", handleKey); document.body.style.overflow = prev; };
  }, [onClose, confirm]);

  const handleMarkSold = async () => {
    if (!currentUserId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await db.artworks.markSold(artwork.id, currentUserId);
      setConfirm(null);
      onListingUpdate?.();
      // Open certificate issuing flow
      setShowCertModal(true);
    } catch (e: any) {
      setActionError(e.message || "Failed to mark as sold.");
      setConfirm(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlist = async () => {
    if (!currentUserId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await db.artworks.unlist(artwork.id, currentUserId);
      setConfirm(null);
      onListingUpdate?.();
    } catch (e: any) {
      setActionError(e.message || "Failed to remove listing.");
      setConfirm(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFromProfile = async () => {
    if (!currentUserId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await db.artworks.removeFromProfile(artwork.id, currentUserId);
      setConfirm(null);
      onListingUpdate?.();
      onClose();
    } catch (e: any) {
      setActionError(e.message || "Failed to remove from profile.");
      setConfirm(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEverywhere = async () => {
    if (!currentUserId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await db.artworks.deleteEverywhere(artwork.id, currentUserId);
      setConfirm(null);
      onListingUpdate?.();
      onClose();
    } catch (e: any) {
      setActionError(e.message || "Failed to delete everywhere.");
      setConfirm(null);
    } finally {
      setActionLoading(false);
    }
  };

  // For-sale listings: always show price (regardless of isPriceVisible).
  // Not-for-sale: respect isPriceVisible toggle.
  const showPrice = artwork.listedForSale
    ? artwork.price != null
    : (artwork.isPriceVisible !== false) && artwork.price != null;

  const formattedPrice = showPrice && artwork.price != null
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(artwork.price)
    : null;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .mam-backdrop {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(8, 6, 22, 0.72);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: mam-in 200ms ease forwards;
        }
        @keyframes mam-in { from { opacity: 0; } to { opacity: 1; } }

        .mam-card {
          position: relative;
          width: 100%; max-width: 860px;
          max-height: 90vh;
          background: #fff;
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.06);
          animation: mam-card-in 320ms cubic-bezier(0.22, 1.2, 0.36, 1) forwards;
        }
        @keyframes mam-card-in {
          from { opacity: 0; transform: scale(0.88) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mam-backdrop { animation: none; }
          .mam-card     { animation: none; }
        }

        .mam-image-pane {
          flex: 1 1 55%;
          position: relative;
          background: #0d0b1e;
          min-height: 420px;
          max-height: 90vh;
          overflow: hidden;
        }
        .mam-image-pane img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center;
          display: block;
        }

        .mam-detail-pane {
          flex: 1 1 45%;
          display: flex; flex-direction: column;
          overflow-y: auto;
          max-height: 90vh;
        }

        .mam-detail-header {
          padding: 28px 28px 0;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 24px;
        }

        .mam-title {
          font-size: clamp(1.2rem, 2.5vw, 1.5rem);
          font-weight: 900;
          color: #1a1729;
          line-height: 1.12;
          margin: 0 0 8px;
          letter-spacing: -0.028em;
        }
        .mam-artist {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.82rem; font-weight: 600; color: #6b7280;
        }

        .mam-body { padding: 22px 28px; flex: 1; display: flex; flex-direction: column; gap: 18px; }

        .mam-section-label {
          font-size: 10px; font-weight: 800; letter-spacing: 0.14em;
          text-transform: uppercase; color: #9ca3af; margin-bottom: 7px;
          display: flex; align-items: center; gap: 6px;
        }
        .mam-section-label::before {
          content: "";
          display: inline-block;
          width: 14px; height: 2px;
          border-radius: 1px;
          background: linear-gradient(90deg, #7c3aed, #0d9488);
          flex-shrink: 0;
        }
        .mam-description {
          font-size: 0.9rem; color: #374151; line-height: 1.82; font-weight: 400;
        }

        .mam-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .mam-tag {
          display: inline-flex; align-items: center; gap: 4px;
          background: #f3f4f6; color: #4b5563;
          font-size: 11px; font-weight: 700; letter-spacing: 0.04em;
          padding: 4px 10px; border-radius: 999px;
        }

        .mam-price-block {
          background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
          border: 1px solid rgba(124,58,237,0.18);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px;
        }
        .mam-price-label { font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: ${P}; }
        .mam-price-value { font-size: 1.8rem; font-weight: 900; color: ${P2}; letter-spacing: -0.03em; line-height: 1; }

        .mam-sold-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fef3c7; color: #b45309;
          font-size: 11px; font-weight: 800; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 6px 14px; border-radius: 999px;
          border: 1px solid rgba(180,83,9,0.2);
        }

        .mam-footer {
          padding: 20px 28px 28px;
          border-top: 1px solid #f3f4f6;
        }

        /* Seller action buttons */
        .mam-seller-actions {
          display: flex; flex-direction: column; gap: 10px;
        }
        .mam-btn-sold {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 20px; border-radius: 12px;
          font-size: 0.88rem; font-weight: 800; letter-spacing: 0.02em;
          background: linear-gradient(135deg, #059669, #0d9488);
          color: #fff; border: none; cursor: pointer;
          box-shadow: 0 4px 16px rgba(5,150,105,0.28);
          transition: opacity 180ms ease, transform 160ms ease;
        }
        .mam-btn-sold:hover { opacity: 0.9; transform: translateY(-1px); }
        .mam-btn-sold:disabled { background: #e5e7eb; color: #9ca3af; box-shadow: none; cursor: not-allowed; transform: none; opacity: 1; }

        .mam-btn-unlist {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 20px; border-radius: 12px;
          font-size: 0.88rem; font-weight: 700; letter-spacing: 0.01em;
          background: #fff; color: #ef4444;
          border: 1.5px solid rgba(239,68,68,0.3);
          cursor: pointer;
          transition: background 180ms ease, border-color 180ms ease, transform 160ms ease;
        }
        .mam-btn-unlist:hover { background: #fef2f2; border-color: #ef4444; transform: translateY(-1px); }
        .mam-btn-unlist:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .mam-buy-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 24px; border-radius: 14px;
          font-size: 0.92rem; font-weight: 800; letter-spacing: 0.02em;
          background: linear-gradient(135deg, ${P2}, ${P});
          color: #fff; border: none; cursor: pointer;
          box-shadow: 0 6px 24px rgba(124,58,237,0.32);
          transition: opacity 200ms ease, transform 180ms ease, box-shadow 200ms ease;
        }
        .mam-buy-btn:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 10px 32px rgba(124,58,237,0.4); }
        .mam-buy-btn:disabled {
          background: #e5e7eb; color: #9ca3af;
          box-shadow: none; cursor: not-allowed; transform: none; opacity: 1;
        }
        .mam-coming-soon {
          text-align: center; font-size: 11px; font-weight: 700;
          color: #9ca3af; letter-spacing: 0.05em; margin-top: 8px;
        }
        .mam-error-msg {
          font-size: 0.8rem; color: #ef4444; font-weight: 600;
          text-align: center; margin-top: 8px;
        }
        @media (prefers-reduced-motion: reduce) {
          .mam-buy-btn:hover, .mam-btn-sold:hover, .mam-btn-unlist:hover { transform: none !important; }
        }

        .mam-close {
          position: absolute; top: 14px; right: 14px; z-index: 10;
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15);
          backdrop-filter: blur(6px); color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 180ms ease;
        }
        .mam-close:hover, .mam-close:focus-visible {
          background: rgba(0,0,0,0.75);
          outline: none; box-shadow: 0 0 0 2px rgba(255,255,255,0.3);
        }

        @media (max-width: 640px) {
          .mam-card { flex-direction: column; max-width: 100%; }
          .mam-image-pane { min-height: 240px; flex: 0 0 240px; }
          .mam-detail-pane { max-height: none; }
        }
      `}</style>

      <div
        className="mam-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mam-title"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="mam-card" ref={modalRef}>

          {/* Image pane */}
          <div className="mam-image-pane">
            <img src={artwork.image} alt={artwork.title} />
            <button ref={closeBtnRef} className="mam-close" aria-label="Close" onClick={onClose}>
              <X size={15} />
            </button>
            {isSold && (
              <div style={{ position: "absolute", top: 14, left: 14 }}>
                <span className="mam-sold-badge"><CheckCircle size={12} /> Sold</span>
              </div>
            )}
          </div>

          {/* Detail pane */}
          <div className="mam-detail-pane">
            <div className="mam-detail-header">
              <h2 id="mam-title" className="mam-title">{artwork.title}</h2>
              {artwork.artistName && (
                <div className="mam-artist">
                  <User size={13} />
                  <span>{artwork.artistName}</span>
                </div>
              )}
            </div>

            <div className="mam-body">
              {/* Description */}
              {artwork.description && (
                <div>
                  <p className="mam-section-label">About this piece</p>
                  <p className="mam-description">{artwork.description}</p>
                </div>
              )}

              {/* Tags */}
              {artwork.tags && artwork.tags.length > 0 && (
                <div>
                  <p className="mam-section-label">Tags</p>
                  <div className="mam-tags">
                    {artwork.tags.map(tag => (
                      <span key={tag} className="mam-tag">
                        <Tag size={9} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              {formattedPrice && (
                <div className="mam-price-block">
                  <div>
                    <p className="mam-price-label">{isSold ? "Sold for" : "List price"}</p>
                    <p className="mam-price-value">{formattedPrice}</p>
                  </div>
                  <ShoppingBag size={28} color={P} style={{ opacity: 0.45 }} />
                </div>
              )}
            </div>

            {/* CTA / seller footer */}
            <div className="mam-footer">
              {isSeller ? (
                <div className="mam-seller-actions">
                  {isActive && (
                    <button
                      className="mam-btn-sold"
                      disabled={actionLoading}
                      onClick={() => setConfirm("sold")}
                    >
                      {actionLoading ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <CheckCircle size={15} />}
                      Mark as Sold
                    </button>
                  )}
                  {isSold && !issuedCert && (
                    <button
                      className="mam-btn-sold"
                      disabled={actionLoading}
                      onClick={() => setShowCertModal(true)}
                      style={{ background: "linear-gradient(135deg, #7c3aed, #0d9488)" }}
                    >
                      <Award size={15} />
                      Issue Certificate of Authenticity
                    </button>
                  )}
                  {isSold && issuedCert && (
                    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.82rem", color:"#059669", fontWeight:700, padding:"6px 0" }}>
                      <CheckCircle size={14} />
                      Certificate issued · {issuedCert.cert_number}
                    </div>
                  )}
                  <button
                    className="mam-btn-unlist"
                    disabled={actionLoading}
                    onClick={() => setConfirm("unlist")}
                  >
                    {actionLoading ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={15} />}
                    Remove Listing
                  </button>

                  <button
                    className="mam-btn-unlist"
                    disabled={actionLoading}
                    onClick={() => setConfirm("profile")}
                    title="Remove from your profile only"
                  >
                    {actionLoading ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <User size={15} />}
                    Remove from Profile
                  </button>

                  <button
                    className="mam-btn-unlist"
                    disabled={actionLoading}
                    onClick={() => setConfirm("delete")}
                    title="Delete everywhere"
                  >
                    {actionLoading ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={15} />}
                    Delete everywhere
                  </button>
                  {actionError && <p className="mam-error-msg">{actionError}</p>}
                </div>
              ) : (
                <>
                  <button className="mam-buy-btn" disabled aria-disabled="true">
                    <ShoppingBag size={16} />
                    Buy Now
                  </button>
                  <p className="mam-coming-soon">Checkout coming soon</p>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Confirm dialogs */}
      {confirm === "sold" && (
        <ConfirmDialog
          title="Mark as Sold?"
          message="This will mark the listing as sold. It will no longer appear in the Marketplace for other users."
          confirmLabel="Mark as Sold"
          confirmColor="#059669"
          onConfirm={handleMarkSold}
          onCancel={() => setConfirm(null)}
          loading={actionLoading}
        />
      )}
      {confirm === "unlist" && (
        <ConfirmDialog
          title="Remove Listing?"
          message="This will unlist the artwork from the Marketplace. The artwork will remain in your profile but will no longer be visible for sale."
          confirmLabel="Remove Listing"
          confirmColor="#ef4444"
          onConfirm={handleUnlist}
          onCancel={() => setConfirm(null)}
          loading={actionLoading}
        />
      )}

      {confirm === "profile" && (
        <ConfirmDialog
          title="Remove from Profile?"
          message="This hides the artwork from your profile. It will stay listed on the Marketplace until you remove the listing."
          confirmLabel="Remove from Profile"
          confirmColor="#111827"
          onConfirm={handleRemoveFromProfile}
          onCancel={() => setConfirm(null)}
          loading={actionLoading}
        />
      )}

      {confirm === "delete" && (
        <ConfirmDialog
          title="Delete everywhere?"
          message="This removes the artwork from both your profile and the Marketplace and deletes the image. This cannot be undone."
          confirmLabel="Delete everywhere"
          confirmColor="#ef4444"
          onConfirm={handleDeleteEverywhere}
          onCancel={() => setConfirm(null)}
          loading={actionLoading}
        />
      )}

      {/* Certificate issuing modal — opens automatically after Mark as Sold */}
      {showCertModal && currentUserId && (
        <IssueCertificateModal
          artwork={{
            id: artwork.id,
            title: artwork.title,
            image: artwork.image,
            description: artwork.description,
            price: artwork.price,
          }}
          artist={{
            id: currentUserId,
            name: artwork.artistName ?? "Artist",
          }}
          onClose={() => setShowCertModal(false)}
          onIssued={(cert) => {
            setIssuedCert(cert);
            setShowCertModal(false);
          }}
        />
      )}
    </>
  );
};

export default MarketplaceArtworkModal;
