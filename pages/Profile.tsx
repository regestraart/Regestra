
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "../components/ui/Button";
import { Settings, Share2, MapPin, Link as LinkIcon, Calendar, Heart } from "lucide-react";

export default function Profile() {
  const [activeTab, setActiveTab] = useState('artworks');

  const profile = {
    name: "Sarah Chen",
    username: "@sarahchen",
    avatar: "https://i.pravatar.cc/300?img=1",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=300&fit=crop",
    bio: "Digital artist & illustrator | Creating colorful worlds | Available for commissions 🎨",
    location: "San Francisco, CA",
    website: "sarahchen.art",
    joinDate: "January 2023",
    stats: { artworks: 42, followers: 1234, following: 567 }
  };

  const artworks = [
    { id: 1, image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=800&fit=crop", title: "Abstract Waves", likes: 234 },
    { id: 2, image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=800&fit=crop", title: "Urban Dreams", likes: 189 },
    { id: 3, image: "https://images.unsplash.com/photo-1583339793403-3d9b001b6008?w=600&h=800&fit=crop", title: "Color Explosion", likes: 456 },
    { id: 4, image: "https://images.unsplash.com/photo-1582561424760-0b1a93b89431?w=600&h=800&fit=crop", title: "Neon Nights", likes: 321 },
    { id: 5, image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600&h=800&fit=crop", title: "Geometric Flow", likes: 298 },
    { id: 6, image: "https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=600&h=800&fit=crop", title: "Digital Harmony", likes: 412 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-purple-600 to-blue-500 overflow-hidden">
        <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover opacity-50" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 mb-8">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              <div className="relative -mt-24">
                <img src={profile.avatar} alt={profile.name} className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg" />
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{profile.name}</h1>
                    <p className="text-gray-600">{profile.username}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-full">
                      <Share2 className="w-4 h-4 mr-2" /> Share
                    </Button>
                    <Link to={createPageUrl('EditProfile')}>
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-full">
                        <Settings className="w-4 h-4 mr-2" /> Edit Profile
                      </Button>
                    </Link>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 max-w-2xl">{profile.bio}</p>
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                  {profile.location && <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /><span>{profile.location}</span></div>}
                  {profile.website && <div className="flex items-center gap-1"><LinkIcon className="w-4 h-4" /><a href="#" className="text-purple-600 hover:underline">{profile.website}</a></div>}
                  <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>Joined {profile.joinDate}</span></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 mt-6 pt-6 border-t border-gray-200">
              <div><p className="text-2xl font-bold text-gray-900">{profile.stats.artworks}</p><p className="text-sm text-gray-600">Artworks</p></div>
              <div><p className="text-2xl font-bold text-gray-900">{profile.stats.followers.toLocaleString()}</p><p className="text-sm text-gray-600">Followers</p></div>
              <div><p className="text-2xl font-bold text-gray-900">{profile.stats.following}</p><p className="text-sm text-gray-600">Following</p></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
          <div className="flex items-center gap-8 px-6 border-b border-gray-200">
            {['Artworks', 'Liked', 'Collections'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.toLowerCase() ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {artworks.map((artwork) => (
            <div key={artwork.id} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="font-semibold mb-2">{artwork.title}</h3>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">{artwork.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
