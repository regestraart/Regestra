import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShoppingBag, Tag } from "lucide-react";
import { Artwork } from "../data/mock";
import { db } from "../services/db";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useUser } from "../context/UserContext";
import { MarketplaceArtworkModal } from "../components/MarketplaceArtworkModal";

const P = "#7c3aed";

/* ── Debug panel (dev only) ─────────────────────────────────────────────── */
interface DebugStats {
  totalFetched: number;
  totalListedForSale: number;
  totalActive: number;
  sbConfigured: boolean;
  authUserId: string | null;
  rawError: string | null;
  allRowsRaw: number | null; // total rows visible regardless of filter
}
const DebugPanel: React.FC<{ stats: DebugStats }> = ({ stats }) => {
  if (!import.meta.env.DEV) return null;
  const ok = (v: boolean) => v ? "✅" : "❌";
  return (
    <div style={{
      position: "fixed", bottom: 16, right: 16, zIndex: 9999,
      background: "rgba(17,24,39,0.95)", backdropFilter: "blur(8px)",
      border: "1px solid rgba(124,58,237,0.4)", borderRadius: 10,
      padding: "10px 14px", color: "#e5e7eb", fontSize: "11px",
      fontFamily: "monospace", lineHeight: 1.8, minWidth: 260,
    }}>
      <div style={{ color: "#a78bfa", fontWeight: 700, marginBottom: 4 }}>🛒 Marketplace Debug</div>
      <div>{ok(stats.sbConfigured)} Supabase configured</div>
      <div>{ok(!!stats.authUserId)} Auth user: <span style={{ color: "#fbbf24" }}>{stats.authUserId ? stats.authUserId.slice(0, 8) + "…" : "none"}</span></div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 4, paddingTop: 4 }}>
        <div>All visible rows (no filter): <b style={{ color: "#34d399" }}>{stats.allRowsRaw ?? "?"}</b></div>
        <div>Total fetched (for-sale): <b style={{ color: "#34d399" }}>{stats.totalFetched}</b></div>
        <div>listed_for_sale=true: <b style={{ color: "#34d399" }}>{stats.totalListedForSale}</b></div>
        <div>active|null listings: <b style={{ color: "#34d399" }}>{stats.totalActive}</b></div>
      </div>
      {stats.rawError && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 4, paddingTop: 4, color: "#f87171", wordBreak: "break-all" }}>
          ⚠ {stats.rawError}
        </div>
      )}
    </div>
  );
};

