import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { createUrl } from "../utils";
import { Button } from "../components/ui/Button";
import { Settings, Share2, MapPin, Link as LinkIcon, Calendar, Heart, Upload, Instagram, Twitter, Mail, Plus, UserCheck, UserPlus } from "lucide-react";
import ArtworkDetailModal from "../components/ArtworkDetailModal";
import AddToCollectionModal from "../components/AddToCollectionModal";
import { useUser } from "../context/UserContext";
import { findUserById, findArtworksByArtistId, User, Artwork, artworks as allArtworks, CollectionArtwork, findCollectionArtworksByUserId, deleteUserArtwork, deleteCollectionArtwork, addCollectionArtwork, toggleFollowUser, toggleArtworkLike } from "../data/mock";
import ConfirmationModal from "../components/ConfirmationModal";
import ShareModal from "../components/ShareModal";

const BehanceIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M7.938 10.148h3.324c0-1.854-1.48-1.854-3.324-1.854zm12.562 1.332c0-1.782-1.337-3.159-3.417-3.159H9.412V2.83h7.94c1.854 0 2.923 1.164 2.923 2.538h-2.923c0-.865-.63-1.02-1.289-1.02H11.5v3.13h5.717c1.94 0 3.295 1.164 3.295 3.015 0 1.996-1.508 3.102-3.417 3.102h-5.6v5.253h5.542c2.163 0 3.53-.992 3.53-2.997H17.27c0 .942-.717 1.39-1.684 1.39h-3.13V15.7h5.366c2.05 0 3.446-1.193 3.446-3.22zM8.562 18.168h-5.04V6.832h5.04c2.51 0 4.218 1.536 4.218 3.668 0 2.22-1.737 3.668-4.218 3.668zM3 21.168h6.19c3.96 0 6.72-2.135 6.72-6.192C15.91 10.95 13.12 9 9.19 9H3v12.168z" /></svg>
);

