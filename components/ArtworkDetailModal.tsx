import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, MessageCircle, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { User, Artwork, CollectionArtwork } from '../data/mock';
import { createPageUrl } from '../utils';

// FIX: Change ModalArtwork to be a union type, which is more flexible and fixes assignability issues.
type ModalArtwork = Artwork | CollectionArtwork;

interface ArtworkDetailModalProps {
  artwork: ModalArtwork;
  artist: Partial<User> & { name: string };
  onClose: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  onDelete?: (artworkId: string) => void;
}

const ArtworkDetailModal: React.FC<ArtworkDetailModalProps> = ({ artwork, artist, onClose, isLiked, onToggleLike, onDelete }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  if (!artwork || !artist) return null;
  
  const currentLikes = (('likes' in artwork && artwork.likes) || 0) + (isLiked ? 1 : 0);

  const handleDeleteClick = () => {
    if (onDelete) {
        onDelete(artwork.id);
    }
  };

  const isPlatformArtwork = 'artistId' in artwork;

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden animate-slide-up" 
        onClick={e => e.stopPropagation()}
      >
        <div className="w-full md:w-3/5 bg-gray-900 flex items-center justify-center overflow-hidden">
          <img 
            src={artwork.image} 
            alt={artwork.title} 
            className="w-full h-full object-contain" 
          />
        </div>

        <div className="w-full md:w-2/5 flex flex-col p-6 overflow-y-auto">
          <div className="flex items-start justify-between mb-4 flex-shrink-0">
            {isPlatformArtwork && artist.id ? (
              <Link to={createPageUrl('Profile', { userId: artist.id })} className="flex items-center gap-3 group" onClick={onClose}>
                <img src={artist.avatar} alt={artist.name} className="w-12 h-12 rounded-full" />
                <div>
                  <p className="font-bold text-gray-900 group-hover:underline">{artist.name}</p>
                  <p className="text-sm text-gray-500">@{artist.username}</p>
                </div>
              </Link>
            ) : (
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-xl">
                        {artist.name.charAt(0)}
                    </div>
                    <div>
                        {/* FIX: Use artist.name from props for consistency, as it's already correctly determined in the parent component. */}
                        <p className="font-bold text-gray-900">{artist.name}</p>
                        <p className="text-sm text-gray-500">From personal collection</p>
                    </div>
                </div>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full -mr-2" aria-label="Close modal">
              <X className="w-5 h-5 text-gray-500" />
            </Button>
          </div>

          <div className="flex-grow">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{artwork.title}</h2>
            
            {'description' in artwork && artwork.description && (
              <p className="text-gray-700 mb-6">{artwork.description}</p>
            )}
            
            <div className="space-y-3 text-sm text-gray-600 mb-6 border-y border-gray-200 py-4">
              {'size' in artwork && artwork.size && (
                <div className="flex">
                  <span className="font-semibold text-gray-800 w-24 flex-shrink-0">Size</span>
                  <span>{artwork.size}</span>
                </div>
              )}
              {'tags' in artwork && artwork.tags && artwork.tags.length > 0 && (
                <div className="flex">
                  <span className="font-semibold text-gray-800 w-24 flex-shrink-0">Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {artwork.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

             <div className="flex-grow mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Comments (3)</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex gap-2 items-start">
                        <img src="https://i.pravatar.cc/150?img=3" alt="Commenter" className="w-8 h-8 rounded-full"/>
                        <div>
                            <p><span className="font-semibold">Emma Rodriguez</span> This is absolutely stunning!</p>
                            <span className="text-xs text-gray-400">2h ago</span>
                        </div>
                    </div>
                     <div className="flex gap-2 items-start">
                        <img src="https://i.pravatar.cc/150?img=4" alt="Commenter" className="w-8 h-8 rounded-full"/>
                        <div>
                            <p><span className="font-semibold">James Kim</span> Love the color palette. 🔥</p>
                             <span className="text-xs text-gray-400">1h ago</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex-shrink-0 space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={onToggleLike} aria-label="Like artwork">
                  <Heart className={`w-6 h-6 transition-colors ${isLiked ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Comment on artwork">
                  <MessageCircle className="w-6 h-6 text-gray-700" />
                </Button>
              </div>
              {onDelete && (
                <div>
                  {!showConfirmDelete ? (
                    <Button variant="ghost" size="icon" className="rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600" onClick={() => setShowConfirmDelete(true)} aria-label="Delete artwork">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">Are you sure?</span>
                      <Button variant="ghost" size="sm" onClick={() => setShowConfirmDelete(false)}>Cancel</Button>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteClick}>Delete</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
             <p className="font-semibold text-gray-900 text-sm">
                {currentLikes.toLocaleString()} likes
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ArtworkDetailModal;