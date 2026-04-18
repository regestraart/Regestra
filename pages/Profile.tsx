
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, Link as LinkIcon, Calendar, Shield,
  Grid, Bookmark, Edit, UserPlus, UserCheck, Image as ImageIcon, Clock, Check, X, AlertCircle, Database, ClipboardCheck, RefreshCw, Loader2, Globe, ExternalLink, MoreVertical, Trash2, ShoppingBag
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useUser } from '../context/UserContext';
import { db } from '../services/db';
import { User, Artwork, CollectionArtwork, DEFAULT_AVATAR_URL } from '../data/mock';
import EditProfileModal from '../components/EditProfileModal';
import { useLikedArtworks } from '../hooks/useLikedArtworks';
import { supabase } from '../lib/supabase';
import { VerifiedArtistBadge } from '../components/VerifiedArtistBadge';
import { VerificationModal } from '../components/VerificationModal';
import { verificationDb, VerificationRequest } from '../services/verification';

const Stat = ({ value, label }: { value: number | string; label: string }) => (
  <div className="flex-1 flex flex-col items-center py-1 border-r last:border-r-0 border-gray-100 min-w-0">
    <span className="rg-stat-value">{value}</span>
    <span className="rg-stat-label truncate w-full text-center">{label}</span>
  </div>
);

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, refreshCurrentUser } = useUser();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [hasIncomingRequest, setHasIncomingRequest] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedRepair, setCopiedRepair] = useState(false);
  const [manageItem, setManageItem] = useState<Artwork | CollectionArtwork | null>(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);
  // Default tab: artists see Artworks first, art lovers see Collection first
  const [activeTab, setActiveTab] = useState<'artworks' | 'collection'>('artworks');
  const [optimisticFollowState, setOptimisticFollowState] = useState<'none' | 'pending' | 'following' | null>(null);
  
  const { likedArtworks } = useLikedArtworks();

  // Verification state
  const [isVerifiedArtist, setIsVerifiedArtist] = useState(false);
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const isOwnProfile = currentUser?.username === username;

  // Keep a ref to currentUser so loadProfile doesn't need it as a dep
  const currentUserRef = React.useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  const loadProfile = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setHasIncomingRequest(false);
    setActionError(null);
    const cu = currentUserRef.current;
    try {
      const user = await db.users.getProfileByUsername(username);
      setProfileUser(user);
      setOptimisticFollowState(null);
      setActiveTab(user?.role === 'artLover' ? 'collection' : 'artworks');

      if (user) {
        // Run all secondary fetches in parallel
        const [userArtworks, profileData, followData, verificationReq] = await Promise.all([
          db.artworks.getByArtist(user.id),
          supabase.from('profiles').select('is_verified_artist').eq('id', user.id).maybeSingle(),
          cu && cu.id !== user.id
            ? supabase.from('follows').select('status')
                .eq('follower_id', user.id).eq('following_id', cu.id).maybeSingle()
            : Promise.resolve(null),
          cu?.id === user.id
            ? verificationDb.getMyRequest(user.id).catch(() => null)
            : Promise.resolve(null),
        ]);

        setArtworks(userArtworks);
        setIsVerifiedArtist(profileData.data?.is_verified_artist ?? false);
        if (verificationReq !== null) setVerificationRequest(verificationReq);
        if (followData && (followData as any).data?.status === 'pending') {
          setHasIncomingRequest(true);
        }
      }
    } catch (error: any) {
      console.error("Failed to load profile", error);
      setActionError(error.message);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ── Realtime subscriptions ─────────────────────────────────────────────────
  // Re-fetches profile + artworks whenever artworks, follows, or the profile
  // row changes in Supabase — keeps counts and gallery in sync instantly.
  useEffect(() => {
    if (!username) return;

    // Use profileUser from state (already loaded) — avoid a redundant DB call
    const profileUserId = profileUser?.id ?? null;

    const channel = supabase
      .channel(`profile-realtime-${username}`)
      // Artwork changes (insert, update, delete) for this artist
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'artworks',
        filter: profileUserId ? `artist_id=eq.${profileUserId}` : undefined,
      }, () => { loadProfile(); })
      // Follow changes scoped to this user only (follower or following)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follows',
        filter: profileUserId ? `following_id=eq.${profileUserId}` : undefined,
      }, () => { loadProfile(); })
      // Profile row changes scoped to this user
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: profileUserId ? `id=eq.${profileUserId}` : undefined,
      }, () => { loadProfile(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [username, loadProfile, profileUser?.id]);

  const isFollowing = optimisticFollowState !== null
    ? optimisticFollowState === 'following'
    : currentUser?.followingIds?.includes(profileUser?.id || '') ?? false;
  const isRequested = optimisticFollowState !== null
    ? optimisticFollowState === 'pending'
    : currentUser?.followingIds?.includes(`pending:${profileUser?.id}`) ?? false;

  const handleFollowToggle = async () => {
    if (!currentUser || !profileUser) return;
    setActionError(null);

    const wasFollowing = isFollowing;
    const wasRequested = isRequested;

    // Optimistic update — button responds instantly
    setOptimisticFollowState(wasFollowing || wasRequested ? 'none' : 'pending');

    try {
        if (wasFollowing || wasRequested) {
            await db.users.unfollowUser(currentUser.id, profileUser.id);
        } else {
            await db.users.followUser(currentUser.id, profileUser.id);
        }
        // Refresh in background to sync real state, then clear optimistic override
        refreshCurrentUser().then(() => setOptimisticFollowState(null));
    } catch (e: any) {
        console.error("Follow error", e);
        setActionError(e.message || "Failed to update connection.");
        // Roll back optimistic update
        setOptimisticFollowState(wasFollowing ? 'following' : wasRequested ? 'pending' : 'none');
        refreshCurrentUser().then(() => setOptimisticFollowState(null));
    }
  };

  const copyRepairSqlFromAlert = () => {
    const repairSql = `
-- REGESTRA DATABASE REPAIR SCRIPT
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
SELECT 'Database schema successfully refreshed. You can now refresh your app.' as result;
    `.trim();

    navigator.clipboard.writeText(repairSql);
    setCopiedRepair(true);
    setTimeout(() => setCopiedRepair(false), 2000);
  };

  const handleAcceptRequest = async () => {
    if (!currentUser || !profileUser) return;
    setActionError(null);
    try {
      await db.users.acceptRequest(profileUser.id, currentUser.id);
      setHasIncomingRequest(false);
      await refreshCurrentUser();
      const updatedProfile = await db.users.getFullProfile(profileUser.id);
      setProfileUser(updatedProfile);
    } catch (e: any) {
      console.error("Failed to accept request", e);
      setActionError(e.message);
    }
  };

  const handleDeclineRequest = async () => {
    if (!currentUser || !profileUser) return;
    setActionError(null);
    try {
      await db.users.declineRequest(profileUser.id, currentUser.id);
      setHasIncomingRequest(false);
    } catch (e: any) {
      console.error("Failed to decline request", e);
      setActionError(e.message);
    }
  };

  const handleEditSave = useCallback(async (updates: Partial<User>) => {
    if (!profileUser) return;
    await db.users.updateProfile(profileUser.id, updates);
    
    // If username changed, we need to navigate to the new URL
    const newUsername = updates.username || profileUser.username;
    
    const updatedProfile = await db.users.getFullProfile(profileUser.id);
    if (updatedProfile) {
        setProfileUser(updatedProfile);
        if (isOwnProfile) await setCurrentUser(updatedProfile);
        
        if (newUsername !== username) {
            navigate(`/profile/${newUsername}`, { replace: true });
        }
    }
    setShowEditModal(false);
  }, [profileUser, isOwnProfile, setCurrentUser, username, navigate]);

  const handleDeleteProfile = async () => {
    if (!profileUser) return;
    try {
        await db.users.deleteProfile(profileUser.id);
        await db.auth.signOut();
        await setCurrentUser(null);
        navigate('/');
    } catch (error) {
        console.error("Failed to delete profile", error);
    }
  };

  const handleArtworkClick = (artwork: Artwork | CollectionArtwork) => {
    if ('artistId' in artwork) {
        navigate(`/artwork/${artwork.id}`);
    } else {
        navigate(`/collect/${profileUser?.id}/${artwork.id}`);
    }
  };

  if (loading && !profileUser) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-10 h-10 text-purple-600 animate-spin" /></div>;
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
        <h2 className="rg-h2" style={{color:"#1a1729",marginBottom:8}}>User not found</h2>
        <Link to="/"><Button variant="outline" className="rounded-full">Go Home</Button></Link>
      </div>
    );
  }

  const collectionArtworks = profileUser?.collections?.flatMap(c => c.artworks) || [];

  // All users can have both original artworks AND a collection
  // Show artworks (their own work) and collection items separately
  const profileGridItems: (Artwork | CollectionArtwork)[] = artworks;
  const hasOwnArtworks = artworks.length > 0;
  const hasCollection = collectionArtworks.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 animate-fade-in">
      {/* Cover Image */}
      <div className="h-48 md:h-72 w-full bg-gray-300 relative overflow-hidden">
        {profileUser?.coverImage ? (
          <img src={profileUser.coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600"></div>
        )}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 sm:-mt-24 mb-10 flex flex-col items-start">
          <div className="flex flex-col md:flex-row md:items-end justify-between w-full gap-6">
            <div className="relative group">
               <img 
                 src={profileUser?.avatar || DEFAULT_AVATAR_URL} 
                 alt={profileUser?.name} 
                 className="w-32 h-32 sm:w-44 sm:h-44 rounded-3xl border-4 border-white shadow-xl bg-white object-cover"
               />
               {profileUser?.role === 'artist' && (
                  <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white p-2 rounded-xl shadow-lg border-2 border-white">
                      <ImageIcon className="w-5 h-5" />
                  </div>
               )}
            </div>

            <div className="flex-1 pb-2">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                      <h1 className="rg-profile-name">{profileUser?.name}</h1>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{fontSize:"1rem",fontWeight:600,color:"#6b7280",letterSpacing:"-0.01em"}}>@{profileUser?.username}</span>
                        {isVerifiedArtist && (
                          <VerifiedArtistBadge size="md" showLabel={true} />
                        )}
                        {/* Apply for verification — own profile, artist, not yet verified */}
                        {isOwnProfile && !isVerifiedArtist && profileUser?.role === 'artist' && (
                          <button
                            onClick={() => setShowVerificationModal(true)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: '0.72rem', fontWeight: 700,
                              color: verificationRequest?.status === 'pending' ? '#9ca3af' : '#7c3aed',
                              background: verificationRequest?.status === 'pending' ? '#f3f4f6' : '#f5f0ff',
                              border: `1px solid ${verificationRequest?.status === 'pending' ? '#e5e7eb' : '#ede9fe'}`,
                              borderRadius: 99, padding: '3px 10px', cursor: 'pointer',
                            }}
                          >
                            <Shield size={11} />
                            {verificationRequest?.status === 'pending' ? 'Verification pending' : 
                             verificationRequest?.status === 'rejected' ? 'Reapply for verification' :
                             'Apply for verification'}
                          </button>
                        )}
                      </div>
                  </div>
                  <div className="flex gap-3">
                    {isOwnProfile ? (
                      <Button variant="outline" className="rounded-xl font-bold shadow-sm" onClick={() => setShowEditModal(true)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit Profile
                      </Button>
                    ) : (
                      <>
                        {hasIncomingRequest ? (
                          <>
                            <Button className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold" onClick={handleAcceptRequest}>
                              <Check className="w-4 h-4 mr-2" /> Accept
                            </Button>
                            <Button variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold" onClick={handleDeclineRequest}>
                              <X className="w-4 h-4 mr-2" /> Decline
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant={isFollowing ? "outline" : isRequested ? "outline" : "default"} 
                            className="rounded-xl min-w-[140px] font-bold shadow-sm"
                            onClick={handleFollowToggle}
                          >
                            {isFollowing ? <><UserCheck className="w-4 h-4 mr-2" /> Connected</> : isRequested ? <><Clock className="w-4 h-4 mr-2" /> Requested</> : <><UserPlus className="w-4 h-4 mr-2" /> Connect</>}
                          </Button>
                        )}
                        <Link to={`/messages?new=${profileUser.id}`}>
                          <Button variant="outline" className="rounded-xl font-bold shadow-sm">Message</Button>
                        </Link>
                      </>
                    )}
                  </div>
               </div>
            </div>
          </div>

          <div className="mt-8 w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col gap-6 lg:gap-10">
              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="rg-section-eyebrow" style={{marginBottom:12}}>About</h2>
                  <p className="rg-body-lg" style={{color:"#374151"}}>
                    {profileUser?.bio || "No bio shared yet."}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-bold">
                    {profileUser?.location && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="w-4 h-4 text-purple-500" />
                        <span>{profileUser.location}</span>
                      </div>
                    )}
                    {profileUser?.website && (
                      <a href={`https://${profileUser.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors group">
                        <Globe className="w-4 h-4" />
                        <span>{profileUser.website}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span>Joined {profileUser?.joinDate}</span>
                    </div>
                </div>

                {profileUser?.role === 'artist' && profileUser.commissionStatus && profileUser.commissionStatus !== 'Not Available' && (
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${profileUser.commissionStatus === 'Open' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      <div className={`w-2 h-2 rounded-full ${profileUser.commissionStatus === 'Open' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      {profileUser.commissionStatus === 'Open' ? 'Open for Commissions' : 'Commissions Closed'}
                  </div>
                )}
              </div>

              <div className="flex items-center lg:items-start lg:justify-end lg:pt-4 w-full lg:w-auto">
                <div className="flex w-full bg-gray-50/50 p-3 sm:p-5 rounded-2xl border border-gray-100 shadow-inner">
                  <Stat value={artworks.length} label="Artworks" />
                  <Stat value={collectionArtworks.length} label="Collected" />
                  <Stat value={profileUser?.stats.followers || 0} label="Connections" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {actionError && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm font-medium">{actionError}</p>
            </div>
            <button onClick={() => setActionError(null)} className="p-1 hover:bg-red-100 rounded-full"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="animate-fade-in mb-12">

            {/* ── Tab toggle ── */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex w-full bg-gray-100 rounded-2xl p-1 gap-1 overflow-x-auto scrollbar-hide">
                {/* Art lovers see Collection first (left), artists see Artworks first (left) */}
                {profileUser?.role === 'artLover' ? (
                  <>
                    <button
                      onClick={() => setActiveTab('collection')}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'collection' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Bookmark className="w-4 h-4" />
                      Collection
                      {collectionArtworks.length > 0 && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeTab === 'collection' ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-400'}`}>
                          {collectionArtworks.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('artworks')}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'artworks' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Grid className="w-4 h-4" />
                      Artworks
                      {artworks.length > 0 && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeTab === 'artworks' ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-400'}`}>
                          {artworks.length}
                        </span>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveTab('artworks')}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'artworks' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Grid className="w-4 h-4" />
                      Artworks
                      {artworks.length > 0 && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeTab === 'artworks' ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-400'}`}>
                          {artworks.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('collection')}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'collection' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Bookmark className="w-4 h-4" />
                      Collection
                      {collectionArtworks.length > 0 && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeTab === 'collection' ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-400'}`}>
                          {collectionArtworks.length}
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>


            </div>

            {/* ── Artworks panel ── */}
            {activeTab === 'artworks' && (
              hasOwnArtworks ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {artworks.map((artwork) => (
                        <div key={artwork.id} className="group relative bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all cursor-pointer overflow-hidden aspect-[3/4] border border-gray-100" onClick={() => handleArtworkClick(artwork)}>
                            <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                <h3 style={{color:"#fff",fontSize:"1.15rem",fontWeight:900,letterSpacing:"-0.02em",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{artwork.title}</h3>
                                <div className="flex items-center justify-between text-white/70 text-xs font-black uppercase tracking-widest mt-2">
                                    <span>{artwork.likes} Appreciations</span>
                                </div>
                            </div>
                            {isOwnProfile && (
                              <button type="button"
                                onClick={(e) => { e.stopPropagation(); setManageItem(artwork); setManageError(null); }}
                                className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg border border-white/60 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            )}
                        </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                    <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Empty Vision</h3>
                    <p className="text-gray-500 mt-2">This space is ready for some creative energy.</p>
                    {isOwnProfile && (
                      <Link to="/upload" className="inline-block mt-4">
                        <Button className="rounded-xl font-bold">Upload Artwork</Button>
                      </Link>
                    )}
                </div>
              )
            )}

            {/* ── Collection panel ── */}
            {activeTab === 'collection' && (
              hasCollection ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {collectionArtworks.map((artwork) => (
                        <div key={artwork.id} className="group relative bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all cursor-pointer overflow-hidden aspect-[3/4] border border-gray-100" onClick={() => handleArtworkClick(artwork)}>
                            <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                <h3 style={{color:"#fff",fontSize:"1.15rem",fontWeight:900,letterSpacing:"-0.02em",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{artwork.title}</h3>
                                {'artistName' in artwork && artwork.artistName && (
                                    <p className="text-white/70 text-sm font-bold mt-1 truncate">by {artwork.artistName}</p>
                                )}
                            </div>
                            {isOwnProfile && (
                              <button type="button"
                                onClick={(e) => { e.stopPropagation(); setManageItem(artwork); setManageError(null); }}
                                className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg border border-white/60 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            )}
                        </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                    <Bookmark className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">No collection yet</h3>
                    <p className="text-gray-500 mt-2 mb-4">Start collecting artwork from artists you love.</p>
                    {isOwnProfile && (
                      <div className="flex gap-3 justify-center flex-wrap">
                        <Link to="/claim">
                          <Button variant="outline" className="rounded-xl font-bold text-teal-600 border-teal-200 hover:bg-teal-50">
                            Have a certificate? Claim artwork
                          </Button>
                        </Link>
                        <Link to="/upload">
                          <Button variant="outline" className="rounded-xl font-bold">
                            Add to Collection
                          </Button>
                        </Link>
                      </div>
                    )}
                </div>
              )
            )}
        </div>
      </div>

      {manageItem && (
        <div
          className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { if (!manageLoading) setManageItem(null); }}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black tracking-tight text-gray-900">Manage Visibility</h3>
                <p className="text-sm text-gray-500 mt-1">Choose where this artwork should appear.</p>
              </div>
              <button
                className="p-2 rounded-full hover:bg-gray-50"
                onClick={() => { if (!manageLoading) setManageItem(null); }}
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {manageError && (
              <div className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold">
                {manageError}
              </div>
            )}

            <div className="mt-5 space-y-3">
              <button
                disabled={manageLoading}
                onClick={async () => {
                  if (!currentUser) return;
                  setManageLoading(true);
                  setManageError(null);
                  try {
                    if ('artistId' in manageItem) {
                      await db.artworks.removeFromProfile(manageItem.id, currentUser.id);
                    } else {
                      await db.collections.delete(currentUser.id, manageItem.id);
                    }
                    setManageItem(null);
                    await loadProfile();
                  } catch (e: any) {
                    setManageError(e.message || 'Failed to remove from profile.');
                  } finally {
                    setManageLoading(false);
                  }
                }}
                className="w-full flex items-center justify-between rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-3 text-sm font-black"
              >
                <span className="flex items-center gap-2"><Trash2 className="w-4 h-4" /> Remove from Profile only</span>
              </button>

              {'artistId' in manageItem && (manageItem as Artwork).listedForSale ? (
                <button
                  disabled={manageLoading}
                  onClick={async () => {
                    if (!currentUser) return;
                    setManageLoading(true);
                    setManageError(null);
                    try {
                      await db.artworks.unlist(manageItem.id, currentUser.id);
                      setManageItem(null);
                      await loadProfile();
                    } catch (e: any) {
                      setManageError(e.message || 'Failed to remove from marketplace.');
                    } finally {
                      setManageLoading(false);
                    }
                  }}
                  className="w-full flex items-center justify-between rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-3 text-sm font-black"
                >
                  <span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Remove from Marketplace only</span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-black text-gray-400 cursor-not-allowed"
                >
                  <span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Remove from Marketplace only</span>
                </button>
              )}

              <button
                disabled={manageLoading}
                onClick={async () => {
                  if (!currentUser) return;
                  const ok = window.confirm('Delete everywhere? This removes it from both your profile and marketplace, and deletes the image.');
                  if (!ok) return;
                  setManageLoading(true);
                  setManageError(null);
                  try {
                    if ('artistId' in manageItem) {
                      await db.artworks.deleteEverywhere(manageItem.id, currentUser.id);
                    } else {
                      await db.collections.delete(currentUser.id, manageItem.id);
                    }
                    setManageItem(null);
                    await loadProfile();
                  } catch (e: any) {
                    setManageError(e.message || 'Failed to delete everywhere.');
                  } finally {
                    setManageLoading(false);
                  }
                }}
                className="w-full flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-3 text-sm font-black text-red-700"
              >
                <span className="flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete everywhere</span>
              </button>
            </div>

            {manageLoading && (
              <div className="mt-4 text-xs font-black uppercase tracking-widest text-gray-400">Working…</div>
            )}
          </div>
        </div>
      )}

      {showEditModal && (
        <EditProfileModal
          user={profileUser}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSave}
          onDelete={handleDeleteProfile}
        />
      )}

      {showVerificationModal && currentUser && (
        <VerificationModal
          userId={currentUser.id}
          existingRequest={verificationRequest}
          onClose={() => setShowVerificationModal(false)}
          onSubmitted={(req) => {
            setVerificationRequest(req);
            setShowVerificationModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Profile;
