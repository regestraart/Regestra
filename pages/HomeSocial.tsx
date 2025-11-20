import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Image as ImageIcon, Send, X, LoaderCircle, Trash2, Sparkles, UserPlus, Eye, EyeOff, MoreVertical } from "lucide-react";
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
  findUserById,
  Artwork,
  recordInteraction,
  deleteSocialPost,
  dismissRecommendation,
  toggleHideSocialPost,
  toggleHideRecommendation,
  toggleArtworkLike
} from "../data/mock";
import { useImageEnhancer } from "../hooks/useImageEnhancer";
import ArtworkDetailModal from "../components/ArtworkDetailModal";

const RecommendedArtworkCard: React.FC<{ 
  artwork: Artwork; 
  reason: string; 
  isHidden?: boolean;
  onView: (art: Artwork) => void;
  onDelete: () => void;
  onHide: () => void;
  isMenuOpen: boolean;
  onToggleMenu: (e: React.MouseEvent) => void;
}> = ({ artwork, reason, isHidden, onView, onDelete, onHide, isMenuOpen, onToggleMenu }) => {
  const [artist, setArtist] = useState<any>(null);

  useEffect(() => {
     findUserById(artwork.artistId).then(setArtist);
  }, [artwork.artistId]);

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in border border-purple-100 ${isHidden ? 'opacity-60 grayscale bg-gray-50' : ''}`}>
      <div className="p-4 border-b border-purple-50 bg-purple-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-purple-700 font-medium">
          {isHidden ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span>Hidden Recommendation</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Suggested for you</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
            {!isHidden && <span className="text-xs text-gray-500">{reason}</span>}
            
            <div className="relative">
                <button 
                    onClick={onToggleMenu}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-purple-50 rounded-full"
                    aria-label="More options"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>
                
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onHide(); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            {isHidden ? "Unhide" : "Hide"}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Dismiss
                        </button>
                    </div>
                )}
            </div>
        </div>
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
  const { currentUser, setCurrentUser } = useUser();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [showHiddenContent, setShowHiddenContent] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const { isEnhancing, enhancedImage, enhanceImage, resetEnhancement } = useImageEnhancer();
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [selectedArtworkArtist, setSelectedArtworkArtist] = useState<any>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadFeed();
    }
  }, [currentUser, showHiddenContent]);

  useEffect(() => {
    if (enhancedImage) {
      setNewPostImage(enhancedImage);
    }
  }, [enhancedImage]);

  useEffect(() => {
      if (selectedArtwork) {
          findUserById(selectedArtwork.artistId).then(setSelectedArtworkArtist);
      }
  }, [selectedArtwork]);

  const loadFeed = async () => {
    if (currentUser) {
      const items = await getMixedFeed(currentUser.id);
      setFeedItems(items);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (typeof evt.target?.result === 'string') {
          enhanceImage(evt.target.result);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCreatePost = async () => {
    if (!currentUser) return;
    if (!newPostContent.trim() && !newPostImage) return;

    await createSocialPost(currentUser.id, newPostContent, newPostImage || undefined);
    
    setNewPostContent("");
    setNewPostImage(null);
    resetEnhancement();
    loadFeed();
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
        await deleteSocialPost(postId);
        loadFeed();
    }
    setActiveMenuId(null);
  };

  const handleHidePost = async (postId: string) => {
      if (currentUser) {
          const updatedUser = await toggleHideSocialPost(currentUser.id, postId);
          if (updatedUser) setCurrentUser(updatedUser);
          loadFeed();
      }
      setActiveMenuId(null);
  }

  const handleHideRecommendation = async (artworkId: string) => {
      if (currentUser) {
          await toggleHideRecommendation(currentUser.id, artworkId);
          loadFeed();
      }
      setActiveMenuId(null);
  }

  const handleDismissRecommendation = async (artworkId: string) => {
      if (currentUser) {
          await dismissRecommendation(currentUser.id, artworkId);
          loadFeed();
      }
      setActiveMenuId(null);
  };

  const handleArtworkLike = async (artworkId: string) => {
      if (!currentUser) return;
      const updatedUser = await toggleArtworkLike(currentUser.id, artworkId);
      setCurrentUser(updatedUser);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {currentUser ? (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
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
                {isEnhancing && <div className="flex items-center gap-2 text-purple-600 text-sm p-2"><LoaderCircle className="w-4 h-4 animate-spin" /><span>Processing image...</span></div>}
                {newPostImage && !isEnhancing && (
                  <div className="relative mb-4 rounded-xl overflow-hidden border border-gray-100">
                    <img src={newPostImage} alt="Preview" className="w-full max-h-64 object-cover" />
                    <button onClick={() => { setNewPostImage(null); resetEnhancement(); }} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X className="w-4 h-4" /></button>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2">
                    <input type="file" id="post-image" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isEnhancing} />
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-purple-600" onClick={() => document.getElementById('post-image')?.click()} disabled={isEnhancing}><ImageIcon className="w-5 h-5 mr-2" /> Add Image</Button>
                  </div>
                  <Button onClick={handleCreatePost} disabled={(!newPostContent.trim() && !newPostImage) || isEnhancing} className="rounded-full px-6">Post</Button>
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
        
        {currentUser && (
            <div className="flex justify-end mb-4">
                <Button variant="ghost" size="sm" className={`text-xs gap-2 rounded-full ${showHiddenContent ? 'bg-purple-100 text-purple-700' : 'text-gray-500'}`} onClick={() => setShowHiddenContent(prev => !prev)}>
                    {showHiddenContent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showHiddenContent ? 'Hide Hidden Content' : 'Show Hidden Content'}
                </Button>
            </div>
        )}

        <div className="space-y-6">
          {feedItems.map((item, index) => {
            if (!showHiddenContent && item.isHidden) return null;

            if (item.type === 'recommendation') {
              return <RecommendedArtworkCard 
                  key={`rec-${item.data.id}-${index}`}
                  artwork={item.data}
                  reason={item.reason || ''}
                  isHidden={item.isHidden}
                  onView={(art) => { if(currentUser) recordInteraction(currentUser.id, art.id, 'view'); setSelectedArtwork(art); }}
                  onDelete={() => handleDismissRecommendation(item.data.id)}
                  onHide={() => handleHideRecommendation(item.data.id)}
                  isMenuOpen={activeMenuId === `rec-${item.data.id}`}
                  onToggleMenu={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === `rec-${item.data.id}` ? null : `rec-${item.data.id}`); }}
                />;
            }

            const post = item.data as SocialPost;
            return <SocialPostItem 
              key={post.id} 
              post={post} 
              currentUser={currentUser} 
              isHidden={item.isHidden}
              isMenuOpen={activeMenuId === `post-${post.id}`}
              onToggleMenu={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === `post-${post.id}` ? null : `post-${post.id}`); }}
              onHide={() => handleHidePost(post.id)}
              onDelete={() => handleDeletePost(post.id)}
            />;
          })}
        </div>
      </div>

      {selectedArtwork && (
        <ArtworkDetailModal 
          artwork={selectedArtwork}
          artist={selectedArtworkArtist}
          onClose={() => setSelectedArtwork(null)}
          isLiked={currentUser?.likedArtworkIds?.includes(selectedArtwork.id) || false}
          onToggleLike={() => handleArtworkLike(selectedArtwork.id)} 
        />
      )}
    </div>
  );
}

// Helper component for individual posts
const SocialPostItem = ({ post, currentUser, isHidden, isMenuOpen, onToggleMenu, onHide, onDelete }: any) => {
    // Author details are now included in the post object, but we handle potential missing data
    const author = post.author;

    if (!author) return null;

    const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;
    const isAuthor = currentUser?.id === post.authorId;

    return (
        <div className={`bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in ${isHidden ? 'opacity-60 grayscale bg-gray-50' : ''}`}>
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                <Link to={createUrl('/profile/:userId', { userId: post.authorId })}>
                    <img src={author.avatar} alt={author.name} className="w-10 h-10 rounded-full object-cover" />
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <Link to={createUrl('/profile/:userId', { userId: post.authorId })}>
                        <p className="font-semibold text-gray-900 hover:underline">{author.name}</p>
                        </Link>
                        {isHidden && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Hidden</span>}
                    </div>
                    <p className="text-xs text-gray-500">{post.timestampStr}</p>
                </div>
                </div>
                <div className="relative">
                    <button onClick={onToggleMenu} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><MoreVertical className="w-5 h-5" /></button>
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-10 animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={(e) => { e.stopPropagation(); onHide(); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                {isHidden ? "Unhide Post" : "Hide Post"}
                            </button>
                            {isAuthor && (
                                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" /> Delete Post
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="px-4 pb-2">
                {post.content && <p className="text-gray-800 whitespace-pre-wrap mb-4 text-base leading-relaxed">{post.content}</p>}
            </div>
            {post.image && <div className="w-full bg-gray-100"><img src={post.image} alt="Post" className="w-full object-cover max-h-[500px]" /></div>}
            <div className="p-4">
                 <div className="flex items-center gap-6">
                    <button className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}><Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} /> <span>{post.likes.length}</span></button>
                    <button className="flex items-center gap-2 text-gray-500"><MessageCircle className="w-6 h-6" /> <span>{post.comments.length}</span></button>
                 </div>
            </div>
        </div>
    );
};