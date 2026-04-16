import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, LogIn, UserPlus, Lock } from "lucide-react";

interface AuthGateModalProps {
  src: string;
  onClose: () => void;
}

const P  = "#7c3aed";
const P2 = "#6d28d9";
const P3 = "#5b21b6";
const T  = "#0d9488";
const T2 = "#0f766e";

export const AuthGateModal: React.FC<AuthGateModalProps> = ({ src, onClose }) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef    = useRef<HTMLDivElement>(null);

  /* Auto-focus close button + focus trap + ESC + body scroll lock */
  useEffect(() => {
    // Small delay so the modal entrance animation has started before focus
    const focusTimer = setTimeout(() => closeBtnRef.current?.focus(), 60);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, a[href], [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !el.hasAttribute("disabled"));

        if (focusable.length === 0) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <>
      <style>{`
        /* ── Backdrop ──────────────────────────────────────────────── */
        .agm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(8, 6, 22, 0.78);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: agm-backdropIn 200ms ease forwards;
        }

        @keyframes agm-backdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Modal card ────────────────────────────────────────────── */
        .agm-card {
          position: relative;
          width: 100%;
          max-width: 440px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 40px 100px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.07);
          animation: agm-cardIn 340ms cubic-bezier(0.22, 1.2, 0.36, 1) forwards;
          transform-origin: center center;
        }

        @keyframes agm-cardIn {
          from {
            opacity: 0;
            transform: scale(0.82) translateY(20px) rotateY(-6deg);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0) rotateY(0deg);
          }
        }

        @keyframes agm-cardOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.9) translateY(12px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .agm-backdrop { animation: none; }
          .agm-card     { animation: none; }
        }

        /* ── Thumbnail strip ───────────────────────────────────────── */
        .agm-thumb {
          position: relative;
          width: 100%;
          padding-bottom: 46%;
          overflow: hidden;
          background: #0d0b1e;
        }

        .agm-thumb img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          filter: brightness(0.5) saturate(0.7);
          transform: scale(1.06);
        }

        /* Gradient over thumbnail fading into the panel below */
        .agm-thumb::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0; right: 0;
          height: 70%;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(88, 28, 135, 0.85) 100%
          );
        }

        /* Centred lock icon sits over thumbnail */
        .agm-lock {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .agm-lock-ring {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.28);
          border: 1.5px solid rgba(196, 181, 253, 0.45);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 0 32px rgba(124, 58, 237, 0.5),
            0 0 60px rgba(124, 58, 237, 0.2);
        }

        /* ── Body panel ────────────────────────────────────────────── */
        .agm-body {
          position: relative;
          background: linear-gradient(145deg, ${P3} 0%, ${P2} 40%, ${P} 70%, ${T} 100%);
          padding: 32px 32px 36px;
          text-align: center;
          overflow: hidden;
        }

        /* Glow layers inside body */
        .agm-body::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 15% 25%, rgba(255,255,255,0.1) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 80%, rgba(13,148,136,0.28) 0%, transparent 50%);
          pointer-events: none;
        }

        /* Dot grid */
        .agm-body::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px);
          background-size: 20px 20px;
          pointer-events: none;
        }

        .agm-body-inner {
          position: relative;
          z-index: 1;
        }

        .agm-heading {
          font-size: clamp(1.15rem, 3vw, 1.45rem);
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.02em;
          line-height: 1.12;
          margin: 0 0 12px;
        }

        .agm-subtext {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.78);
          line-height: 1.65;
          margin: 0 auto 28px;
          max-width: 300px;
        }

        /* ── CTA row ───────────────────────────────────────────────── */
        .agm-cta-row {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Log In — ghost outline */
        .agm-btn-login {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 11px 26px;
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 700;
          color: #fff;
          background: rgba(255, 255, 255, 0.12);
          border: 1.5px solid rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(6px);
          text-decoration: none;
          transition: background 200ms ease, border-color 200ms ease, transform 180ms ease;
          white-space: nowrap;
        }
        .agm-btn-login:hover,
        .agm-btn-login:focus-visible {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.55);
          transform: translateY(-1px);
          outline: none;
        }

        /* Sign Up — solid white */
        .agm-btn-signup {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 11px 26px;
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 700;
          color: ${P};
          background: #fff;
          border: 1.5px solid transparent;
          text-decoration: none;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.22);
          transition: box-shadow 200ms ease, transform 180ms ease;
          white-space: nowrap;
        }
        .agm-btn-signup:hover,
        .agm-btn-signup:focus-visible {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          transform: translateY(-2px);
          outline: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .agm-btn-login:hover  { transform: none !important; }
          .agm-btn-signup:hover { transform: none !important; }
        }

        /* ── Close button ──────────────────────────────────────────── */
        .agm-close {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 10;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(6px);
          color: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 180ms ease, color 180ms ease, box-shadow 180ms ease;
        }
        .agm-close:hover,
        .agm-close:focus-visible {
          background: rgba(0, 0, 0, 0.65);
          color: #fff;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.22);
          outline: none;
        }
      `}</style>

      <div
        className="agm-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to view artwork details"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="agm-card" ref={modalRef}>

          {/* Close button */}
          <button
            ref={closeBtnRef}
            className="agm-close"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={15} />
          </button>

          {/* Artwork thumbnail — blurred + dimmed */}
          <div className="agm-thumb">
            <img src={src} alt="" aria-hidden="true" />
            <div className="agm-lock" aria-hidden="true">
              <div className="agm-lock-ring">
                <Lock size={20} color="#fff" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* CTA panel */}
          <div className="agm-body">
            <div className="agm-body-inner">
              <h2 className="agm-heading">Sign in to view details</h2>
              <p className="agm-subtext">
                Log in or sign up to see artwork details and engage with the community.
              </p>
              <div className="agm-cta-row">
                <Link to="/login" className="agm-btn-login" onClick={onClose}>
                  <LogIn size={14} />
                  Log In
                </Link>
                <Link to="/sign-up" className="agm-btn-signup" onClick={onClose}>
                  <UserPlus size={14} />
                  Sign Up
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AuthGateModal;
