
import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { createUrl } from "../utils";
import { Button } from "../components/ui/Button";
import { Settings, Share2, MapPin, Link as LinkIcon, Calendar, Heart, Upload, Instagram, Twitter, Mail, Plus } from "lucide-react";
import ArtworkDetailModal from "../components/ArtworkDetailModal";
import AddToCollectionModal from "../components/AddToCollectionModal";
import { useUser } from "../context/UserContext";
import { findUserById, findArtworksByArtistId, User, Artwork, artworks as allArtworks, CollectionArtwork, findCollectionArtworksByUserId, deleteUserArtwork, deleteCollectionArtwork, addCollectionArtwork } from "../data/mock";
import ConfirmationModal from "../components/ConfirmationModal";

const BehanceIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M7.938 10.148h3.324c0-1.854-1.48-1.854-3.324-1.854zm12.562 1.332c0-1.782-1.337-3.159-3.417-3.159H9.412V2.83h7.94c1.854 0 2.923 1.164 2.923 2.538h-2.923c0-.865-.63-1.02-1.289-1.02H11.5v3.13h5.717c1.94 0 3.295 1.164 3.295 3.015 0 1.996-1.508 3.102-3.417 3.102h-5.6v5.253h5.542c2.163 0 3.53-.992 3.53-2.997H17.27c0 .942-.717 1.39-1.684 1.39h-3.13V15.7h5.366c2.05 0 3.446-1.193 3.446-3.22zM8.562 18.168h-5.04V6.832h5.04c2.51 0 4.218 1.536 4.218 3.668 0 2.22-1.737 3.668-4.218 3.668zM3 21.168h6.19c3.96 0 6.72-2.135 6.72-6.192C15.91 10.95 13.12 9 9.19 9H3v12.168z" />
  </svg>
);

