
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createUrl } from "../utils";
import { Heart } from "lucide-react";
import { Button } from "../components/ui/Button";
import { artworks as allArtworks, findUserById } from "../data/mock";

export default function Home() {
  const [likedArtworks, setLikedArtworks] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const storedLikes = localStorage.getItem('likedArtworks');
    if (storedLikes) {
      setLikedArtworks(new Set(JSON.parse(storedLikes)));
    }
  }, []);

  const toggleLike = (artworkId: string) => {
    const newLikedArtworks = new Set(likedArtworks);
    if (newLikedArtworks.has(artworkId)) {
      newLikedArtworks.delete(artworkId);
    } else {
      newLikedArtworks.add(artworkId);
    }
    setLikedArtworks(newLikedArtworks);
    localStorage.setItem('likedArtworks', JSON.stringify(Array.from(newLikedArtworks)));
  };

  const handleImageError = (id: string) => {
    setFailedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allArtworks.map((artwork) => {
            const artist = findUserById(artwork.artistId);
            if (!artist) return null;
            if (failedImages.has(artwork.id)) return null;
            
            const isLiked = likedArtworks.has(artwork.id);
            const currentLikes = artwork.likes + (isLiked ? 1 : 0);

            return (
              <div
                key={artwork.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <img
                    src={artwork.image}
                    alt={artwork.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={() => handleImageError(artwork.id)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-start">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full"
                        onClick={(e) => { e.stopPropagation(); toggleLike(artwork.id); }}
                        aria-label="Like artwork"
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{artwork.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={artist.avatar}
                        alt={artist.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm text-gray-600">{artist.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Heart className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
                      <span className="text-sm">{currentLikes}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="rounded-full px-8">
            Load More Artworks
          </Button>
        </div>
      </div>
    </div>
  );
}
