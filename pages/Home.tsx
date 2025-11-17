

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Heart, Bookmark, Share2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import ArtworkDetailModal from "../components/ArtworkDetailModal";
import { artworks as allArtworks, findUserById } from "../data/mock";

export default function Home() {
  const [filter, setFilter] = useState("all");
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [likedArtworks, setLikedArtworks] = useState<Set<string>>(new Set());

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

  const handleArtworkClick = (artwork) => {
    const artist = findUserById(artwork.artistId);
    setSelectedArtwork({ ...artwork, artist });
  };

  const handleCloseModal = () => {
    setSelectedArtwork(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Buyers & Browse Art</h1>
              <p className="text-xl text-purple-100 max-w-2xl">
                Discover amazing artwork from talented creators around the world.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link to={createPageUrl('SignUp')}>
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 rounded-full px-8 py-4 text-lg font-semibold shadow-lg">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 py-4 overflow-x-auto">
            {['All', 'Painting', 'Digital Art', 'Photography', 'Illustration', 'Sculpture'].map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category.toLowerCase())}
                className={`text-sm font-medium whitespace-nowrap pb-2 border-b-2 transition-colors ${
                  filter === category.toLowerCase()
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allArtworks.map((artwork) => {
            const artist = findUserById(artwork.artistId);
            if (!artist) return null;
            
            const isLiked = likedArtworks.has(artwork.id);
            const currentLikes = artwork.likes + (isLiked ? 1 : 0);

            return (
              <div
                key={artwork.id}
                onClick={() => handleArtworkClick(artwork)}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <img
                    src={artwork.image}
                    alt={artwork.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <Button size="icon" variant="ghost" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full">
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full">
                        <Bookmark className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full">
                        <Share2 className="w-4 h-4" />
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

      {selectedArtwork && (
        <ArtworkDetailModal 
          artwork={selectedArtwork} 
          artist={selectedArtwork.artist}
          onClose={handleCloseModal}
          isLiked={likedArtworks.has(selectedArtwork.id)}
          onToggleLike={() => toggleLike(selectedArtwork.id)}
        />
      )}
    </div>
  );
}