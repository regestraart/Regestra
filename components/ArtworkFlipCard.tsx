import React, { useId, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LogIn, UserPlus, ImageIcon, ArrowRight } from "lucide-react";
import { ArtworkPreviewModal } from "./ArtworkPreviewModal";

interface ArtworkFlipCardProps {
  src: string;
  index: number;
  isFlipped: boolean;
  onFlip: () => void;
  onUnflip: () => void;
}

const DURATION_MS = 450;
const RADIUS      = "16px";
const P           = "#7c3aed";
const P2          = "#6d28d9";
const T           = "#0d9488";

export const ArtworkFlipCard: React.FC<ArtworkFlipCardProps> = ({
  src,
  index,
  isFlipped,
  onFlip,
  onUnflip,
}) => {
  const labelId = useId();

  /* Show the "Get Details" button only after the flip animation finishes
     so it never appears mid-rotation or on the front face.              */
  const [backReady, setBackReady] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isFlipped) {
      timer = setTimeout(() => setBackReady(true), DURATION_MS);
    } else {
      setBackReady(false);
    }
    return () => clearTimeout(timer);
  }, [isFlipped]);

  /* Close modal when the card is unflipped from outside */
  useEffect(() => {
    if (!isFlipped) setShowModal(false);
  }, [isFlipped]);

  const handleCardClick = () => {
    if (isFlipped) onUnflip();
    else onFlip();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCardClick(); }
    if (e.key === "Escape" && isFlipped)      onUnflip();
  };

  return (
    <>
      {/* ── Styles injected once per class (no duplication risk) ─────── */}
      <style>{`
        .afc-scene {
          position: relative;
          width: 100%;
          padding-bottom: 125%;
          perspective: 1000px;
          border-radius: ${RADIUS};
        }

        .afc-inner {
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
          border-radius: ${RADIUS};
          transition:
            transform ${DURATION_MS}ms ease-in-out,
            box-shadow ${DURATION_MS}ms ease-in-out;
          will-change: transform;
          cursor: pointer;
          outline: none;
        }
        .afc-inner:focus-visible {
          box-shadow: 0 0 0 3px #fff, 0 0 0 5px ${P};
        }
        .afc-inner.flipped {
          transform: rotateY(180deg);
          box-shadow:
            0 20px 60px rgba(124,58,237,0.4),
            0 8px 24px rgba(13,148,136,0.25);
        }
        .afc-inner:not(.flipped) {
          box-shadow:
            0 4px 20px rgba(0,0,0,0.10),
            0 1px 4px rgba(0,0,0,0.06);
        }

        @media (prefers-reduced-motion: reduce) {
          .afc-inner { transition: none !important; }
        }

        .afc-face {
          position: absolute;
          inset: 0;
          border-radius: ${RADIUS};
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          overflow: hidden;
        }

        /* ── Front ── */
        .afc-front { background: #1a1a2e; }
        .afc-front img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center;
          display: block;
          transition: transform 500ms cubic-bezier(0.25,0.46,0.45,0.94);
          animation: afc-fadein 500ms ease forwards;
          animation-delay: calc(var(--cell-index, 0) * 60ms);
          opacity: 0;
        }
        .afc-inner:not(.flipped):hover .afc-front img,
        .afc-inner:not(.flipped):focus-visible .afc-front img {
          transform: scale(1.04);
        }
        .afc-hover-vignette {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 55%);
          opacity: 0; transition: opacity 300ms ease;
        }
        .afc-inner:not(.flipped):hover .afc-hover-vignette,
        .afc-inner:not(.flipped):focus-visible .afc-hover-vignette { opacity: 1; }
        .afc-hint {
          position: absolute; bottom: 12px; left: 50%;
          transform: translateX(-50%);
          background: rgba(124,58,237,0.82); backdrop-filter: blur(6px);
          color: #fff; font-size: 11px; font-weight: 600;
          letter-spacing: 0.04em; padding: 4px 12px;
          border-radius: 999px; white-space: nowrap;
          opacity: 0; transition: opacity 250ms ease; pointer-events: none;
        }
        .afc-inner:not(.flipped):hover .afc-hint,
        .afc-inner:not(.flipped):focus-visible .afc-hint { opacity: 1; }

        /* ── Back ── */
        .afc-back {
          transform: rotateY(180deg);
          background: linear-gradient(145deg, ${P2} 0%, ${P} 45%, ${T} 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 20px 18px; gap: 12px; text-align: center;
        }
        .afc-back::before {
          content: "";
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 80%, rgba(13,148,136,0.25) 0%, transparent 50%);
          pointer-events: none; border-radius: ${RADIUS};
        }
        .afc-back-icon {
          width: 46px; height: 46px; border-radius: 13px;
          background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.22);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .afc-back-title {
          font-size: clamp(0.95rem, 2.5vw, 1.15rem);
          font-weight: 800; color: #fff;
          letter-spacing: 0.01em; line-height: 1.2; margin: 0;
        }
        .afc-back-body {
          font-size: clamp(0.72rem, 1.8vw, 0.82rem);
          color: rgba(255,255,255,0.78); line-height: 1.6;
          margin: 0; max-width: 190px;
        }
        .afc-btn-row {
          display: flex; gap: 8px;
          flex-wrap: wrap; justify-content: center; width: 100%;
        }

        /* Log In — ghost */
        .afc-btn-login {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 999px;
          font-size: 0.78rem; font-weight: 700; color: #fff;
          background: rgba(255,255,255,0.14);
          border: 1.5px solid rgba(255,255,255,0.35);
          backdrop-filter: blur(8px);
          text-decoration: none; cursor: pointer;
          transition: background 200ms ease, border-color 200ms ease;
          white-space: nowrap;
        }
        .afc-btn-login:hover, .afc-btn-login:focus-visible {
          background: rgba(255,255,255,0.24);
          border-color: rgba(255,255,255,0.55); outline: none;
        }

        /* Sign Up — solid white */
        .afc-btn-signup {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 999px;
          font-size: 0.78rem; font-weight: 700; color: ${P};
          background: #fff; border: 1.5px solid transparent;
          text-decoration: none; cursor: pointer;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
          transition: box-shadow 200ms ease, transform 200ms ease;
          white-space: nowrap;
        }
        .afc-btn-signup:hover, .afc-btn-signup:focus-visible {
          box-shadow: 0 6px 20px rgba(0,0,0,0.25);
          transform: translateY(-1px); outline: none;
        }

        /* "Get Details" button — appears after flip completes */
        .afc-btn-details {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px; border-radius: 999px;
          font-size: 0.8rem; font-weight: 800;
          color: ${P};
          background: #fff;
          border: none; cursor: pointer;
          box-shadow: 0 4px 18px rgba(0,0,0,0.22);
          transition: box-shadow 200ms ease, transform 200ms ease, opacity 200ms ease;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
        }
        .afc-btn-details.ready {
          opacity: 1;
          pointer-events: auto;
          animation: afc-btnPop 260ms cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .afc-btn-details:hover, .afc-btn-details:focus-visible {
          box-shadow: 0 8px 28px rgba(0,0,0,0.28);
          transform: translateY(-2px); outline: none;
        }

        @keyframes afc-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes afc-btnPop {
          from { opacity: 0; transform: scale(0.82); }
          to   { opacity: 1; transform: scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .afc-front img              { animation: none; opacity: 1; }
          .afc-inner:not(.flipped):hover .afc-front img { transform: none !important; }
          .afc-btn-signup:hover       { transform: none !important; }
          .afc-btn-details:hover      { transform: none !important; }
          .afc-btn-details.ready      { animation: none; opacity: 1; }
        }
      `}</style>

      <div className="afc-scene">
        <div
          role="button"
          tabIndex={0}
          aria-pressed={isFlipped}
          aria-labelledby={labelId}
          className={`afc-inner${isFlipped ? " flipped" : ""}`}
          style={{ "--cell-index": index } as React.CSSProperties}
          onClick={handleCardClick}
          onKeyDown={handleKeyDown}
        >
          {/* ── FRONT ── */}
          <div className="afc-face afc-front">
            <img
              src={src}
              alt="Artwork"
              loading={index < 6 ? "eager" : "lazy"}
              decoding="async"
              onError={e => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=600&q=80";
              }}
            />
            <div className="afc-hover-vignette" />
            <span className="afc-hint">View details</span>
          </div>

          {/* ── BACK ── */}
          <div className="afc-face afc-back" onClick={e => e.stopPropagation()}>
            <div className="afc-back-icon" aria-hidden="true">
              <ImageIcon size={20} color="#fff" />
            </div>

            <p id={labelId} className="afc-back-title">Get Details</p>
            <p className="afc-back-body">
              Log in or sign up to view artwork details.
            </p>

            {/* "Get Details" — opens preview modal */}
            <button
              className={`afc-btn-details${backReady ? " ready" : ""}`}
              aria-label="Preview artwork details"
              onClick={e => { e.stopPropagation(); setShowModal(true); }}
              tabIndex={backReady ? 0 : -1}
            >
              Preview
              <ArrowRight size={13} />
            </button>

            {/* Auth links always visible once back shown */}
            <div className="afc-btn-row">
              <Link to="/login"    className="afc-btn-login"  onClick={e => e.stopPropagation()}><LogIn    size={12} />Log In</Link>
              <Link to="/sign-up"  className="afc-btn-signup" onClick={e => e.stopPropagation()}><UserPlus size={12} />Sign Up</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal portal — rendered outside the flip card ─────────────── */}
      {showModal && (
        <ArtworkPreviewModal
          src={src}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default ArtworkFlipCard;
