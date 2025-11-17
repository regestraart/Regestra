

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { Button } from './ui/Button';
import { User, Artwork } from '../data/mock';
import { createPageUrl } from '../utils';

interface ArtworkDetailModalProps {
  artwork: Artwork & { likes: number }; // Ensure likes is a number
  artist: User;
  onClose: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
}

const ArtworkDetailModal: React.FC<ArtworkDetailModalProps> = ({ artwork, artist, onClose, isLiked, onToggleLike }) => {
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
  
  const currentLikes = artwork.likes + (isLiked ? 1 : 0);

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
            <Link to={createPageUrl('Profile', { userId: artist.id })} className="flex items-center gap-3 group" onClick={onClose}>
              <img src={artist.avatar} alt={artist.name} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-bold text-gray-900 group-hover:underline">{artist.name}</p>
                <p className="text-sm text-gray-500">@{artist.username}</p>
              </div>
            </Link>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full -mr-2">
              <X className="w-5 h-5 text-gray-500" />
            </Button>
          </div>

          <div className="flex-grow">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{artwork.title}</h2>
            
            {artwork.description && (
              <p className="text-gray-700 mb-6">{artwork.description}</p>
            )}
            
            <div className="space-y-3 text-sm text-gray-600 mb-6 border-y border-gray-200 py-4">
              {artwork.size && (
                <div className="flex">
                  <span className="font-semibold text-gray-800 w-24 flex-shrink-0">Size</span>
                  <span>{artwork.size}</span>
                </div>
              )}
              {artwork.tags && artwork.tags.length > 0 && (
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
                <Button variant="ghost" size="icon" className="rounded-full" onClick={onToggleLike}>
                  <Heart className={`w-6 h-6 transition-colors ${isLiked ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MessageCircle className="w-6 h-6 text-gray-700" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Send className="w-6 h-6 text-gray-700" />
                </Button>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bookmark className="w-6 h-6 text-gray-700" />
              </Button>
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