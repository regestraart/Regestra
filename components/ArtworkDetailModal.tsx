import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, Edit2, Save, Loader2, AlertCircle, Tag, DollarSign, Sparkles, Wand2, Eye, EyeOff, Award } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { User, Artwork, CollectionArtwork, recordInteraction, DEFAULT_AVATAR_URL } from '../data/mock';
import { createUrl } from '../utils';
import ConfirmationModal from './ConfirmationModal';
import { useUser } from '../context/UserContext';
import { useSubscription } from '../context/SubscriptionContext';
import { db } from '../services/db';
import { certDb } from '../services/certificates';
import { IssueCertificateModal } from './IssueCertificateModal';

type ModalArtwork = Artwork | CollectionArtwork;

interface ArtworkDetailModalProps {
  artwork: ModalArtwork;
  artist: Partial<User> & { name: string, username?: string, avatar?: string, id?: string };
  onClose: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  onDelete?: () => void;
  onUpdate?: (updatedArtwork: ModalArtwork) => void;
}

const ArtworkDetailModal: React.FC<ArtworkDetailModalProps> = ({ artwork, artist, onClose, isLiked, onToggleLike, onDelete, onUpdate }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useUser();
  const { canIssueCerts, tier } = useSubscription();
  const [hasCert, setHasCert] = useState<boolean | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Edit state
  const [editData, setEditData] = useState({
    title: artwork.title,
    description: artwork.description || '',
    tags: 'tags' in artwork ? artwork.tags.join(', ') : '',
    artistName: 'artistName' in artwork ? artwork.artistName : '',
    size: 'size' in artwork ? artwork.size || '' : '',
    price: 'price' in artwork && artwork.price !== null ? artwork.price.toString() : '',
    // Use true if not specified (legacy migration handle)
    isPriceVisible: 'isPriceVisible' in artwork ? !!artwork.isPriceVisible : true
  });

  // Interaction Tracking
  const openTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    // Ensure the modal scrollable area starts at the top
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
      
      const duration = Date.now() - openTimeRef.current;
      if (duration > 3000 && currentUser) {
          recordInteraction(currentUser.id, artwork.id, 'linger');
      }
    };
  }, [onClose, artwork.id, currentUser, isSaving]);

  // Check if cert already exists for this artwork
  useEffect(() => {
    if (!artwork?.id || !('artistId' in artwork)) return;
    certDb.getByArtwork(artwork.id)
      .then(cert => setHasCert(!!cert))
      .catch(() => setHasCert(false));
  }, [artwork?.id]);

  if (!artwork) return null;
  
  const isPlatformArtwork = 'artistId' in artwork;
  const isOwner = currentUser?.id === artist.id;
  
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setError(null);
  };

  const handleSuggestPrice = async () => {
    setIsSuggestingPrice(true);
    setError(null);
    try {
        const response = await fetch(artwork.image);
        const blob = await response.blob();
        const reader = new FileReader();
        
        const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(blob);
        });

        const base64Data = await base64Promise;

        const apiResponse = await fetch('/.netlify/functions/gemini-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'suggest-price',
                image: { mimeType: blob.type, data: base64Data },
                title: editData.title,
                description: editData.description
            })
        });

        if (!apiResponse.ok) throw new Error("AI price suggestion failed.");
        
        const data = await apiResponse.json();
        setEditData(prev => ({ ...prev, price: data.suggestedPrice.toString() }));
    } catch (e: any) {
        setError(e.message || "Failed to get price suggestion.");
    } finally {
        setIsSuggestingPrice(false);
    }
  };

  const handleSave = async () => {
    if (!onUpdate || !currentUser) return;
    setIsSaving(true);
    setError(null);
    try {
      const priceValue = editData.price ? parseFloat(editData.price) : null;
      
      if (isPlatformArtwork) {
          const tagsArray = editData.tags.split(',').map(t => t.trim()).filter(Boolean);
          await db.artworks.update(artwork.id, {
              title: editData.title,
              description: editData.description,
              tags: tagsArray,
              price: priceValue as any,
              isPriceVisible: editData.isPriceVisible
          });
          onUpdate({
              ...artwork,
              title: editData.title,
              description: editData.description,
              tags: tagsArray,
              price: priceValue as any,
              isPriceVisible: editData.isPriceVisible
          } as Artwork);
      } else {
          await db.collections.update(currentUser.id, artwork.id, {
              title: editData.title,
              artistName: editData.artistName,
              description: editData.description
          });
          onUpdate({
              ...artwork,
              title: editData.title,
              artistName: editData.artistName,
              description: editData.description
          } as CollectionArtwork);
      }
      setIsEditing(false);
    } catch (e: any) {
      console.error("Failed to update artwork", e);
      setError(e.message || "Failed to update artwork.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm" 
      onClick={() => !isSaving && onClose()}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden animate-slide-up" 
        onClick={e => e.stopPropagation()}
      >
        <div className="w-full md:w-3/5 bg-gray-950 flex items-center justify-center overflow-hidden relative">
          <img 
            src={artwork.image} 
            alt={artwork.title} 
            className="w-full h-full object-contain" 
          />
        </div>

        <div ref={scrollContainerRef} className="w-full md:w-2/5 flex flex-col p-6 overflow-y-auto bg-white">
          <div className="flex items-start justify-between mb-6 flex-shrink-0">
             <Link to={createUrl('/profile/:username', { username: artist.username || '' })} className="flex items-center gap-3 group" onClick={onClose}>
                <img 
                    src={artist.avatar || DEFAULT_AVATAR_URL} 
                    alt={artist.name} 
                    className="w-12 h-12 rounded-full object-cover shadow-sm" 
                />
                <div>
                  <p className="font-bold text-gray-900 group-hover:underline text-lg">{artist.name}</p>
                  {artist.username && <p className="text-sm text-gray-500">@{artist.username}</p>}
                </div>
              </Link>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={isSaving} className="rounded-full -mr-2" aria-label="Close modal">
              <X className="w-5 h-5 text-gray-500" />
            </Button>
          </div>

          <div className="flex-grow space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 text-sm text-red-700 animate-slide-up">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {isEditing ? (
              <div className="space-y-4 animate-fade-in pb-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-title" className="text-xs uppercase tracking-widest font-black text-gray-400">Title</Label>
                  <Input 
                    id="edit-title" 
                    value={editData.title} 
                    onChange={(e) => setEditData({...editData, title: e.target.value})} 
                    className="rounded-xl border-gray-100"
                  />
                </div>
                {!isPlatformArtwork && (
                   <div className="space-y-1">
                    <Label htmlFor="edit-artist" className="text-xs uppercase tracking-widest font-black text-gray-400">Artist</Label>
                    <Input 
                        id="edit-artist" 
                        value={editData.artistName} 
                        onChange={(e) => setEditData({...editData, artistName: e.target.value})} 
                        className="rounded-xl border-gray-100"
                    />
                  </div>
                )}

                {isPlatformArtwork && (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="price-visibility" className="text-xs uppercase tracking-widest font-black text-gray-600">Public Pricing</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-gray-400">
                                    {editData.isPriceVisible ? <span className="text-green-600">Visible</span> : <span className="text-gray-400">Hidden</span>}
                                </span>
                                <button 
                                    type="button"
                                    onClick={() => setEditData(prev => ({ ...prev, isPriceVisible: !prev.isPriceVisible }))}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${editData.isPriceVisible ? 'bg-purple-600' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${editData.isPriceVisible ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input 
                                    id="edit-price" 
                                    type="number"
                                    value={editData.price} 
                                    onChange={(e) => setEditData({...editData, price: e.target.value})} 
                                    placeholder="0.00"
                                    className="pl-9 rounded-xl border-gray-100"
                                />
                            </div>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                className={`rounded-xl px-3 border border-purple-100 ${isSuggestingPrice ? 'animate-pulse text-purple-600' : 'text-purple-600 hover:bg-purple-50'}`}
                                onClick={handleSuggestPrice}
                                title="Regestra Price Suggestion"
                                disabled={isSuggestingPrice}
                            >
                                {isSuggestingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            </Button>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">Display is public by default. Hide if needed.</p>
                    </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="edit-description" className="text-xs uppercase tracking-widest font-black text-gray-400">Description</Label>
                  <Textarea 
                    id="edit-description" 
                    value={editData.description} 
                    onChange={(e) => setEditData({...editData, description: e.target.value})} 
                    className="rounded-xl border-gray-100 min-h-[100px]"
                  />
                </div>
                {isPlatformArtwork && (
                    <div className="space-y-1">
                        <Label htmlFor="edit-tags" className="text-xs uppercase tracking-widest font-black text-gray-400">Tags</Label>
                        <Input 
                            id="edit-tags" 
                            value={editData.tags} 
                            onChange={(e) => setEditData({...editData, tags: e.target.value})} 
                            placeholder="abstract, nature, oil"
                            className="rounded-xl border-gray-100"
                        />
                    </div>
                )}

                {/* Certificate of Authenticity — artists only, no cert issued yet */}
                {isPlatformArtwork && isOwner && hasCert === false && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #faf5ff, #f0fdf4)',
                    border: '1.5px solid #ede9fe', borderRadius: 14,
                    padding: '12px 14px', marginTop: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: 'linear-gradient(135deg, #7c3aed, #0d9488)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Award size={15} color="#fff" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a1729' }}>
                          Certificate of Authenticity
                        </div>
                        <div style={{ fontSize: '0.7rem', color: canIssueCerts ? '#6b7280' : '#7c3aed', marginTop: 2 }}>
                          {canIssueCerts
                            ? `Issue a ${tier === 'pro' ? 'Solana-anchored' : 'SHA-256 secured'} certificate`
                            : 'Requires Creator or Pro plan'}
                        </div>
                      </div>
                    </div>
                    {canIssueCerts ? (
                      <button
                        type="button"
                        onClick={() => { setIsEditing(false); setShowCertModal(true); }}
                        style={{
                          padding: '7px 14px', borderRadius: 9, border: 'none',
                          background: 'linear-gradient(135deg, #7c3aed, #0d9488)',
                          color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                        }}
                      >
                        <Award size={13} /> Issue Cert
                      </button>
                    ) : (
                      <a href="/subscription" style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, textDecoration: 'underline' }}>
                        Upgrade
                      </a>
                    )}
                  </div>
                )}

                {isPlatformArtwork && isOwner && hasCert === true && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#f0fdf4', border: '1px solid #86efac',
                    borderRadius: 12, padding: '10px 14px', marginTop: 8,
                    fontSize: '0.78rem', color: '#16a34a', fontWeight: 700,
                  }}>
                    <Award size={14} /> Certificate of Authenticity issued
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="flex flex-col gap-2 mb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <h2 className="text-base sm:text-xl font-black text-gray-900 leading-tight tracking-tight break-words max-w-[12ch] sm:max-w-none">{artwork.title}</h2>
                    {isPlatformArtwork && (artwork as Artwork).isPriceVisible && (
                        <div className="flex flex-col items-start sm:items-end gap-1 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 w-full sm:w-auto sm:min-w-[180px]">
                            <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest whitespace-nowrap">Pricing</span>
                            <span className="text-sm sm:text-base font-black text-purple-700 leading-tight whitespace-nowrap">
                                {(artwork as Artwork).price !== null && (artwork as Artwork).price !== undefined 
                                    ? `$${Number((artwork as Artwork).price).toLocaleString()}` 
                                    : "Contact for Price"}
                            </span>
                        </div>
                    )}
                </div>

                {!isPlatformArtwork && (
                    <p className="text-lg text-gray-600 mb-4 font-bold">
                        Artist <span className="text-gray-900">{editData.artistName || 'Unknown'}</span>
                    </p>
                )}
                
                {artwork.description && (
                     <div className="space-y-2 mb-6">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Artwork Detail</h3>
                        <p className="text-gray-700 text-base leading-relaxed font-medium" style={{textAlign: "justify"}}>{artwork.description}</p>
                     </div>
                )}

                {isPlatformArtwork && 'tags' in artwork && artwork.tags && artwork.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {artwork.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-[11px] font-black uppercase tracking-widest border border-gray-100 flex items-center gap-1.5">
                            <Tag className="w-3 h-3" /> {tag}
                        </span>
                        ))}
                    </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 pt-6 mt-auto border-t border-gray-50 flex items-center justify-between bg-white sticky bottom-0">
            <div className="flex items-center gap-2">
                {isOwner && (
                    <>
                        {isEditing ? (
                            <>
                                <Button variant="ghost" onClick={handleEditToggle} disabled={isSaving} className="rounded-xl font-bold">Cancel</Button>
                                <Button onClick={handleSave} disabled={isSaving} className="rounded-xl font-bold shadow-lg shadow-purple-100">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save Changes
                                </Button>
                            </>
                        ) : (
                            <Button variant="ghost" size="icon" onClick={handleEditToggle} className="rounded-full text-gray-400 hover:bg-gray-100 hover:text-purple-600 transition-colors" aria-label="Edit artwork">
                                <Edit2 className="w-5 h-5" />
                            </Button>
                        )}
                    </>
                )}
            </div>
            
            <div className="flex items-center gap-2">
              {onDelete && !isEditing && (
                <Button variant="ghost" size="icon" className="rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => setShowDeleteConfirm(true)} aria-label="Delete artwork">
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
     {showDeleteConfirm && onDelete && (
        <ConfirmationModal 
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={onDelete}
          title="Delete Artwork"
          description="Are you sure you want to delete this artwork? This action is irreversible."
          confirmText="Delete"
        />
      )}

      {showCertModal && currentUser && 'artistId' in artwork && (
        <IssueCertificateModal
          artwork={{
            id: artwork.id,
            title: artwork.title,
            image: artwork.image,
            description: artwork.description,
            price: (artwork as Artwork).price ?? null,
          }}
          artist={{
            id: currentUser.id,
            name: currentUser.name,
            username: currentUser.username,
          }}
          onClose={() => setShowCertModal(false)}
          onIssued={() => {
            setShowCertModal(false);
            setHasCert(true);
          }}
        />
      )}
    </>
  );
};

export default ArtworkDetailModal;
