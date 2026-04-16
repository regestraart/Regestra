import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, Send, Heart, MessageCircle, MoreHorizontal, Trash2, EyeOff, RotateCcw, X, Loader2, AlertTriangle, Database, RefreshCw, ClipboardCheck, Link as LinkIcon, Info, Globe, Sparkles, ShieldAlert, Users, ExternalLink } from 'lucide-react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { useUser } from '../context/UserContext';
import { db } from './../services/db';
import { createUrl } from '../utils';
import { SocialPost, SocialComment, DEFAULT_AVATAR_URL } from '../data/mock';
import { SearchComponent } from './Search';
import { Input } from './ui/Input';
import { recommendationService, RecommendedArtist } from '../services/recommendations';

const getDomain = (url: string) => {
    if (!url) return 'ARTICLE';
    try {
        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http')) cleanUrl = 'https://' + cleanUrl;
        const hostname = new URL(cleanUrl).hostname;
        return hostname.replace('www.', '').toUpperCase();
    } catch (e) {
        return 'ARTICLE';
    }
};

const ArticleCard = ({ post }: { post: SocialPost }) => {
    const [imgError, setImgError] = useState(false);
    if (!post.articleUrl) return null;

    const title = post.articleTitle || "View Article";
    const domain = getDomain(post.articleUrl);

    return (
        <a href={post.articleUrl} target="_blank" rel="noopener noreferrer" className="block mt-4 rounded-2xl overflow-hidden border border-gray-200 hover:border-purple-300 transition-all group/article bg-white shadow-sm hover:shadow-md">
            {post.articleImage && !imgError && (
                <div className="relative aspect-[1.91/1] overflow-hidden bg-gray-100">
                    <img 
                        src={post.articleImage} 
                        alt={title} 
                        className="w-full h-full object-cover group-hover/article:scale-[1.03] transition-transform duration-700" 
                        onError={() => setImgError(true)}
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/article:opacity-100 transition-opacity"></div>
                </div>
            )}
            <div className={`p-5 ${post.articleImage && !imgError ? 'border-t border-gray-100' : ''}`}>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{domain}</p>
                <h3 style={{fontSize:"1.05rem",fontWeight:800,letterSpacing:"-0.015em",color:"#1a1729",lineHeight:1.28,transition:"color 0.18s"}} className="group-hover/article:text-purple-600">
                    {title}
                </h3>
                {post.articleDescription && (
                    <p className="text-[14px] text-gray-500 mt-2 line-clamp-2 leading-relaxed font-medium">
                        {post.articleDescription}
                    </p>
                )}
            </div>
        </a>
    );
};