type SelectedArtwork = (Artwork | CollectionArtwork) & { artist?: Partial<User> & { name: string } };

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser, setCurrentUser } = useUser();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userArtworks, setUserArtworks] = useState<(Artwork | CollectionArtwork)[]>([]);
  const [activeTab, setActiveTab] = useState('artworks');
  const [selectedArtwork, setSelectedArtwork] = useState<SelectedArtwork | null>(null);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
        const user = await findUserById(userId);
        setProfileUser(user || null);
        if (user) {
            if (user.role === 'artist') {
                const arts = await findArtworksByArtistId(user.id);
                setUserArtworks(arts);
                setActiveTab('artworks');
            } else {
                const cols = await findCollectionArtworksByUserId(user.id);
                setUserArtworks(cols);
                setActiveTab('collections');
            }
        }
    }
    loadProfile();
  }, [userId, currentUser]);

  const toggleLike = async (artworkId: string) => {
    if (!currentUser) return;
    const updatedUser = await toggleArtworkLike(currentUser.id, artworkId);
    setCurrentUser(updatedUser);
  };

  const handleFollowToggle = async () => {
    if (currentUser && profileUser) {
        const updatedCurrentUser = await toggleFollowUser(currentUser.id, profileUser.id);
        setCurrentUser(updatedCurrentUser);
        const updatedProfileUser = await findUserById(profileUser.id);
        setProfileUser(updatedProfileUser || null);
    }
  };

  const handleAddToCollection = async (newArtwork: CollectionArtwork) => {
    if (currentUser) {
        await addCollectionArtwork(currentUser.id, newArtwork);
        setShowAddToCollection(false);
        if (profileUser?.id === currentUser.id && activeTab === 'collections') {
             const cols = await findCollectionArtworksByUserId(currentUser.id);
             setUserArtworks(cols);
        }
    }
  };

  const handleDeleteArtwork = async () => {
    if (selectedArtwork && profileUser) {
        if (activeTab === 'collections') {
            await deleteCollectionArtwork(profileUser.id, selectedArtwork.id);
            const cols = await findCollectionArtworksByUserId(profileUser.id);
            setUserArtworks(cols);
        } else {
            await deleteUserArtwork(profileUser.id, selectedArtwork.id);
             const arts = await findArtworksByArtistId(profileUser.id);
             setUserArtworks(arts);
        }
        setShowDeleteConfirm(false);
        setSelectedArtwork(null);
    }
  };

  if (!profileUser) return <div>Loading profile...</div>;

  const isOwnProfile = currentUser?.id === profileUser.id;
  const isArtist = profileUser.role === 'artist';
  const isFollowing = currentUser?.followingIds?.includes(profileUser.id);

  const likedArtworks = allArtworks.filter(art => profileUser.likedArtworkIds?.includes(art.id));

  let gridContent: (Artwork | CollectionArtwork)[] = [];
  if (isArtist && activeTab === 'artworks') gridContent = userArtworks;
  else if (!isArtist && activeTab === 'collections') gridContent = userArtworks;
  else if (activeTab === 'liked') gridContent = likedArtworks;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Cover Image */}
      <div className="h-64 md:h-80 bg-gray-200">
          {profileUser.coverImage ? (
            <img src={profileUser.coverImage} alt="Cover" className="w-full h-full object-cover object-center" />
          ) : <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100"></div>}
      </div>
      
      {/* Profile Info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-20 mb-8">
              <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="relative -mt-24 flex-shrink-0">
                    <img src={profileUser.avatar} alt={profileUser.name} className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg object-cover bg-gray-100 object-center" />
                  </div>
                  <div className="flex-1 w-full">
                     <div className="flex justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{profileUser.name}</h1>
                            <p className="text-gray-600">@{profileUser.username}</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" size="icon" className="rounded-full border border-gray-200" onClick={() => setShowShareModal(true)}>
                              <Share2 className="w-5 h-5 text-gray-600" />
                            </Button>
                            {isOwnProfile ? (
                                <Link to="/edit-profile"><Button variant="outline" className="rounded-full">Edit Profile</Button></Link>
                            ) : (
                                <Button onClick={handleFollowToggle} className="rounded-full">
                                    {isFollowing ? "Connected" : "Connect"}
                                </Button>
                            )}
                        </div>
                     </div>
                     <p className="mt-4 text-gray-700">{profileUser.bio}</p>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
                    <div><span className="font-bold block text-xl">{userArtworks.length}</span><span className="text-gray-500 text-sm">Works</span></div>
                    <div><span className="font-bold block text-xl">{likedArtworks.length}</span><span className="text-gray-500 text-sm">Liked</span></div>
                    <div><span className="font-bold block text-xl">{profileUser.stats.followers}</span><span className="text-gray-500 text-sm">Connections</span></div>
                </div>
                
                {/* Commission Status - Centered */}
                {isArtist && (
                    <div className="flex justify-center mt-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            profileUser.commissionStatus === 'Open' ? 'bg-green-100 text-green-800' :
                            profileUser.commissionStatus === 'Closed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            Commissions: {profileUser.commissionStatus || 'Not Available'}
                        </span>
                    </div>
                )}
              </div>
            </div>

            {/* Tabs & Grid */}
             <div className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
                <div className="flex px-6 border-b border-gray-200 gap-8">
                    <button onClick={() => setActiveTab(isArtist ? 'artworks' : 'collections')} className={`py-4 border-b-2 ${activeTab !== 'liked' ? 'border-purple-600 text-purple-600' : 'border-transparent'}`}>{isArtist ? 'Artworks' : 'Collections'}</button>
                    <button onClick={() => setActiveTab('liked')} className={`py-4 border-b-2 ${activeTab === 'liked' ? 'border-purple-600 text-purple-600' : 'border-transparent'}`}>Liked</button>
                </div>
             </div>
             
             {!isArtist && activeTab === 'collections' && isOwnProfile && (
                 <div className="mb-6 text-center">
                     <Button onClick={() => setShowAddToCollection(true)} className="rounded-full"><Plus className="w-4 h-4 mr-2"/> Add to Collection</Button>
                 </div>
             )}

             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {gridContent.map(artwork => (
                    <div key={artwork.id} onClick={async () => {
                        const artist = await findUserById('artistId' in artwork ? artwork.artistId : undefined);
                        setSelectedArtwork({ ...artwork, artist: artist ? { ...artist, name: artist.name } : { name: artwork.title } });
                    }} className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden cursor-pointer">
                        <img src={artwork.image} className="w-full h-full object-cover hover:scale-110 transition-transform" />
                    </div>
                ))}
             </div>
      </div>

      {selectedArtwork && (
        <ArtworkDetailModal 
          artwork={selectedArtwork}
          artist={selectedArtwork.artist}
          onClose={() => setSelectedArtwork(null)}
          isLiked={currentUser?.likedArtworkIds?.includes(selectedArtwork.id) || false}
          onToggleLike={() => toggleLike(selectedArtwork.id)}
          onDelete={isOwnProfile ? handleDeleteArtwork : undefined}
        />
      )}

      {showShareModal && profileUser && (
        <ShareModal 
          onClose={() => setShowShareModal(false)}
          url={window.location.href}
          title={`${profileUser.name} on Regestra`}
        />
      )}

      {showAddToCollection && (
          <AddToCollectionModal 
            onClose={() => setShowAddToCollection(false)}
            onAddArtwork={handleAddToCollection}
          />
      )}
    </div>
  );
}