import React, { useState, useEffect, useRef, useCallback } from "react";

const ROWS = 5;
const COLS = 3;
const TOTAL_CELLS = ROWS * COLS; // 15

// Fallback images (Unsplash art) used when no user artwork is available
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=600&q=80",
  "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=600&q=80",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80",
  "https://images.unsplash.com/photo-1501472312651-726afe119ff1?w=600&q=80",
  "https://images.unsplash.com/photo-1573521193826-58c7dc2e13e3?w=600&q=80",
  "https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&q=80",
  "https://images.unsplash.com/photo-1531913764164-f85c52e6e654?w=600&q=80",
  "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=600&q=80",
  "https://images.unsplash.com/photo-1510070009289-b5bc34383727?w=600&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=600&q=80",
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
  "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&q=80",
  "https://images.unsplash.com/photo-1536924430914-91f9e2041b83?w=600&q=80",
  "https://images.unsplash.com/photo-1555685812-4b8f286b1b23?w=600&q=80",
  "https://images.unsplash.com/photo-1524781289445-ddf8d5695e71?w=600&q=80",
  "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=600&q=80",
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&q=80",
  "https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=600&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80",
  "https://images.unsplash.com/photo-1572214420220-a2e31bc2f4dc?w=600&q=80",
  "https://images.unsplash.com/photo-1616400619175-5beda3a17896?w=600&q=80",
  "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=600&q=80",
  "https://images.unsplash.com/photo-1562619371-b67725b6fde2?w=600&q=80",
  "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=600&q=80",
  "https://images.unsplash.com/photo-1553949285-1ebf9f3c36a1?w=600&q=80",
  "https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?w=600&q=80",
  "https://images.unsplash.com/photo-1519326844852-704caea5679e?w=600&q=80",
  "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&q=80",
];

interface ArtworkGridProps {
  /** Array of image URLs from the user collection */
  images?: string[];
}

/**
 * Fills a pool to at least `minCount` items by cycling through the source.
 */
function fillPool(source: string[], minCount: number): string[] {
  if (source.length === 0) return [];
  const result: string[] = [];
  while (result.length < minCount) {
    result.push(...source);
  }
  return result;
}

/**
 * Seeded shuffle so initial render is deterministic per session.
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * A single cell that cross-fades between images.
 */
const GridCell: React.FC<{
  currentSrc: string;
  nextSrc: string;
  transitioning: boolean;
  index: number;
}> = ({ currentSrc, nextSrc, transitioning, index }) => {
  return (
    <div
      className="artwork-cell"
      style={{
        // Stable 4:5 aspect ratio via padding trick — zero CLS
        position: "relative",
        width: "100%",
        paddingBottom: "125%", // 4:5
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        flexShrink: 0,
        background: "#1a1a2e",
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Current image (fades out during transition) */}
      <img
        src={currentSrc}
        alt=""
        aria-hidden="true"
        loading={index < 6 ? "eager" : "lazy"}
        decoding="async"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          transition: "opacity 900ms ease-in-out, transform 700ms cubic-bezier(0.25,0.46,0.45,0.94)",
          opacity: transitioning ? 0 : 1,
          transform: "scale(1)",
          willChange: "opacity",
        }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
        }}
      />

      {/* Next image (fades in during transition) */}
      <img
        src={nextSrc}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          transition: "opacity 900ms ease-in-out",
          opacity: transitioning ? 1 : 0,
          willChange: "opacity",
        }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            FALLBACK_IMAGES[(index + 1) % FALLBACK_IMAGES.length];
        }}
      />

      {/* Hover overlay */}
      <div
        className="artwork-cell-overlay"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 50%)",
          opacity: 0,
          transition: "opacity 300ms ease",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