export default function SocialFeed() {
  const { currentUser } = useUser();
  const currentUserRef = React.useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  const [feedTab, setFeedTab] = useState<'feed' | 'recommended'>('feed');
  const [recommendedArtists, setRecommendedArtists] = useState<RecommendedArtist[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [showArticleInput, setShowArticleInput] = useState(false);
  const [articleUrl, setArticleUrl] = useState('');
  
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const [articleMetadata, setArticleMetadata] = useState<{title: string, description: string, image: string} | null>(null);
  
  const [isPosting, setIsPosting] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedRepair, setCopiedRepair] = useState(false);
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [toast, setToast] = useState<{ message: string, undoAction?: () => void } | null>(null);
  const [expandedPostIds, setExpandedPostIds] = useState(new Set<string>());
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const metadataAbortController = useRef<AbortController | null>(null);
  const fetcherTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleSeeMore = (postId: string) => {
    setExpandedPostIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(postId)) {
            newSet.delete(postId);
        } else {
            newSet.add(postId);
        }
        return newSet;
    });
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const recentPosts = await db.feed.getRecentPosts(currentUserRef.current?.id);
      setPosts(recentPosts);
    } catch (error: any) {
      console.error("Failed to fetch posts", error);
      setError(error.message || "Failed to load feed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserRef.current) fetchPosts();
  }, []); // fetch once on mount — currentUser accessed via ref

  const fetchMetadata = useCallback(async () => {
    const trimmedUrl = articleUrl.trim();
    if (!trimmedUrl || trimmedUrl.length < 5) {
        setPreviewStatus('idle');
        setArticleMetadata(null);
        return;
    }

    let sanitizedUrl = trimmedUrl;
    if (!sanitizedUrl.startsWith('http')) sanitizedUrl = 'https://' + sanitizedUrl;
    
    if (metadataAbortController.current) metadataAbortController.current.abort();
    const controller = new AbortController();
    metadataAbortController.current = controller;

    setPreviewStatus('loading');
    setArticleMetadata(null);
    
    try {
      const response = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'intelligent-preview', url: sanitizedUrl }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Preview generation failed on the backend.');
      }

      const data = await response.json();
      if (data && data.title && !controller.signal.aborted) {
        setArticleMetadata(data);
        setPreviewStatus('success');
      } else {
        throw new Error('Backend returned incomplete data.');
      }
    } catch (e: any) {
      if (e.name !== 'AbortError' && !controller.signal.aborted) {
        console.error("Failed to fetch intelligent preview", e);
        setArticleMetadata(null);
        setPreviewStatus('failed');
      }
    }
  }, [articleUrl]);
  
  useEffect(() => {
    if (fetcherTimeoutRef.current) clearTimeout(fetcherTimeoutRef.current);
    fetcherTimeoutRef.current = setTimeout(fetchMetadata, 500);
    return () => {
        if (fetcherTimeoutRef.current) clearTimeout(fetcherTimeoutRef.current);
        if (metadataAbortController.current) metadataAbortController.current.abort();
    };
  }, [articleUrl, fetchMetadata]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (activeMenuId && !target.closest(`.post-menu-${activeMenuId}`)) setActiveMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setNewPostImage(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCreatePost = async () => {
    if (!currentUser || (!newPostContent.trim() && !newPostImage && !articleUrl)) return;
    
    setIsPosting(true);
    setError(null);
    
    try {
      let imageUrl = '';
      if (newPostImage) {
        const fileResponse = await fetch(newPostImage);
        const blob = await fileResponse.blob();
        const file = new File([blob], 'post_image.png', { type: blob.type });
        imageUrl = await db.storage.uploadImage('artworks', file);
      }
      
      let finalTitle = articleMetadata?.title;
      // If preview failed, generate a title from the URL slug
      if (!finalTitle && articleUrl && previewStatus !== 'success') {
          const parts = articleUrl.split('/').filter(p => p && !p.startsWith('http') && !p.includes('.com'));
          const lastSegment = parts[parts.length - 1];
          if (lastSegment) {
              finalTitle = lastSegment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          } else {
              finalTitle = getDomain(articleUrl);
          }
      }

      await db.feed.createPost({
        author_id: currentUser.id,
        content: newPostContent,
        image_url: imageUrl || undefined,
        article_url: articleUrl || undefined,
        article_title: finalTitle || "Untitled Vision",
        article_description: articleMetadata?.description || "",
        article_image: articleMetadata?.image || ""
      });
      
      setNewPostContent('');
      setNewPostImage(null);
      setArticleUrl('');
      setArticleMetadata(null);
      setPreviewStatus('idle');
      setShowArticleInput(false);
      await fetchPosts();
      setToast({ message: "Vision shared successfully!" });
    } catch (err: any) {
      console.error("Post handler error:", err);
      setError(err.message || "Failed to post. Your database schema might be out of date.");
    } finally {
      setIsPosting(false);
    }
  };

  const copyRepairSql = () => {
    const sql = `-- REGESTRA SCHEMA REPAIR
-- 1. Add missing metadata columns to social_posts
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS article_url text;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS article_title text;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS article_description text;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS article_image text;

-- 2. Add missing pricing columns to artworks
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS price numeric(10,2);
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS is_price_visible boolean DEFAULT false;

-- 3. Force API to see changes immediately
NOTIFY pgrst, 'reload schema';

SELECT 'Fix Applied! Now REFRESH your browser tab.' as status;`.trim();
    navigator.clipboard.writeText(sql);
    setCopiedRepair(true);
    setTimeout(() => setCopiedRepair(false), 2000);
  };

  const toggleLike = async (postId: string) => {
    if (!currentUser) return;
    const originalPosts = [...posts];
    setPosts(posts.map(p => {
        if (p.id === postId) {
            const isLiked = p.likes.includes(currentUser.id);
            return { ...p, likes: isLiked ? p.likes.filter(id => id !== currentUser.id) : [...p.likes, currentUser.id] };
        }
        return p;
    }));
    try {
      await db.feed.likePost(currentUser.id, postId);
    } catch (error) {
      setPosts(originalPosts);
    }
  };
  
  const handleAddComment = async (postId: string) => {
    if (!currentUser || !commentText.trim()) return;
    setIsSubmittingComment(true);
    const textToSubmit = commentText;
    setCommentText('');
    try {
      await db.feed.addComment(postId, currentUser.id, textToSubmit);
      await fetchPosts();
    } catch (error) {
      console.error("Failed to add comment", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  const handleEditPost = (post: SocialPost) => {
    setEditingPostId(post.id);
    setEditPostContent(post.content || '');
    setActiveMenuId(null);
  };

  const handleSavePost = async (postId: string) => {
    if (!editPostContent.trim() || !currentUser) return;
    setIsSavingEdit(true);
    try {
      await db.feed.updatePost(currentUser.id, postId, editPostContent.trim());
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: editPostContent.trim() } : p));
      setEditingPostId(null);
    } catch (e) { console.error(e); }
    finally { setIsSavingEdit(false); }
  };

  const handleEditComment = (comment: SocialComment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.text || '');
  };

  const handleSaveComment = async (postId: string, commentId: string) => {
    if (!editCommentContent.trim() || !currentUser) return;
    setIsSavingEdit(true);
    try {
      await db.feed.updateComment(currentUser.id, commentId, editCommentContent.trim());
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        comments: p.comments.map(c => c.id === commentId ? { ...c, text: editCommentContent.trim() } : c)
      } : p));
      setEditingCommentId(null);
    } catch (e) { console.error(e); }
    finally { setIsSavingEdit(false); }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!currentUser) return;
    try {
      await db.feed.deleteComment(currentUser.id, commentId);
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        comments: p.comments.filter(c => c.id !== commentId)
      } : p));
    } catch (e) { console.error(e); }
  };

  const handleDeletePost = async (postId: string) => {
      await db.feed.deletePost(currentUser!.id, postId);
      await fetchPosts();
      setActiveMenuId(null);
  };
  
  const handleHidePost = async (postId: string) => {
      await db.feed.hidePost(currentUser!.id, postId);
      setPosts(posts.filter(p => p.id !== postId));
      setActiveMenuId(null);
      setToast({ message: "Post hidden from your feed." });
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
        {/* Feed tabs */}
        <div style={{ display:'flex', background:'#f3f0ff', borderRadius:14, padding:4, gap:4, marginBottom:20 }}>
          {([['feed','Your Feed'],['recommended','Recommended']] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => {
              setFeedTab(tab);
              if (tab === 'recommended' && recommendedArtists.length === 0 && currentUser?.id) {
                setRecommendationsLoading(true);
                recommendationService.getRecommendations(currentUser.id)
                  .then(r => setRecommendedArtists(r.artists))
                  .catch(() => {})
                  .finally(() => setRecommendationsLoading(false));
              }
            }} style={{
              flex:1, padding:'9px 0', borderRadius:10, border:'none',
              background: feedTab === tab ? '#fff' : 'transparent',
              color: feedTab === tab ? '#7c3aed' : '#9ca3af',
              fontWeight:700, fontSize:'0.85rem', cursor:'pointer',
              boxShadow: feedTab === tab ? '0 1px 6px rgba(124,58,237,0.12)' : 'none',
              transition:'all 200ms',
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}>
              {tab === 'recommended' && <Sparkles size={13} />}
              {label}
            </button>
          ))}
        </div>

        {/* Recommended tab content */}
        {feedTab === 'recommended' && (
          <div>
            {recommendationsLoading ? (
              <div style={{ textAlign:'center', padding:'60px 0' }}>
                <div style={{ width:56, height:56, borderRadius:18, background:'linear-gradient(135deg, #7c3aed, #0d9488)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <Sparkles size={24} color="#fff" />
                </div>
                <p style={{ color:'#9ca3af', fontWeight:600 }}>Finding artists you'll love...</p>
              </div>
            ) : recommendedArtists.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 24px', background:'#fff', borderRadius:20, border:'1.5px dashed #e5e7eb' }}>
                <Sparkles size={36} color="#d1c4ff" style={{ margin:'0 auto 14px' }} />
                <div style={{ fontWeight:800, color:'#1a1729', marginBottom:6 }}>No recommendations yet</div>
                <p style={{ fontSize:'0.85rem', color:'#9ca3af' }}>
                  Connect with artists and like artworks to help us learn your taste.
                </p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                  ✦ Artists curated for you
                </div>
                {recommendedArtists.map(artist => (
                  <div key={artist.id} style={{ background:'#fff', borderRadius:20, border:'1.5px solid #f0ebff', overflow:'hidden', boxShadow:'0 2px 12px rgba(124,58,237,0.06)' }}>
                    {/* Sample artwork images */}
                    {artist.sampleImages.length > 0 && (
                      <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(artist.sampleImages.length, 3)}, 1fr)`, height:120, overflow:'hidden' }}>
                        {artist.sampleImages.slice(0, 3).map((img, i) => (
                          <img key={i} src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        ))}
                      </div>
                    )}
                    <div style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                        <img
                          src={artist.avatar_url || DEFAULT_AVATAR_URL}
                          alt={artist.name}
                          style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}
                        />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:800, color:'#1a1729', fontSize:'0.92rem' }}>{artist.name}</div>
                          <div style={{ fontSize:'0.75rem', color:'#7c3aed' }}>@{artist.username}</div>
                        </div>
                        <Link to={createUrl('/profile/:username', { username: artist.username })}
                          style={{ padding:'7px 14px', borderRadius:10, background:'linear-gradient(135deg, #7c3aed, #0d9488)', color:'#fff', fontSize:'0.78rem', fontWeight:700, textDecoration:'none', flexShrink:0 }}>
                          View Profile
                        </Link>
                      </div>
                      {artist.matchReason && (
                        <div style={{ display:'flex', alignItems:'flex-start', gap:6, background:'#f9f8ff', borderRadius:10, padding:'8px 10px' }}>
                          <Sparkles size={12} color="#7c3aed" style={{ flexShrink:0, marginTop:1 }} />
                          <span style={{ fontSize:'0.78rem', color:'#6b7280', lineHeight:1.5 }}>{artist.matchReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Regular feed — only shown when feed tab is active */}
        {feedTab === 'feed' && (<>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 transition-all">
          <div className="flex gap-4">
            <img src={currentUser?.avatar || DEFAULT_AVATAR_URL} alt="Your avatar" className="w-10 h-10 rounded-full object-cover" />
            <Textarea
              value={newPostContent}
              onChange={(e) => { setNewPostContent(e.target.value); setError(null); }}
              placeholder="What's your vision today?"
              className="flex-1 bg-gray-50 border-0 focus:ring-purple-500 resize-none min-h-[80px] text-[15px]"
            />
          </div>
          
          {newPostImage && (
            <div className="relative mt-4 group">
              <img src={newPostImage} alt="Preview" className="rounded-xl max-h-80 w-auto shadow-sm" />
              <button onClick={() => setNewPostImage(null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {showArticleInput && (
            <div className="mt-4 bg-purple-50/50 p-4 rounded-xl border border-purple-100 animate-slide-up">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest flex items-center gap-1.5"><LinkIcon className="w-3 h-3" /> Article Link</p>
                    <button onClick={() => { setShowArticleInput(false); setArticleUrl(''); setArticleMetadata(null); setPreviewStatus('idle'); }} className="text-purple-400 hover:text-purple-600"><X className="w-3.5 h-3.5" /></button>
                </div>
                <Input 
                    placeholder="https://..." 
                    value={articleUrl} 
                    onChange={(e) => { setArticleUrl(e.target.value); setError(null); }}
                    className="bg-white border-purple-200 rounded-lg text-sm h-11 focus:ring-purple-400"
                    disabled={isPosting}
                />

                {previewStatus !== 'idle' && (
                  <div className="mt-3 rounded-lg border border-purple-100 bg-white overflow-hidden animate-fade-in shadow-sm">
                    {previewStatus === 'loading' && (
                      <div className="p-4 flex items-center gap-3 animate-pulse">
                        <div className="w-20 h-20 rounded-md bg-gray-200 flex-shrink-0"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded-full w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded-full w-full"></div>
                            <div className="h-3 bg-gray-200 rounded-full w-1/2"></div>
                        </div>
                      </div>
                    )}
                    {previewStatus === 'success' && articleMetadata && (
                      <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                        {articleMetadata.image && <img src={articleMetadata.image} className="w-20 h-20 rounded-md object-cover flex-shrink-0 bg-gray-100" alt="Article preview" onError={(e) => { (e.currentTarget.style.display = 'none'); }} />}
                        <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{articleMetadata.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">{articleMetadata.description}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{getDomain(articleUrl)}</p>
                        </div>
                      </a>
                    )}
                    {previewStatus === 'failed' && (
                        <div className="p-4 flex items-center justify-between gap-3 bg-gray-50">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center"><LinkIcon className="w-4 h-4 text-gray-500" /></div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-700 truncate">{getDomain(articleUrl)}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{articleUrl}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs rounded-full" onClick={fetchMetadata}>
                                <RefreshCw className="w-3 h-3 mr-1" /> Retry
                            </Button>
                        </div>
                    )}
                  </div>
                )}
            </div>
          )}

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
            <div className="flex gap-1">
                <input type="file" id="imageUpload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                <label htmlFor="imageUpload" className="cursor-pointer">
                  <Button variant="ghost" size="icon" className="text-gray-500 rounded-full hover:bg-gray-100" asChild title="Upload Image" disabled={isPosting}>
                    <div className="flex items-center justify-center"><ImageIcon className="w-5 h-5" /></div>
                  </Button>
                </label>
                <Button variant="ghost" size="icon" className={`rounded-full ${showArticleInput ? 'text-purple-600 bg-purple-50' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setShowArticleInput(!showArticleInput)} title="Add Article Link" disabled={isPosting}>
                    <LinkIcon className="w-5 h-5" />
                </Button>
            </div>
            <Button onClick={handleCreatePost} disabled={isPosting || (!newPostContent.trim() && !newPostImage && !articleUrl)} className="rounded-full px-6 font-bold shadow-lg">
              {isPosting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null} {isPosting ? 'Publishing...' : 'Post'}
            </Button>
          </div>
        </div>

        {error && (
            <div className={`mb-6 p-6 rounded-2xl border animate-slide-up shadow-sm flex flex-col gap-4 bg-amber-50 border-amber-200 text-amber-900`}>
                <div className="flex items-start gap-4">
                    <ShieldAlert className={`w-8 h-8 flex-shrink-0 mt-0.5 text-amber-600`} />
                    <div className="flex-1">
                        <p className="font-black text-lg tracking-tight">Post Failed</p>
                        <p className="text-sm mt-1 leading-relaxed">{error}</p>
                        <div className="mt-4 p-4 bg-white/50 rounded-xl border border-amber-200">
                             <p className="text-xs font-bold uppercase tracking-wider mb-3">Quick Repair Steps:</p>
                             <ol className="text-xs space-y-3 list-decimal ml-4 mb-4">
                                 <li>Run the fix script from the button below in your Supabase <b>SQL Editor</b>.</li>
                                 <li><b>Hard Refresh</b> your browser tab (Ctrl+F5 / Cmd+Shift+R).</li>
                             </ol>
                             <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="default" onClick={copyRepairSql} className="h-10 px-6 rounded-xl bg-amber-600 hover:bg-amber-700">
                                    {copiedRepair ? <><ClipboardCheck className="w-4 h-4 mr-2" /> Copied!</> : <><Database className="w-4 h-4 mr-2" /> Copy Fix SQL</>}
                                </Button>
                                <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="flex-1">
                                    <Button variant="outline" className="w-full h-10 text-xs rounded-xl border-amber-300 text-amber-800 bg-white hover:bg-amber-50">
                                        Open Supabase <ExternalLink className="w-3 h-3 ml-2" />
                                    </Button>
                                </a>
                             </div>
                        </div>
                        <button onClick={() => { setError(null); setIsPosting(false); }} className="text-xs font-bold text-amber-600 hover:underline mt-4">Discard Draft & Reset</button>
                    </div>
                </div>
            </div>
        )}

        {/* Posts */}
        <div className="space-y-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading feed...</p>
             </div>
          ) : posts.length > 0 ? (
            posts.map(post => {
              const isExpanded = expandedPostIds.has(post.id);
              const isLongPost = post.content && post.content.length > 50;

              return (
              <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in transition-all">
                <div className="flex items-start justify-between">
                  <Link to={createUrl('/profile/:username', { username: post.authorUsername })} className="flex items-center gap-3 group">
                    <img src={post.authorAvatar} alt={post.authorUsername} className="w-11 h-11 rounded-full object-cover shadow-sm group-hover:ring-2 group-hover:ring-purple-200 transition-all" />
                    <div className="flex flex-col">
                      <p className="font-bold text-[15px] text-gray-900 group-hover:text-purple-600 transition-colors leading-tight">{post.authorUsername}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{post.timestampStr}</span>
                          <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                          <Globe className="w-2.5 h-2.5 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                  {currentUser?.id === post.authorId && (
                    <div className={`relative post-menu-${post.id}`}>
                      <Button variant="ghost" size="icon" className="rounded-full text-gray-400" onClick={() => setActiveMenuId(post.id)}>
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                      {activeMenuId === post.id && (
                        <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 w-44 z-10 animate-zoom-in py-1">
                          <button onClick={() => handleEditPost(post)} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"><Pencil className="w-4 h-4" /> Edit Post</button>
                        <button onClick={() => handleDeletePost(post.id)} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"><Trash2 className="w-4 h-4" /> Delete Post</button>
                          <button onClick={() => handleHidePost(post.id)} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"><EyeOff className="w-4 h-4" /> Hide from Feed</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {editingPostId === post.id ? (
                  <div className="mt-4 space-y-2">
                    <textarea
                      value={editPostContent}
                      onChange={e => setEditPostContent(e.target.value)}
                      className="w-full p-3 rounded-xl border border-purple-200 text-[15px] leading-relaxed text-gray-800 resize-none focus:outline-none focus:border-purple-400 bg-purple-50/30"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingPostId(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
                      <button onClick={() => handleSavePost(post.id)} disabled={isSavingEdit || !editPostContent.trim()} className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-40 transition-colors flex items-center gap-1">
                        {isSavingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Save
                      </button>
                    </div>
                  </div>
                ) : post.content && (
                    <div className="mt-4 text-[15px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {isLongPost && !isExpanded ? (
                            <p>
                                {`${post.content.substring(0, 50)}... `}
                                <button onClick={() => toggleSeeMore(post.id)} className="text-purple-600 font-bold hover:underline">
                                    See more
                                </button>
                            </p>
                        ) : (
                            <p>
                                {post.content}
                                {isLongPost && isExpanded && (
                                    <>
                                        {' '}
                                        <button onClick={() => toggleSeeMore(post.id)} className="text-purple-600 font-bold hover:underline">
                                            See less
                                        </button>
                                    </>
                                )}
                            </p>
                        )}
                    </div>
                )}
                {post.image && <img src={post.image} alt="Post content" className="mt-4 rounded-xl border border-gray-100 w-full max-h-[550px] object-cover shadow-sm" />}
                
                {/* Article Preview Component */}
                <ArticleCard post={post} />
                
                <div className="flex items-center gap-8 mt-4 pt-4 border-t border-gray-50">
                  <button 
                    onClick={() => toggleLike(post.id)} 
                    className={`flex items-center gap-2 text-sm font-bold transition-all active:scale-90 ${post.likes.includes(currentUser!.id) ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Heart className={`w-5 h-5 ${post.likes.includes(currentUser!.id) ? 'fill-current' : ''}`} /> {post.likes.length}
                  </button>
                  <button 
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-all" 
                    onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                  >
                    <MessageCircle className="w-5 h-5" /> {post.comments.length}
                  </button>
                </div>

                {expandedPostId === post.id && (
                  <div className="mt-6 space-y-4 animate-fade-in border-t border-gray-50 pt-4">
                    <div className="space-y-4">
                      {post.comments.map(comment => (
                        <div key={comment.id} className="flex gap-3 text-sm animate-fade-in">
                          <Link to={createUrl('/profile/:username', { username: comment.userUsername })}>
                            <img src={comment.userAvatar || DEFAULT_AVATAR_URL} alt={comment.userUsername} className="w-8 h-8 rounded-full object-cover shadow-sm" />
                          </Link>
                          <div className="flex-1">
                            {editingCommentId === comment.id ? (
                              <div className="space-y-1.5">
                                <textarea
                                  value={editCommentContent}
                                  onChange={e => setEditCommentContent(e.target.value)}
                                  className="w-full p-2.5 rounded-xl border border-purple-200 text-[14px] leading-relaxed text-gray-800 resize-none focus:outline-none focus:border-purple-400 bg-purple-50/30"
                                  rows={2}
                                  autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 text-xs font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                                  <button onClick={() => handleSaveComment(post.id, comment.id)} disabled={isSavingEdit || !editCommentContent.trim()} className="px-3 py-1 text-xs font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-40 flex items-center gap-1">
                                    {isSavingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="bg-gray-100/70 p-3 rounded-2xl">
                                  <p className="leading-relaxed text-[14px]">
                                    <Link to={createUrl('/profile/:username', { username: comment.userUsername })} className="font-bold text-purple-700 hover:text-purple-900 transition-colors mr-1.5">{comment.userUsername}</Link>
                                    {comment.text}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 mt-1 ml-3">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{comment.timestamp}</p>
                                  {comment.userId === currentUser?.id && (
                                    <>
                                      <button onClick={() => handleEditComment(comment)} className="text-[10px] text-gray-400 hover:text-purple-600 font-bold uppercase tracking-wider transition-colors">Edit</button>
                                      <button onClick={() => handleDeleteComment(post.id, comment.id)} className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase tracking-wider transition-colors">Delete</button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-3">
                      <img src={currentUser?.avatar} alt="Your avatar" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                      <div className="relative flex-1">
                        <Input 
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add a comment..." 
                          className="rounded-full bg-gray-50 pr-12 h-10 text-[14px] focus:bg-white transition-all border-0 shadow-inner"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        />
                        <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-purple-600 hover:bg-purple-50" onClick={() => handleAddComment(post.id)} disabled={isSubmittingComment || !commentText.trim()}>
                          {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200 animate-fade-in">
                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-purple-200" />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tighter">Your feed is waiting</h3>
                <p className="text-gray-500 mt-2 max-w-sm mx-auto text-[15px] leading-relaxed">
                    Connect with other artists to see their visions here. You'll always see updates from the official Regestra account.
                </p>
                <div className="mt-8">
                   <div className="w-full max-w-xs mx-auto">
                      <SearchComponent />
                   </div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">Discover Artists & Start Connecting</p>
                </div>
            </div>
          )}
        </div>
        </>)}

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-slide-up z-50">
            <p className="text-sm font-medium">{toast.message}</p>
            <button onClick={() => setToast(null)} className="p-1 -mr-1 text-gray-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}
    </div>
  );
}
