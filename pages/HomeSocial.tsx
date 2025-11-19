




import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Image as ImageIcon, Send, X, LoaderCircle, Trash2, Sparkles, UserPlus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { useUser } from "../context/UserContext";
import { createUrl } from "../utils";
import { 
  SocialPost, 
  getMixedFeed,
  FeedItem,
  createSocialPost, 
  toggleLikeSocialPost, 
  addCommentToSocialPost,
  findUserById,
  Artwork,
  recordInteraction
} from "../data/mock";
import { useImageEnhancer } from "../hooks/useImageEnhancer";
import ArtworkDetailModal from "../components/ArtworkDetailModal";

const RecommendedArtworkCard: React.FC<{ 
  artwork: Artwork; 
  reason: string; 
  onView: (art: Artwork) => void 
}> = ({ artwork, reason, onView }) => {
  const artist = findUserById(artwork.artistId);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in border border-purple-100">
      <div className="p-4 border-b border-purple-50 bg-purple-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-purple-700 font-medium">
          <Sparkles className="w-4 h-4" />
          <span>Suggested for you</span>
        </div>
        <span className="text-xs text-gray-500">{reason}</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {artist ? (
             <Link to={createUrl('/profile/:userId', { userId: artist.id })}>
                <img src={artist.avatar} alt={artist.name} className="w-8 h-8 rounded-full object-cover" />
             </Link>
          ) : (
             <div className="w-8 h-8 rounded-full bg-gray-200" />
          )}
          <div>
            <p className="font-semibold text-sm text-gray-900">{artwork.title}</p>
            {artist && <p className="text-xs text-gray-500">by {artist.name}</p>}
          </div>
          <Button size="sm" variant="outline" className="ml-auto h-8 text-xs rounded-full" onClick={(e) => { e.stopPropagation(); onView(artwork); }}>
             View
          </Button>
        </div>
        <div 
          className="aspect-[4/5] rounded-xl overflow-hidden cursor-pointer group relative"
          onClick={() => onView(artwork)}
        >
          <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
        <div className="mt-3 flex gap-2">
            {artwork.tags.slice(0,3).map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">#{tag}</span>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function HomeSocial() {
  const { currentUser } = useUser();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  
  // Create Post State
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const { isEnhancing, enhancedImage, enhanceImage, resetEnhancement } = useImageEnhancer();

  // Comment State
  const [commentText, setCommentText] = useState<{[key: string]: string}>({});
  
  // Modal State for Recommended Artworks
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadFeed();
    }
  }, [currentUser]);

  // Sync enhanced image from hook to local state for preview
  useEffect(() => {
    if (enhancedImage) {
      setNewPostImage(enhancedImage);
    }
  }, [enhancedImage]);

  const loadFeed = () => {
    if (currentUser) {
      setFeedItems(getMixedFeed(currentUser.id));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (typeof evt.target?.result === 'string') {
          // Use the enhancer to process the image (or just use raw if preferred, keeping consistent with app)
          enhanceImage(evt.target.result);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setNewPostImage(null);
    resetEnhancement();
  };

  const handleCreatePost = () => {
    if (!currentUser) return;
    if (!newPostContent.trim() && !newPostImage) return;

    createSocialPost(currentUser.id, newPostContent, newPostImage || undefined);
    
    // Reset form
    setNewPostContent("");
    setNewPostImage(null);
    resetEnhancement();
    
    // Refresh feed
    loadFeed();
  };

  const handleLike = (postId: string) => {
    if (!currentUser) return;
    toggleLikeSocialPost(postId, currentUser.id);
    // Force refresh to show updated state
    loadFeed(); 
  };

  const handleCommentChange = (postId: string, text: string) => {
    setCommentText(prev => ({ ...prev, [postId]: text }));
  };

  const handleSubmitComment = (postId: string) => {
    if (!currentUser) return;
    const text = commentText[postId];
    if (!text?.trim()) return;

    addCommentToSocialPost(postId, currentUser.id, text);
    loadFeed();
    setCommentText(prev => ({ ...prev, [postId]: "" }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Create Post Card */}
        {currentUser ? (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-8">
            <div className="flex gap-4">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-10 h-10 rounded-full object-cover flex-shrink-0" 
              />
              <div className="flex-1">
                <Textarea 
                  placeholder="What's on your mind? Share an article or thought..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="border-none bg-gray-50 resize-none focus:ring-0 min-h-[80px] text-lg mb-2"
                />
                
                {isEnhancing && (
                  <div className="flex items-center gap-2 text-purple-600 text-sm p-2">
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                    <span>Processing image...</span>
                  </div>
                )}

                {newPostImage && !isEnhancing && (
                  <div className="relative mb-4 rounded-xl overflow-hidden border border-gray-100">
                    <img src={newPostImage} alt="Preview" className="w-full max-h-64 object-cover" />
                    <button 
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      id="post-image" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      disabled={isEnhancing}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-500 hover:text-purple-600"
                      onClick={() => document.getElementById('post-image')?.click()}
                      disabled={isEnhancing}
                    >
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Add Image
                    </Button>
                  </div>
                  <Button 
                    onClick={handleCreatePost} 
                    disabled={(!newPostContent.trim() && !newPostImage) || isEnhancing}
                    className="rounded-full px-6"
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl shadow-md p-6 mb-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">Join the conversation!</h2>
            <p className="mb-4 opacity-90">Sign in to share your art, write articles, and connect with the community.</p>
            <div className="flex gap-4 justify-center">
              <Link to="/login"><Button variant="primary-light" className="rounded-full">Log In</Button></Link>
              <Link to="/sign-up"><Button variant="outline-light" className="rounded-full">Sign Up</Button></Link>
            </div>
          </div>
        )}

        {/* Feed */}
        <div className="space-y-6">
          {feedItems.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <p>No posts yet. Connect with artists or share something to get started!</p>
            </div>
          )}

          {feedItems.map((item, index) => {
            // RENDER RECOMMENDATION
            if (item.type === 'recommendation') {
              return (
                <RecommendedArtworkCard 
                  key={`rec-${item.data.id}-${index}`}
                  artwork={item.data}
                  reason={item.reason}
                  onView={(art) => {
                    // Record view immediately
                    if(currentUser) recordInteraction(currentUser.id, art.id, 'view');
                    setSelectedArtwork(art);
                  }}
                />
              );
            }

            // RENDER SOCIAL POST
            const post = item.data;
            const author = findUserById(post.authorId);
            if (!author) return null;
            
            const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;

            return (
              <div key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Link to={createUrl('/profile/:userId', { userId: author.id })}>
                      <img src={author.avatar} alt={author.name} className="w-10 h-10 rounded-full object-cover" />
                    </Link>
                    <div>
                      <Link to={createUrl('/profile/:userId', { userId: author.id })}>
                        <p className="font-semibold text-gray-900 hover:underline">{author.name}</p>
                      </Link>
                      <p className="text-xs text-gray-500">{post.timestampStr}</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-2">
                  {post.content && (
                    <p className="text-gray-800 whitespace-pre-wrap mb-4 text-base leading-relaxed">{post.content}</p>
                  )}
                </div>

                {post.image && (
                  <div className="w-full bg-gray-100">
                    <img src={post.image} alt="Post content" className="w-full object-cover max-h-[500px]" />
                  </div>
                )}

                {/* Actions */}
                <div className="p-4">
                  <div className="flex items-center gap-6 mb-4">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="font-medium">{post.likes.length}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-500 hover:text-gray-900">
                      <MessageCircle className="w-6 h-6" />
                      <span className="font-medium">{post.comments.length}</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    {post.comments.map(comment => {
                      const commentAuthor = findUserById(comment.userId);
                      if (!commentAuthor) return null;
                      return (
                        <div key={comment.id} className="flex gap-3">
                          <img src={commentAuthor.avatar} alt={commentAuthor.name} className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                          <div className="bg-gray-50 rounded-2xl px-4 py-2 flex-1">
                            <p className="font-semibold text-sm">{commentAuthor.name}</p>
                            <p className="text-sm text-gray-700">{comment.text}</p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Comment */}
                    {currentUser && (
                      <div className="flex items-center gap-3 mt-4">
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                        <div className="flex-1 relative">
                          <Input 
                            placeholder="Write a comment..." 
                            className="pr-10 rounded-full"
                            value={commentText[post.id] || ""}
                            onChange={(e) => handleCommentChange(post.id, e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                          />
                          <button 
                            onClick={() => handleSubmitComment(post.id)}
                            disabled={!commentText[post.id]?.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-600 disabled:opacity-50 hover:text-purple-700"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedArtwork && (
        <ArtworkDetailModal 
          artwork={selectedArtwork}
          artist={findUserById(selectedArtwork.artistId)}
          onClose={() => setSelectedArtwork(null)}
          isLiked={false} // Simplified for preview
          onToggleLike={() => {}} 
        />
      )}
    </div>
  );
}