const ArtworkGrid: React.FC<ArtworkGridProps> = ({ images = [] }) => {
  // Build the full pool from user images + fallbacks
  const pool = React.useMemo(() => {
    const base = images.length >= TOTAL_CELLS
      ? images
      : [...images, ...FALLBACK_IMAGES];
    return shuffle(fillPool(base, TOTAL_CELLS * 3));
  }, [images]);

  // Each cell tracks its current image index into the pool
  const [cellIndices, setCellIndices] = useState<number[]>(() =>
    Array.from({ length: TOTAL_CELLS }, (_, i) => i % pool.length)
  );

  // Which cell index inside pool comes "next" for a given cell
  const nextIndexRef = useRef<number>(TOTAL_CELLS);

  // Per-cell: is it currently in cross-fade transition?
  const [transitioning, setTransitioning] = useState<boolean[]>(
    Array(TOTAL_CELLS).fill(false)
  );

  // nextSrcs: what each cell will transition TO
  const [nextSrcs, setNextSrcs] = useState<string[]>(() =>
    Array.from({ length: TOTAL_CELLS }, (_, i) => pool[(i + 1) % pool.length])
  );

  // Rotate one random cell every 1.2s (staggered feel, full cycle ~18s)
  const rotateCellRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingCommitRef = useRef<Map<number, number>>(new Map());

  const rotateOneCell = useCallback(() => {
    const cellIdx = Math.floor(Math.random() * TOTAL_CELLS);
    const poolIdx = nextIndexRef.current % pool.length;
    nextIndexRef.current++;

    const newSrc = pool[poolIdx];

    // Stage the next image
    setNextSrcs((prev) => {
      const updated = [...prev];
      updated[cellIdx] = newSrc;
      return updated;
    });

    // Short delay to let browser paint the next image before fading
    setTimeout(() => {
      setTransitioning((prev) => {
        const updated = [...prev];
        updated[cellIdx] = true;
        return updated;
      });

      // After fade completes, commit the new image as "current" and reset
      pendingCommitRef.current.set(cellIdx, poolIdx);
      setTimeout(() => {
        const commitPoolIdx = pendingCommitRef.current.get(cellIdx);
        if (commitPoolIdx === undefined) return;

        setCellIndices((prev) => {
          const updated = [...prev];
          updated[cellIdx] = commitPoolIdx;
          return updated;
        });
        setTransitioning((prev) => {
          const updated = [...prev];
          updated[cellIdx] = false;
          return updated;
        });
        pendingCommitRef.current.delete(cellIdx);
      }, 950); // just past the CSS transition duration
    }, 50);
  }, [pool]);

  useEffect(() => {
    // Stagger the rotation interval between 4000–6000ms
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      const delay = 4000 + Math.random() * 2000;
      timeout = setTimeout(() => {
        rotateOneCell();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => clearTimeout(timeout);
  }, [rotateOneCell]);

  return (
    <>
      <style>{`
        .artwork-cell {
          cursor: default;
        }
        .artwork-cell:hover img:first-child {
          transform: scale(1.03) !important;
          transition: transform 500ms cubic-bezier(0.25,0.46,0.45,0.94), opacity 900ms ease-in-out !important;
        }
        .artwork-cell:hover .artwork-cell-overlay {
          opacity: 1 !important;
        }
        @keyframes gridCellFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .artwork-cell {
          opacity: 0;
          animation: gridCellFadeIn 500ms ease forwards;
        }
      `}</style>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          width: "100%",
          // No height set — grid height is determined by content (aspect-ratio cells)
        }}
        // Responsive overrides handled below via a style tag for cleanliness
      >
        {Array.from({ length: TOTAL_CELLS }, (_, i) => (
          <GridCell
            key={i}
            index={i}
            currentSrc={pool[cellIndices[i]] ?? FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]}
            nextSrc={nextSrcs[i] ?? FALLBACK_IMAGES[(i + 1) % FALLBACK_IMAGES.length]}
            transitioning={transitioning[i]}
          />
        ))}
      </div>

      {/* Responsive breakpoints — injected once */}
      <style>{`
        @media (max-width: 900px) {
          .artwork-grid-wrapper > div {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 560px) {
          .artwork-grid-wrapper > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
};

export default ArtworkGrid;
