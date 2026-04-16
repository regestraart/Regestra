import React, { useRef } from "react";

interface ArtworkTileProps {
  src: string;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

const RADIUS = "16px";
const P = "#7c3aed";

export const ArtworkTile: React.FC<ArtworkTileProps> = ({
  src,
  index,
  isSelected,
  onClick,
}) => {
  const tileRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <>
      <style>{`
        .at-scene {
          position: relative;
          width: 100%;
          padding-bottom: 125%;
          border-radius: ${RADIUS};
          cursor: pointer;
          outline: none;
        }

        .at-scene:focus-visible .at-inner {
          box-shadow: 0 0 0 3px #fff, 0 0 0 5px ${P};
        }

        .at-inner {
          position: absolute;
          inset: 0;
          border-radius: ${RADIUS};
          overflow: hidden;
          background: #1a1a2e;
          box-shadow: 0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
          transition:
            transform 320ms cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 320ms ease;
          will-change: transform;
        }

        /* Click animation: quick scale-down + slight rotate to imply "flip into modal" */
        .at-inner.selected {
          transform: scale(0.88) rotateY(8deg);
          box-shadow: 0 20px 60px rgba(124,58,237,0.35), 0 8px 24px rgba(13,148,136,0.2);
        }

        @media (prefers-reduced-motion: reduce) {
          .at-inner { transition: none !important; }
          .at-inner.selected { transform: none !important; }
        }

        .at-inner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          transition: transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation: at-fadein 500ms ease forwards;
          animation-delay: calc(var(--at-index, 0) * 55ms);
          opacity: 0;
        }

        .at-scene:hover .at-inner img,
        .at-scene:focus-visible .at-inner img {
          transform: scale(1.04);
        }

        .at-vignette {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.22) 0%, transparent 55%);
          opacity: 0;
          transition: opacity 280ms ease;
          pointer-events: none;
        }

        .at-scene:hover .at-vignette,
        .at-scene:focus-visible .at-vignette {
          opacity: 1;
        }

        .at-hint {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(124, 58, 237, 0.85);
          backdrop-filter: blur(6px);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 4px 14px;
          border-radius: 999px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 240ms ease;
          pointer-events: none;
          user-select: none;
        }

        .at-scene:hover .at-hint,
        .at-scene:focus-visible .at-hint {
          opacity: 1;
        }

        @keyframes at-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .at-inner img { animation: none; opacity: 1; }
          .at-scene:hover .at-inner img { transform: none !important; }
        }
      `}</style>

      <div
        ref={tileRef}
        className="at-scene"
        role="button"
        tabIndex={0}
        aria-label="View artwork details"
        style={{ "--at-index": index } as React.CSSProperties}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <div className={`at-inner${isSelected ? " selected" : ""}`}>
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
          <div className="at-vignette" />
          <span className="at-hint">View details</span>
        </div>
      </div>
    </>
  );
};

export default ArtworkTile;
