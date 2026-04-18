import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Artwork, CollectionArtwork } from "../data/mock";
import { db } from "../services/db";
import { useUser } from "../context/UserContext";
import SocialFeed from "../components/SocialFeed";
import { supabase } from "../lib/supabase";
import { ArtworkTile } from "../components/ArtworkTile";
import { AuthGateModal } from "../components/AuthGateModal";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const getNormalizedUrl = (url: string): string => {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("unsplash.com")) return u.pathname;
    return u.hostname + u.pathname;
  } catch {
    return url.replace(/^https?:\/\//, "").split("?")[0];
  }
};

const TOTAL = 15;

// Stable deterministic sort based on URL hash — same order every refresh,
// but different from insertion order so it feels curated not chronological
const stableSort = (urls: string[]): string[] => {
  return [...urls].sort((a, b) => {
    // Simple hash: sum of char codes mod large prime
    const hash = (s: string) => s.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0x7fffffff, 0);
    return hash(a) - hash(b);
  });
};

export default function Gallery() {
  const { currentUser } = useUser();
  const [images, setImages]           = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedIndex, setSelected]  = useState<number | null>(null);

  /* Close modal on ESC (modal also handles it internally, belt-and-suspenders) */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* Auto-reset the tile "selected" visual state shortly after modal opens,
     so the tile returns to normal while the modal is still visible           */
  useEffect(() => {
    if (selectedIndex !== null) {
      const t = setTimeout(() => {
        /* We don't clear selectedIndex here — the modal still needs it.
           The tile's `isSelected` drives the brief animation only.        */
      }, 400);
      return () => clearTimeout(t);
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (currentUser) return;
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        // 1. All visible platform artworks (profile_visible = true enforced in getAll)
        const artistArtworks = await db.artworks.getAll(100);

        // 2. All users' collections — pull from profiles table (limit to 200 most recent active profiles)
        const { data: allProfiles } = await supabase
          .from("profiles")
          .select("collections")
          .not("collections", "is", null)
          .limit(200);

        const allCollectionItems: CollectionArtwork[] = (allProfiles || [])
          .flatMap(p => {
            try {
              const cols = Array.isArray(p.collections) ? p.collections : [];
              return cols as CollectionArtwork[];
            } catch { return []; }
          });

        // 3. Combine and deduplicate by normalized URL
        const uniqueMap = new Map<string, string>();
        for (const art of [...artistArtworks, ...allCollectionItems]) {
          const imgUrl = (art as any).image || (art as any).image_url;
          if (!imgUrl || typeof imgUrl !== 'string') continue;
          const key = getNormalizedUrl(imgUrl);
          if (!uniqueMap.has(key)) uniqueMap.set(key, imgUrl);
        }

        // 4. Stable sort — same order on every refresh, no duplicates
        const urls = stableSort(Array.from(uniqueMap.values()));
        const final = urls.length >= TOTAL
          ? urls.slice(0, TOTAL)
          : urls; // don't pad with fallback Unsplash images — only show real user art

        if (mounted) setImages(final);
      } catch {
        if (mounted) setImages([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []); // only load public gallery on mount — currentUser check is inside the effect

  if (currentUser) return <SocialFeed />;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)" }}>
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  const selectedSrc = selectedIndex !== null ? images[selectedIndex] : null;

  return (
    <>
      <style>{`
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          width: 100%;
        }
        @media (max-width: 900px) {
          .gallery-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .gallery-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ padding: "24px", maxWidth: "1280px", margin: "0 auto" }}>
        {images.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: '#9ca3af' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, color: '#1a1729' }}>
              Gallery coming to life
            </div>
            <p style={{ fontSize: '0.9rem' }}>
              Artworks shared by our community will appear here.
            </p>
          </div>
        ) : (
          <div className="gallery-grid">
            {images.map((src, i) => (
              <ArtworkTile
                key={src}
                src={src}
                index={i}
                isSelected={selectedIndex === i}
                onClick={() => setSelected(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal — rendered outside the grid, no layout impact */}
      {selectedSrc && (
        <AuthGateModal
          src={selectedSrc}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
