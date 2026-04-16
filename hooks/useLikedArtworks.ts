
import { useState, useEffect } from 'react';

export function useLikedArtworks() {
  const [likedArtworks, setLikedArtworks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem('likedArtworks');
    if (stored) {
      try {
        setLikedArtworks(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error('Failed to parse liked artworks:', e);
      }
    }
  }, []);

  const toggleLike = (artworkId: string) => {
    setLikedArtworks(prev => {
      const next = new Set(prev);
      if (next.has(artworkId)) {
        next.delete(artworkId);
      } else {
        next.add(artworkId);
      }
      localStorage.setItem('likedArtworks', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  return { likedArtworks, toggleLike };
}
