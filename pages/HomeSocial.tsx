import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { artworks as allArtworks, findUserById } from "../data/mock";
import { createPageUrl } from "../utils";
import ArtworkDetailModal from "../components/ArtworkDetailModal";

export default function HomeSocial() {
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [likedArtworks, setLikedArtworks] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState('');

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

  const handleCloseModal = () => setSelectedArtwork(null);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {allArtworks.map((post) => {
            const artist = findUserById(post.artistId);
            if (!artist) return null;
            
            const isLiked = likedArtworks.has(post.id);
            const currentLikes = post.likes + (isLiked ? 1 : 0);

            return (
              <div key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Link to={createPageUrl('Profile', { userId: artist.id })}>
                      <img src={artist.avatar} alt={artist.name} className="w-10 h-10 rounded-full" />
                    </Link>
                    <div>
                      <Link to={createPageUrl('Profile', { userId: artist.id })}>
                        <p className="font-semibold text-gray-900 hover:underline">{artist.name}</p>
                      </Link>
                      <p className="text-sm text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="More options">
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                  </Button>
                </div>

                <div 
                  className="w-full cursor-pointer"
                  onClick={() => handleArtworkClick(post)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleArtworkClick(post); }}
                  aria-label={`View details for ${post.title}`}
                >
                  <div className="relative bg-gray-100">
                    <img src={post.image} alt="Artwork" className="w-full object-cover" style={{ maxHeight: '600px' }} />
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="icon" onClick={() => toggleLike(post.id)} className="rounded-full" aria-label="Like post">
                        <Heart className={`w-6 h-6 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleArtworkClick(post)} aria-label="Comment on post">
                        <MessageCircle className="w-6 h-6 text-gray-700" />
                      </Button>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">{currentLikes.toLocaleString()} likes</p>
                  <p className="text-gray-900">
                    <Link to={createPageUrl('Profile', { userId: artist.id })}>
                      <span className="font-semibold mr-2 hover:underline">{artist.name}</span>
                    </Link>
                    {post.description}
                  </p>
                  <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => handleArtworkClick(post)}>
                    View all comments
                  </button>
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <Input 
                      type="text" 
                      placeholder="Add a comment..." 
                      className="flex-1 rounded-full"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    {comment && (
                      <Button 
                        variant="ghost"
                        className="font-semibold text-purple-600"
                        onClick={() => setComment('')}
                      >
                        Post
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" className="rounded-full px-8">
            Load More Posts
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