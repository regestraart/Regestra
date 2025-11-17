
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { artworks as allArtworks, findUserById } from "../data/mock";
import { createPageUrl } from "../utils";
import ArtworkDetailModal from "../components/ArtworkDetailModal";

interface PostState {
  [key: string]: {
    liked: boolean;
    bookmarked: boolean;
  };
}

export default function HomeSocial() {
  const [postStates, setPostStates] = useState<PostState>(
    allArtworks.reduce((acc, art) => ({ ...acc, [art.id]: { liked: art.likes > 400, bookmarked: false } }), {})
  );

  const [selectedArtwork, setSelectedArtwork] = useState(null);

  const handleArtworkClick = (artwork) => {
    const artist = findUserById(artwork.artistId);
    setSelectedArtwork({ ...artwork, artist });
  };

  const handleCloseModal = () => setSelectedArtwork(null);

  const toggleLike = (postId: string) => {
    setPostStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], liked: !prev[postId].liked }
    }));
  };

  const toggleBookmark = (postId: string) => {
    setPostStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], bookmarked: !prev[postId].bookmarked }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {allArtworks.map((post) => {
            const artist = findUserById(post.artistId);
            if (!artist) return null;
            const isLiked = postStates[post.id]?.liked;
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
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                  </Button>
                </div>

                <button className="w-full" onClick={() => handleArtworkClick(post)}>
                  <div className="relative bg-gray-100">
                    <img src={post.image} alt="Artwork" className="w-full object-cover" style={{ maxHeight: '600px' }} />
                  </div>
                </button>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="icon" onClick={() => toggleLike(post.id)} className="rounded-full">
                        <Heart className={`w-6 h-6 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleArtworkClick(post)}>
                        <MessageCircle className="w-6 h-6 text-gray-700" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Send className="w-6 h-6 text-gray-700" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => toggleBookmark(post.id)} className="rounded-full">
                      <Bookmark className={`w-6 h-6 transition-colors ${postStates[post.id]?.bookmarked ? 'fill-purple-600 text-purple-600' : 'text-gray-700'}`} />
                    </Button>
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
                      className="flex-1 h-auto py-0 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0" 
                    />
                    <button className="text-sm font-semibold text-purple-600 hover:text-purple-700">Post</button>
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
          isLiked={postStates[selectedArtwork.id]?.liked}
          onToggleLike={() => toggleLike(selectedArtwork.id)}
        />
      )}
    </div>
  );
}