/* ── Tile component ──────────────────────────────────────────────────────── */
const MarketplaceTile: React.FC<{
  artwork: Artwork;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}> = ({ artwork, index, isSelected, onClick }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
  };

  return (
    <>
      <style>{`
        .mkt-scene {
          position: relative; width: 100%; padding-bottom: 125%;
          border-radius: 16px; cursor: pointer; outline: none;
        }
        .mkt-scene:focus-visible .mkt-inner {
          box-shadow: 0 0 0 3px #fff, 0 0 0 5px ${P};
        }
        .mkt-inner {
          position: absolute; inset: 0; border-radius: 16px;
          overflow: hidden; background: #1a1a2e;
          box-shadow: 0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
          transition: transform 300ms cubic-bezier(0.4,0,0.2,1), box-shadow 300ms ease;
          will-change: transform;
        }
        .mkt-inner.selected {
          transform: scale(0.88) rotateY(6deg);
          box-shadow: 0 20px 60px rgba(124,58,237,0.35), 0 8px 24px rgba(13,148,136,0.2);
        }
        .mkt-inner img {
          width: 100%; height: 100%; object-fit: cover; object-position: center;
          display: block;
          transition: transform 500ms cubic-bezier(0.25,0.46,0.45,0.94);
          animation: mkt-fadein 500ms ease forwards;
          animation-delay: calc(var(--idx,0) * 50ms);
          opacity: 0;
        }
        .mkt-scene:hover .mkt-inner img,
        .mkt-scene:focus-visible .mkt-inner img { transform: scale(1.04); }
        .mkt-vignette {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.28) 0%, transparent 55%);
          opacity: 0; transition: opacity 280ms ease; pointer-events: none;
        }
        .mkt-scene:hover .mkt-vignette,
        .mkt-scene:focus-visible .mkt-vignette { opacity: 1; }
        .mkt-price-badge {
          position: absolute; bottom: 10px; left: 10px;
          background: rgba(124,58,237,0.9); backdrop-filter: blur(6px);
          color: #fff; font-size: 11px; font-weight: 800;
          letter-spacing: 0.04em; padding: 4px 10px;
          border-radius: 999px; pointer-events: none;
          opacity: 0; transition: opacity 240ms ease;
        }
        .mkt-scene:hover .mkt-price-badge,
        .mkt-scene:focus-visible .mkt-price-badge { opacity: 1; }
        .mkt-hint {
          position: absolute; bottom: 10px; right: 10px;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
          color: #fff; font-size: 10px; font-weight: 700;
          letter-spacing: 0.05em; padding: 4px 10px;
          border-radius: 999px; white-space: nowrap;
          opacity: 0; transition: opacity 240ms ease; pointer-events: none;
        }
        .mkt-scene:hover .mkt-hint,
        .mkt-scene:focus-visible .mkt-hint { opacity: 1; }
        @keyframes mkt-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mkt-inner { transition: none !important; }
          .mkt-inner.selected { transform: none !important; }
          .mkt-inner img { animation: none; opacity: 1; }
          .mkt-scene:hover .mkt-inner img { transform: none !important; }
        }
      `}</style>

      <div
        className="mkt-scene"
        role="button"
        tabIndex={0}
        aria-label={`View details for ${artwork.title}`}
        style={{ "--idx": index } as React.CSSProperties}
        onClick={onClick}
        onKeyDown={handleKeyDown}
      >
        <div className={`mkt-inner${isSelected ? " selected" : ""}`}>
          <img
            src={artwork.image}
            alt={artwork.title}
            loading={index < 6 ? "eager" : "lazy"}
            decoding="async"
            onError={e => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=600&q=80";
            }}
          />
          <div className="mkt-vignette" />
          {artwork.price != null && (
            <span className="mkt-price-badge">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(artwork.price)}
            </span>
          )}
          <span className="mkt-hint">View details</span>
        </div>
      </div>
    </>
  );
};

/* ── Marketplace page ────────────────────────────────────────────────────── */

