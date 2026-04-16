import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { LogIn, UserPlus, X, Lock, Eye } from "lucide-react";

interface ArtworkPreviewModalProps {
  src: string;
  onClose: () => void;
}

const P  = "#7c3aed";
const P2 = "#6d28d9";
const P3 = "#5b21b6";
const T  = "#0d9488";

export const ArtworkPreviewModal: React.FC<ArtworkPreviewModalProps> = ({ src, onClose }) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef    = useRef<HTMLDivElement>(null);

  /* Focus trap + Escape to close */
  useEffect(() => {
    closeBtnRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }

      /* trap Tab inside modal */
      if (e.key === "Tab" && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            "button, a, [tabindex]:not([tabindex='-1'])"
          )
        );
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    /* prevent body scroll while open */
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <>
      <style>{`
        /* ── Backdrop ────────────────────────────────────────────── */
        .apm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(10, 8, 28, 0.82);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: apm-backdropIn 220ms ease forwards;
        }

        @keyframes apm-backdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Modal shell ─────────────────────────────────────────── */
        .apm-modal {
          position: relative;
          width: 100%;
          max-width: 520px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 32px 80px rgba(0, 0, 0, 0.55),
            0 0 0 1px rgba(255, 255, 255, 0.08);
          animation: apm-modalIn 300ms cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
          transform-origin: center bottom;
        }

        @keyframes apm-modalIn {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .apm-backdrop { animation: none; }
          .apm-modal    { animation: none; }
        }

        /* ── Artwork preview area ────────────────────────────────── */
        .apm-image-area {
          position: relative;
          width: 100%;
          padding-bottom: 62%;   /* ~16:10 preview crop */
          background: #0d0b1e;
          overflow: hidden;
        }

        .apm-image-area img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          filter: blur(14px) brightness(0.45) saturate(0.8);
          transform: scale(1.08);  /* hide blur edge artefacts */
        }

        /* Gradient vignette over blurred image */
        .apm-image-area::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(10, 8, 28, 0.1) 0%,
            rgba(10, 8, 28, 0.7) 100%
          );
        }

        /* Lock badge centred on image */
        .apm-lock-badge {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .apm-lock-ring {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.22);
          border: 1.5px solid rgba(124, 58, 237, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 28px rgba(124, 58, 237, 0.4);
        }

        .apm-lock-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.55);
        }

        /* Small "preview available" pill in top-left of image */
        .apm-preview-pill {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 3;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(8px);
          color: rgba(255, 255, 255, 0.75);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.03em;
          padding: 4px 12px;
          border-radius: 999px;
        }

        /* ── Bottom content panel ────────────────────────────────── */
        .apm-panel {
          position: relative;
          background: linear-gradient(145deg, ${P3} 0%, ${P2} 45%, ${P} 75%, ${T} 100%);
          padding: 32px 32px 36px;
          text-align: center;
          overflow: hidden;
        }

        /* Radial glows inside panel */
        .apm-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 15% 30%, rgba(255,255,255,0.09) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 75%, rgba(13,148,136,0.25) 0%, transparent 50%);
          pointer-events: none;
        }

        /* Dot-grid texture */
        .apm-panel::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 22px 22px;
          pointer-events: none;
        }

        .apm-panel-inner {
          position: relative;
          z-index: 1;
        }

        .apm-heading {
          font-size: clamp(1.15rem, 3vw, 1.45rem);
          font-weight: 900;
          color: #fff;
          margin: 0 0 10px;
          line-height: 1.2;
          letter-spacing: 0.01em;
        }

        .apm-subtext {
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.78);
          line-height: 1.65;
          margin: 0 auto 28px;
          max-width: 300px;
        }

        .apm-cta-row {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Ghost / outline button — Log In */
        .apm-btn-login {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 11px 24px;
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 700;
          color: #fff;
          background: rgba(255, 255, 255, 0.12);
          border: 1.5px solid rgba(255, 255, 255, 0.32);
          backdrop-filter: blur(6px);
          text-decoration: none;
          cursor: pointer;
          transition: background 200ms ease, border-color 200ms ease, transform 180ms ease;
          white-space: nowrap;
        }
        .apm-btn-login:hover,
        .apm-btn-login:focus-visible {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.5);
          outline: none;
          transform: translateY(-1px);
        }

        /* Solid white — Sign Up */
        .apm-btn-signup {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 11px 24px;
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 700;
          color: ${P};
          background: #fff;
          border: 1.5px solid transparent;
          text-decoration: none;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          transition: box-shadow 200ms ease, transform 180ms ease;
          white-space: nowrap;
        }
        .apm-btn-signup:hover,
        .apm-btn-signup:focus-visible {
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
          transform: translateY(-2px);
          outline: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .apm-btn-login:hover,
          .apm-btn-signup:hover { transform: none !important; }
        }

        /* ── Close button ────────────────────────────────────────── */
        .apm-close {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 10;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(6px);
          color: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 180ms ease, color 180ms ease;
        }
        .apm-close:hover,
        .apm-close:focus-visible {
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          outline: none;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.25);
        }
      `}</style>

      {/* Backdrop — click outside to close */}
      <div
        className="apm-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Artwork preview — login required"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="apm-modal" ref={modalRef}>

          {/* Close button */}
          <button
            ref={closeBtnRef}
            className="apm-close"
            aria-label="Close preview"
            onClick={onClose}
          >
            <X size={16} />
          </button>

          {/* Blurred artwork preview */}
          <div className="apm-image-area">
            <img src={src} alt="" aria-hidden="true" />

            {/* Preview pill */}
            <div className="apm-preview-pill" aria-hidden="true">
              <Eye size={11} />
              Preview
            </div>

            {/* Centred lock */}
            <div className="apm-lock-badge" aria-hidden="true">
              <div className="apm-lock-ring">
                <Lock size={22} color="#fff" />
              </div>
              <span className="apm-lock-label">Members only</span>
            </div>
          </div>

          {/* CTA panel */}
          <div className="apm-panel">
            <div className="apm-panel-inner">
              <h2 className="apm-heading">Unlock Artwork Details</h2>
              <p className="apm-subtext">
                Create a free account to view the full image, artist profile,
                and artwork information.
              </p>
              <div className="apm-cta-row">
                <Link to="/login" className="apm-btn-login" onClick={onClose}>
                  <LogIn size={14} />
                  Log In
                </Link>
                <Link to="/sign-up" className="apm-btn-signup" onClick={onClose}>
                  <UserPlus size={14} />
                  Sign Up — it is free
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default ArtworkPreviewModal;
