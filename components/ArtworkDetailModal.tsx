
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, MessageCircle, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { User, Artwork, CollectionArtwork, recordInteraction } from '../data/mock';
import { createUrl } from '../utils';
import ConfirmationModal from './ConfirmationModal';
import { useUser } from '../context/UserContext';

type ModalArtwork = Artwork | CollectionArtwork;

interface ArtworkDetailModalProps {
  artwork: ModalArtwork;
  artist?: Partial<User> & { name: string };
  onClose: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  onDelete?: () => void;
}

const ArtworkDetailModal: React.FC<ArtworkDetailModalProps> = ({ artwork, artist, onClose, isLiked, onToggleLike, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { currentUser } = useUser();
  
  // Interaction Tracking
  const openTimeRef = useRef<number>(Date.now());
  
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
      
      // Calculate linger time on unmount/close
      const duration = Date.now() - openTimeRef.current;
      // If open for more than 3 seconds, count as a "linger" interaction
      if (duration > 3000 && currentUser) {
          recordInteraction(currentUser.id, artwork.id, 'linger');
      }
    };
  }, [onClose, artwork.id, currentUser]);

  if (!artwork) return null;
  
  const currentLikes = (('likes' in artwork && artwork.likes) || 0) + (isLiked ? 1 : 0);

  const isPlatformArtwork = 'artistId' in artwork;
  const artistName = artist?.name || ('artistName' in artwork ? artwork.artistName : 'Unknown Artist');

  return (
    <>
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
            {isPlatformArtwork && artist?.id ? (
              <Link to={createUrl('/profile/:userId', { userId: artist.id })} className="flex items-center gap-3 group" onClick={onClose}>
                <img src={artist.avatar} alt={artist.name} className="w-12 h-12 rounded-full" />
                <div>
                  <p className="font-bold text-gray-900 group-hover:underline">{artist.name}</p>
                  <p className="text-sm text-gray-500">@{artist.username}</p>
                </div>
              </Link>
            ) : (
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-xl">
                        {artistName.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">{artistName}</p>
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
              {'tags' in artwork && artwork.tags && Array.isArray(artwork.tags) && artwork.tags.length > 0 && (
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
                <Button variant="ghost" size="icon" className="rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600" onClick={() => setShowDeleteConfirm(true)} aria-label="Delete artwork">
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
             <p className="font-semibold text-gray-900 text-sm">
                {currentLikes.toLocaleString()} likes
            </p>
          </div>
        </div>
      </div>
    </div>
     {showDeleteConfirm && onDelete && (
        <ConfirmationModal 
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={onDelete}
          title="Delete Artwork"
          description="Are you sure you want to delete this artwork? This action is irreversible and the artwork will be permanently removed."
          confirmText="Delete Forever"
        />
      )}
    </>
  );
};

export default ArtworkDetailModal;