export default function Marketplace() {
  const { currentUser, isLoading: authLoading } = useUser();
  const currentUserRef = React.useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  const navigate = useNavigate();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [debugStats, setDebugStats] = useState<DebugStats>({
    totalFetched: 0, totalListedForSale: 0, totalActive: 0,
    sbConfigured: isSupabaseConfigured, authUserId: null, rawError: null, allRowsRaw: null,
  });

  /* Auth guard */
  useEffect(() => {
    if (!authLoading && !currentUser) navigate("/login");
  }, [currentUser, authLoading, navigate]);

  const load = async () => {
    const cu = currentUserRef.current;
    if (!cu) return;
    try {
      setLoading(true);
      setError(null);

      // Dev: probe how many rows are visible at all (no filters)
      let allRowsRaw: number | null = null;
      let authUserId: string | null = null;
      if (import.meta.env.DEV) {
        const { data: { session } } = await supabase.auth.getSession();
        authUserId = session?.user?.id ?? null;
        const { count } = await supabase.from('artworks').select('*', { count: 'exact', head: true });
        allRowsRaw = count ?? 0;
        console.log("[Marketplace Debug] session user:", authUserId);
        console.log("[Marketplace Debug] total artworks visible (no filter):", allRowsRaw);
      }

      const items = await db.artworks.getForSale(60);
      setArtworks(items);

      if (import.meta.env.DEV) {
        const stats: DebugStats = {
          totalFetched: items.length,
          totalListedForSale: items.filter(a => a.listedForSale).length,
          totalActive: items.filter(a => a.listedForSale && (a.listingStatus === 'active' || a.listingStatus == null)).length,
          sbConfigured: isSupabaseConfigured,
          authUserId,
          rawError: null,
          allRowsRaw,
        };
        setDebugStats(stats);
        console.group("[Marketplace] Load complete");
        console.log("Supabase configured:", isSupabaseConfigured);
        console.log("Auth user ID:", authUserId);
        console.log("All visible rows (no filter):", allRowsRaw);
        console.log("For-sale fetched:", items.length);
        console.table(items.map(a => ({ id: a.id, title: a.title, listedForSale: a.listedForSale, listingStatus: a.listingStatus, price: a.price })));
        console.groupEnd();
      }
    } catch (err: any) {
      const msg = err.message || "Failed to load marketplace.";
      setError(msg);
      if (import.meta.env.DEV) {
        setDebugStats(s => ({ ...s, rawError: msg }));
        console.error("[Marketplace] Load error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUserRef.current) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // load once on mount — currentUser accessed via ref

  /* ESC closes modal */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedId(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const selectedArtwork = selectedId ? artworks.find(a => a.id === selectedId) ?? null : null;

  const handleListingUpdate = () => {
    setSelectedId(null);
    load();
  };

  if (authLoading || (!currentUser && !authLoading)) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)" }}>
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        .mkt-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          width: 100%;
        }
        @media (max-width: 900px) { .mkt-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .mkt-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ padding: "24px", maxWidth: "1280px", margin: "0 auto" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <ShoppingBag size={28} color="#f87171" />
            </div>
            <h2 className="rg-h3" style={{ color: "#374151", margin: "0 0 8px", fontSize: "1.1rem" }}>
              Marketplace unavailable
            </h2>
            <p style={{ fontSize: "0.87rem", color: "#6b7280", marginBottom: 20 }}>
              We couldn't load listings right now. Please try again in a moment.
            </p>
            <button
              onClick={() => load()}
              style={{ padding: "8px 20px", borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}
            >
              Retry
            </button>
            {import.meta.env.DEV && (
              <pre style={{ marginTop: 24, fontSize: "0.72rem", color: "#9ca3af", textAlign: "left", background: "#f9fafb", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {error}
              </pre>
            )}
          </div>
        ) : artworks.length === 0 ? (
          /* ── Option A empty state: clearly explains the rule ── */
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Tag size={28} color="#9ca3af" />
            </div>
            <h2 className="rg-h3" style={{ color: "#374151", margin: "0 0 8px", fontSize: "1.1rem" }}>
              No artworks for sale yet
            </h2>
            <p style={{ fontSize: "0.87rem", color: "#6b7280", maxWidth: 360, margin: "0 auto 20px", lineHeight: 1.6 }}>
              The Marketplace shows only artworks listed for sale. Upload an artwork and toggle{" "}
              <strong>"List for sale"</strong> to have it appear here.
            </p>
            <button
              onClick={() => navigate("/upload")}
              style={{
                padding: "8px 20px", borderRadius: 8, background: "#7c3aed",
                color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem"
              }}
            >
              Upload & list artwork
            </button>
          </div>
        ) : (
          <div className="mkt-grid">
            {artworks.map((artwork, i) => (
              <MarketplaceTile
                key={artwork.id}
                artwork={artwork}
                index={i}
                isSelected={selectedId === artwork.id}
                onClick={() => setSelectedId(artwork.id)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedArtwork && (
        <MarketplaceArtworkModal
          artwork={selectedArtwork}
          currentUserId={currentUser?.id}
          onClose={() => setSelectedId(null)}
          onListingUpdate={handleListingUpdate}
        />
      )}

      {/* Debug panel removed per requirements */}
    </>
  );
}