type SelectedArtwork = (Artwork | CollectionArtwork) & { artist?: Partial<User> & { name: string } };

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useUser();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userArtworks, setUserArtworks] = useState<(Artwork | CollectionArtwork)[]>([]);
  const [activeTab, setActiveTab] = useState('artworks');
  const [selectedArtwork, setSelectedArtwork] = useState<SelectedArtwork | null>(null);
  const [likedArtworks, setLikedArtworks] = useState<Set<string>>(new Set());
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const user = findUserById(userId);
    setProfileUser(user);
    if (user?.role === 'artist') {
      setUserArtworks(findArtworksByArtistId(user.id));
      setActiveTab('artworks');
    } else if (user?.role === 'artLover') {
      setUserArtworks(findCollectionArtworksByUserId(user.id));
      setActiveTab('collections');
    }
  }, [userId]);

  useEffect(() => {
    const storedLikes = localStorage.getItem('likedArtworks');
    if (storedLikes) {
      setLikedArtworks(new Set(JSON.parse(storedLikes)));
    }
  }, []);

  const toggleLike = (artworkId: string) => {
    const newLikedArtworks = new Set(likedArtworks);
    if (newLikedArtworks.has(artworkId)) {
      newLikedArtworks.delete(artworkId);
    } else {
      newLikedArtworks.add(artworkId);
    }
    setLikedArtworks(newLikedArtworks);
    localStorage.setItem('likedArtworks', JSON.stringify(Array.from(newLikedArtworks)));
  };

  const handleCloseModal = () => setSelectedArtwork(null);

  const handleDeleteArtwork = () => {
    if (!selectedArtwork || !profileUser) return;

    if (profileUser.role === 'artist') {
        deleteUserArtwork(profileUser.id, selectedArtwork.id);
    } else if (profileUser.role === 'artLover') {
        deleteCollectionArtwork(profileUser.id, selectedArtwork.id);
    }

    setUserArtworks(currentArtworks => currentArtworks.filter(art => art.id !== selectedArtwork.id));
    setShowDeleteConfirm(false);
    handleCloseModal();
  };
  
  const handleAddArtwork = (newArtwork: CollectionArtwork) => {
    if(currentUser) {
      addCollectionArtwork(currentUser.id, newArtwork);
      setUserArtworks(prev => [newArtwork, ...prev]);
      setShowAddToCollection(false);
    }
  };

  if (!profileUser) {
    return <div>User not found or loading...</div>;
  }

  const isOwnProfile = currentUser?.id === profileUser.id;
  const isArtist = profileUser.role === 'artist';

  const getProfileUserLikedArtworks = () => {
    if (profileUser.likedArtworkIds) {
        return allArtworks.filter(art => profileUser.likedArtworkIds!.includes(art.id));
    }
    return [];
  }
  
  let gridContent: (Artwork | CollectionArtwork)[] = [];
  if (isArtist && activeTab === 'artworks') {
    gridContent = userArtworks;
  } else if (!isArtist && activeTab === 'collections') {
    gridContent = userArtworks;
  } else if (activeTab === 'liked') {
    gridContent = getProfileUserLikedArtworks();
  }

  const handleArtworkClick = (artwork: Artwork | CollectionArtwork) => {
    let artistData: (Partial<User> & { name: string }) | undefined;
    if ('artistId' in artwork) {
        artistData = findUserById(artwork.artistId);
        if (!artistData) {
            console.warn(`Artist with ID ${artwork.artistId} not found.`);
        }
    } else {
        artistData = { name: artwork.artistName };
    }
    setSelectedArtwork({ ...artwork, artist: artistData });
  };
  
  const canDelete = isOwnProfile && selectedArtwork;
  
  const likedArtForMosaic = getProfileUserLikedArtworks().slice(0, 4);

  const artistTabs = ['Artworks', 'Liked'];
  const artLoverTabs = ['Collections', 'Liked'];
  const tabs = isArtist ? artistTabs : artLoverTabs;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="relative">
        <div className="h-64 md:h-80 bg-gray-200">
          {profileUser.coverImage ? (
            <img src={profileUser.coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : !isArtist ? (
            <div className="w-full h-full grid grid-cols-2 md:grid-cols-4 gap-0.5">
                {likedArtForMosaic.map(art => (
                    <div key={art.id} className="overflow-hidden h-full">
                        <img src={art.image} alt={art.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                ))}
                {Array(4 - likedArtForMosaic.length).fill(0).map((_, i) => <div key={i} className="bg-gradient-to-br from-purple-50 to-blue-50"></div>)}
            </div>
          ) : <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100"></div>}
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-20 mb-8">
              <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="relative -mt-24 flex-shrink-0">
                    <img src={profileUser.avatar} alt={profileUser.name} className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg" />
                  </div>

                  <div className="flex-1 w-full">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">{profileUser.name}</h1>
                        <p className="text-gray-600">@{profileUser.username}</p>
                         {!isArtist && <p className="text-sm font-semibold text-purple-600 mt-1">Art Enthusiast</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        {isOwnProfile ? (
                          <Link to="/edit-profile">
                            <Button variant="outline" className="rounded-full"><Settings className="w-4 h-4 mr-2" /> Edit Profile</Button>
                          </Link>
                        ) : (
                          <Button className="rounded-full">Follow</Button>
                        )}
                        <Button variant="outline" className="rounded-full"><Share2 className="w-4 h-4 mr-2" /> Share</Button>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4 max-w-2xl">{profileUser.bio}</p>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                      {profileUser.location && <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /><span>{profileUser.location}</span></div>}
                      {isArtist && profileUser.website && <div className="flex items-center gap-1"><LinkIcon className="w-4 h-4" /><a href={`http://${profileUser.website}`} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{profileUser.website}</a></div>}
                      <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>Joined {profileUser.joinDate}</span></div>
                    </div>
                     {isArtist && profileUser.socials && (
                        <div className="flex items-center gap-4 mt-4">
                            {profileUser.socials.instagram && <a href="#" className="text-gray-500 hover:text-gray-800"><Instagram className="w-5 h-5" /></a>}
                            {profileUser.socials.twitter && <a href="#" className="text-gray-500 hover:text-gray-800"><Twitter className="w-5 h-5" /></a>}
                            {profileUser.socials.behance && <a href="#" className="text-gray-500 hover:text-gray-800"><BehanceIcon className="w-5 h-5" /></a>}
                            {profileUser.contactEmail && <a href={`mailto:${profileUser.contactEmail}`} className="text-gray-500 hover:text-gray-800"><Mail className="w-5 h-5" /></a>}
                        </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 flex-wrap gap-4">
                    <div className="flex items-center gap-8">
                        {isArtist && <div><p className="text-2xl font-bold text-gray-900">{userArtworks.length}</p><p className="text-sm text-gray-600">Artworks</p></div>}
                        {!isArtist && <div><p className="text-2xl font-bold text-gray-900">{userArtworks.length}</p><p className="text-sm text-gray-600">Collections</p></div>}
                        <div><p className="text-2xl font-bold text-gray-900">{getProfileUserLikedArtworks().length}</p><p className="text-sm text-gray-600">Liked</p></div>
                        <div><p className="text-2xl font-bold text-gray-900">{profileUser.stats.followers?.toLocaleString() || 0}</p><p className="text-sm text-gray-600">Followers</p></div>
                        <div><p className="text-2xl font-bold text-gray-900">{profileUser.stats.following}</p><p className="text-sm text-gray-600">Following</p></div>
                    </div>
                    {isArtist && profileUser.commissionStatus && profileUser.commissionStatus !== 'Not Available' && (
                        <div className={`text-sm font-semibold px-4 py-2 rounded-full ${profileUser.commissionStatus === 'Open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {profileUser.commissionStatus} for Commissions
                        </div>
                    )}
                </div>
              </div>
            </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-6 border-b border-gray-200">
            <div className="flex items-center gap-8">
                {tabs.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.toLowerCase() ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                    {tab}
                  </button>
                ))}
            </div>
             {isOwnProfile && isArtist && (
                <Link to="/upload">
                    <Button><Upload className="w-4 h-4 mr-2" /> Upload Artwork</Button>
                </Link>
            )}
             {isOwnProfile && !isArtist && activeTab === 'collections' && (
                <Button onClick={() => setShowAddToCollection(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Artwork
                </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {gridContent.map((artwork) => {
            const isLiked = likedArtworks.has(artwork.id);
            const baseLikes = ('likes' in artwork && artwork.likes) || 0;
            const currentLikes = baseLikes + (isLiked ? 1 : 0);
            
            return (
              <div key={artwork.id} onClick={() => handleArtworkClick(artwork)} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer">
                <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-semibold mb-1 line-clamp-1">{artwork.title}</h3>
                    <div className="flex items-center gap-1 text-sm">
                      <Heart className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
                      <span>{currentLikes}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {gridContent.length === 0 && (
            <div className="text-center py-16 text-gray-500">
                <h3 className="text-xl font-semibold">Nothing to see here yet.</h3>
                <p>This collection is currently empty.</p>
            </div>
        )}
      </div>

      {selectedArtwork && (
        <ArtworkDetailModal 
          artwork={selectedArtwork}
          artist={selectedArtwork.artist}
          onClose={handleCloseModal}
          isLiked={likedArtworks.has(selectedArtwork.id)}
          onToggleLike={() => toggleLike(selectedArtwork.id)}
          onDelete={canDelete ? () => setShowDeleteConfirm(true) : undefined}
        />
      )}
      {showAddToCollection && (
        <AddToCollectionModal 
            onClose={() => setShowAddToCollection(false)}
            onAddArtwork={handleAddArtwork}
        />
      )}
      {showDeleteConfirm && selectedArtwork && (
        <ConfirmationModal 
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteArtwork}
          title="Delete Artwork"
          description="Are you sure you want to delete this artwork? This action is irreversible and the artwork will be permanently removed."
          confirmText="Delete Forever"
        />
      )}
    </div>
  );
}
