import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  X, Trash2, Edit2, Save, Loader2, AlertCircle, 
  Tag, DollarSign, Sparkles, Wand2, ArrowLeft, 
  Heart, MessageCircle, ChevronLeft, Eye, EyeOff,
  Award, Shield, ExternalLink, Send
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Label } from '../components/ui/Label';
import { useUser } from '../context/UserContext';
import { db } from '../services/db';
import { Artwork, CollectionArtwork, DEFAULT_AVATAR_URL, recordInteraction } from '../data/mock';
import ConfirmationModal from '../components/ConfirmationModal';
import { useLikedArtworks } from '../hooks/useLikedArtworks';
import { certDb, Certificate } from '../services/certificates';
import { supabase } from '../lib/supabase';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface ArtworkViewProps {
  type: 'artwork' | 'collection';
}

export default function ArtworkView({ type }: ArtworkViewProps) {
  const { artworkId, userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { likedArtworks, toggleLike } = useLikedArtworks();

  const [artwork, setArtwork] = useState<Artwork | CollectionArtwork | null>(null);
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cert, setCert] = useState<Certificate | null>(null);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  
  const sidebarRef = useRef<HTMLElement>(null);

  // Edit state
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    tags: '',
    artistName: '',
    price: '',
    isPriceVisible: true
  });

  const openTimeRef = useRef<number>(Date.now());

  const loadData = useCallback(async () => {
    if (!artworkId) return;
    setLoading(true);
    setError(null);
    try {
      let data: Artwork | CollectionArtwork | null = null;
      let artistData: any = null;

      if (type === 'artwork') {
        data = await db.artworks.getById(artworkId);
        if (data && '_artist' in (data as any)) {
            artistData = (data as any)._artist;
        }
      } else if (userId) {
        data = await db.collections.getById(userId, artworkId);
        artistData = await db.users.getFullProfile(userId);
      }

      if (!data) throw new Error("Artwork not found.");
      
      setArtwork(data);
      setArtist(artistData);

      // Load certificate if this is a platform artwork
      if (type === 'artwork' && artworkId) {
        certDb.getByArtwork(artworkId)
          .then(c => setCert(c))
          .catch(() => setCert(null));
      }
      setEditData({
        title: data.title,
        description: data.description || '',
        tags: 'tags' in data ? data.tags.join(', ') : '',
        artistName: 'artistName' in data ? data.artistName : '',
        price: 'price' in data && data.price !== null ? data.price.toString() : '',
        // Handle legacy or undefined state by defaulting to true
        isPriceVisible: 'isPriceVisible' in data ? !!data.isPriceVisible : true
      });
    } catch (err: any) {
      console.error("Failed to load artwork view", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [artworkId, type, userId]);

  useEffect(() => {
    loadData();
    window.scrollTo(0, 0);
    if (sidebarRef.current) sidebarRef.current.scrollTop = 0;
    
    return () => {
        const duration = Date.now() - openTimeRef.current;
        if (duration > 3000 && currentUser && artworkId) {
            recordInteraction(currentUser.id, artworkId, 'linger');
        }
    };
  }, [loadData, currentUser, artworkId]);

  // Load comments + realtime subscription
  useEffect(() => {
    if (!artworkId) return;

    const loadComments = async () => {
      setLoadingComments(true);
      try {
        const { data } = await supabase
          .from('artwork_comments')
          .select('*, profiles(username, full_name, avatar_url)')
          .eq('artwork_id', artworkId)
          .order('created_at', { ascending: true });
        setComments((data ?? []) as Comment[]);
      } catch { /* ignore */ }
      finally { setLoadingComments(false); }
    };

    loadComments();

    // Realtime — new comments appear instantly
    const channel = supabase
      .channel(`artwork-comments-${artworkId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'artwork_comments',
        filter: `artwork_id=eq.${artworkId}`,
      }, async () => { await loadComments(); })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'artwork_comments',
        filter: `artwork_id=eq.${artworkId}`,
      }, async () => { await loadComments(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [artworkId]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser || !artworkId) return;
    setSubmittingComment(true);
    try {
      await supabase.from('artwork_comments').insert({
        artwork_id: artworkId,
        user_id: currentUser.id,
        content: commentText.trim(),
      });
      setCommentText('');
    } catch (e) {
      console.error('Failed to post comment', e);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from('artwork_comments').delete().eq('id', commentId);
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Opening Gallery</p>
        </div>
    );
  }

  if (error || !artwork) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Artwork Not Found</h2>
            <p className="text-gray-500 mb-8 max-w-sm">This piece might have been removed or moved to a private collection.</p>
            <Button onClick={() => navigate(-1)} className="rounded-2xl px-8">Go Back</Button>
        </div>
    );
  }

  const isPlatformArtwork = 'artistId' in artwork;
  const isOwner = currentUser?.id === artist?.id;
  const isLiked = likedArtworks.has(artwork.id);

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
    if (!currentUser) return;
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
      } else {
          await db.collections.update(currentUser.id, artwork.id, {
              title: editData.title,
              artistName: editData.artistName,
              description: editData.description
          });
      }
      setIsEditing(false);
      loadData();
    } catch (e: any) {
      console.error("Failed to update artwork", e);
      setError(e.message || "Failed to update artwork.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !artwork) return;
    try {
        if (isPlatformArtwork) {
          // deleteEverywhere handles cert-protected artworks gracefully —
          // hides instead of hard deletes if a certificate exists
          await db.artworks.deleteEverywhere(artwork.id, currentUser.id);
        } else if (userId) {
          await db.collections.delete(userId, artwork.id);
        }
        navigate(-1);
    } catch (e: any) {
        console.error("Failed to delete artwork", e);
        setError(e.message || "Failed to delete artwork. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 h-16 flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <h1 className="font-black text-gray-900 tracking-tighter text-lg hidden sm:block truncate max-w-[200px]">{artwork.title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
            {isOwner && (
                <>
                {!isEditing ? (
                    <Button variant="ghost" onClick={handleEditToggle} className="rounded-xl font-bold text-gray-500">
                        <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                ) : (
                    <Button onClick={handleSave} disabled={isSaving} className="rounded-xl font-bold shadow-lg shadow-purple-100">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save
                    </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(true)} className="rounded-full text-red-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                </Button>
                </>
            )}
        </div>
      </header>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fef2f2', borderBottom: '1px solid #fca5a5',
          padding: '10px 24px', fontSize: '0.85rem', color: '#dc2626', fontWeight: 600,
        }}>
          <AlertCircle size={15} />
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
            <X size={14} />
          </button>
        </div>
      )} 

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] overflow-hidden">
        <div className="flex-1 bg-gray-950 flex items-center justify-center p-4 sm:p-12 lg:p-20 relative">
            <div className="absolute inset-0 opacity-20 blur-3xl pointer-events-none overflow-hidden">
                <img src={artwork.image} className="w-full h-full object-cover scale-150" alt="" />
            </div>
            <div className="relative z-10 w-full h-full max-w-5xl flex items-center justify-center">
                <img 
                    src={artwork.image} 
                    alt={artwork.title} 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-zoom-in" 
                />
            </div>
        </div>

        <aside ref={sidebarRef} className="w-full lg:w-[450px] border-l border-gray-100 bg-white overflow-y-auto">
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <Link to={`/profile/${artist?.username}`} className="flex items-center gap-4 group">
                        <img 
                            src={artist?.avatar || DEFAULT_AVATAR_URL} 
                            alt={artist?.name} 
                            className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" 
                        />
                        <div>
                            <p className="font-black text-gray-900 text-lg leading-tight group-hover:text-purple-600 transition-colors">{artist?.name}</p>
                            <p className="text-sm text-gray-400 font-bold tracking-tight">@{artist?.username || 'artist'}</p>
                        </div>
                    </Link>
                    <button 
                        onClick={() => toggleLike(artwork.id)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${isLiked ? 'bg-purple-50 text-purple-600 shadow-inner' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                        <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                </div>

                <div className="space-y-6">
                    {isEditing ? (
                        <div className="space-y-5 animate-fade-in">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 ml-1">Title</Label>
                                <Input value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className="rounded-xl border-gray-100 font-bold" />
                            </div>
                            
                            {!isPlatformArtwork && (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 ml-1">Artist</Label>
                                    <Input value={editData.artistName} onChange={e => setEditData({...editData, artistName: e.target.value})} className="rounded-xl border-gray-100" />
                                </div>
                            )}

                            {isPlatformArtwork && (
                                <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100/50 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-700">Display Price</Label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-gray-400">
                                                {editData.isPriceVisible ? <span className="text-green-600">Visible</span> : <span className="text-gray-400">Hidden</span>}
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={() => setEditData(prev => ({ ...prev, isPriceVisible: !prev.isPriceVisible }))}
                                                className={`w-10 h-5 rounded-full relative transition-colors ${editData.isPriceVisible ? 'bg-purple-600' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${editData.isPriceVisible ? 'left-6' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                                            <Input type="number" value={editData.price} onChange={e => setEditData({...editData, price: e.target.value})} placeholder="0.00" className="pl-9 rounded-xl border-purple-100 bg-white h-11" />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={handleSuggestPrice} disabled={isSuggestingPrice} className="rounded-xl h-11 w-11 border border-purple-100 text-purple-600 bg-white">
                                            {isSuggestingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest leading-tight">Price is shown publicly by default. Select hidden if you wish to private your pricing.</p>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 ml-1">Description</Label>
                                <Textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} className="rounded-xl border-gray-100 min-h-[120px] leading-relaxed" />
                            </div>

                            {isPlatformArtwork && (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 ml-1">Tags</Label>
                                    <Input value={editData.tags} onChange={e => setEditData({...editData, tags: e.target.value})} placeholder="nature, abstract, oil" className="rounded-xl border-gray-100" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tighter leading-[0.92] break-words max-w-[10ch] sm:max-w-none">{artwork.title}</h2>
                                {isPlatformArtwork && (artwork as Artwork).isPriceVisible && (
                                    <div className="flex flex-col items-start sm:items-end shrink-0 self-start sm:self-auto">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pricing</span>
                                        <span className="text-lg sm:text-2xl font-black text-purple-700 leading-tight whitespace-nowrap">
                                            {(artwork as Artwork).price !== null && (artwork as Artwork).price !== undefined 
                                                ? `$${Number((artwork as Artwork).price).toLocaleString()}` 
                                                : "Contact for Price"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {!isPlatformArtwork && (
                                <p className="text-lg font-bold text-gray-500">
                                    Artist <span className="text-gray-900 font-black ml-1">{editData.artistName || 'unknown'}</span>
                                </p>
                            )}

                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Artwork Detail</h3>
                                <p className="text-gray-700 text-lg leading-relaxed font-medium text-justify">
                                    {artwork.description || "The artist left this piece as a pure visual experience without words."}
                                </p>
                            </div>

                            {isPlatformArtwork && 'tags' in artwork && artwork.tags && artwork.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {artwork.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-full flex items-center gap-1.5 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-100 transition-all cursor-default">
                                            <Tag className="w-3 h-3" /> {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Certificate of Authenticity block */}
                            {cert && !cert.is_revoked && (
                                <div style={{
                                    background: 'linear-gradient(135deg, #faf5ff, #f0fdf4)',
                                    border: '1.5px solid #ede9fe',
                                    borderRadius: 16,
                                    padding: '14px 16px',
                                    marginTop: 8,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 8,
                                            background: 'linear-gradient(135deg, #7c3aed, #0d9488)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <Award size={14} color="#fff" />
                                        </div>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1a1729' }}>
                                            Certificate of Authenticity
                                        </span>
                                        {cert.tier === 'blockchain' && (
                                            <span style={{
                                                fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px',
                                                background: '#f0fdf4', color: '#16a34a',
                                                border: '1px solid #86efac', borderRadius: 99,
                                                display: 'flex', alignItems: 'center', gap: 3,
                                            }}>
                                                <Shield size={9} /> On-chain
                                            </span>
                                        )}
                                    </div>

                                    {/* Cert number + verify button */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                                                Certificate number
                                            </div>
                                            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 800, color: '#7c3aed', letterSpacing: '0.06em' }}>
                                                {cert.cert_number}
                                            </span>
                                        </div>
                                        <Link
                                            to={`/verify/${cert.cert_number}`}
                                            style={{
                                                padding: '8px 16px', borderRadius: 10,
                                                background: 'linear-gradient(135deg, #7c3aed, #0d9488)',
                                                color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                                                display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none',
                                            }}
                                        >
                                            Verify <ExternalLink size={11} />
                                        </Link>
                                    </div>

                                    {/* Provenance summary */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Issued by</div>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1a1729' }}>{cert.artist_name}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                                                {cert.buyer_name && cert.buyer_name !== cert.artist_name ? 'Current Owner' : 'Held by Artist'}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1a1729' }}>
                                                {cert.buyer_name || cert.artist_name}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Sale date</div>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1a1729' }}>
                                                {new Date(cert.sale_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                        {cert.sale_price != null && (
                                            <div>
                                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Sale price</div>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1a1729' }}>
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cert.sale_price)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-8 border-t border-gray-100">
                    <div className="mb-5">
                        {comments.length > 0 && (
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                                {comments.length} comments
                            </span>
                        )}
                    </div>

                    {/* Comment input */}
                    {currentUser ? (
                        <div className="flex gap-3 mb-6">
                            <img
                                src={currentUser.avatar || DEFAULT_AVATAR_URL}
                                alt={currentUser.name}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
                            />
                            <div className="flex-1 relative">
                                <textarea
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); }}}
                                    placeholder="Share your thoughts..."
                                    rows={2}
                                    maxLength={1000}
                                    className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 pr-12"
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!commentText.trim() || submittingComment}
                                    className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                >
                                    {submittingComment
                                        ? <Loader2 size={13} className="animate-spin text-white" />
                                        : <Send size={13} color="#fff" />
                                    }
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-5 p-4 bg-gray-50 rounded-2xl text-center">
                            <p className="text-sm text-gray-500 font-medium">
                                <Link to="/login" className="text-purple-600 font-bold hover:underline">Log in</Link> to leave a comment
                            </p>
                        </div>
                    )}

                    {/* Comments list */}
                    {loadingComments ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                            <MessageCircle className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400 font-medium">Be the first to comment</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex gap-3 group">
                                    <img
                                        src={comment.profiles?.avatar_url || DEFAULT_AVATAR_URL}
                                        alt={comment.profiles?.full_name}
                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-sm font-black text-gray-900">
                                                {comment.profiles?.full_name || comment.profiles?.username}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                @{comment.profiles?.username}
                                            </span>
                                            <span className="text-xs text-gray-300 ml-auto">
                                                {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed break-words">
                                            {comment.content}
                                        </p>
                                    </div>
                                    {/* Delete — only own comments */}
                                    {currentUser?.id === comment.user_id && (
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-400 flex-shrink-0 self-start mt-0.5"
                                        >
                                            <X size={13} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </aside>
      </div>

      {showDeleteConfirm && (
          <ConfirmationModal 
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
            title="Delete Artwork"
            description="Are you sure you want to remove this piece from the gallery? This action is permanent."
            confirmText="Delete"
          />
      )}
    </div>
  );
}
