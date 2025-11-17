
import React, { useState } from "react";
import { Heart, Bookmark, Share2 } from "lucide-react";
import { Button } from "../components/ui/Button";

export default function Home() {
  const [filter, setFilter] = useState("all");

  const artworks = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=800&fit=crop",
      title: "Abstract Waves",
      artist: "Sarah Chen",
      avatar: "https://i.pravatar.cc/150?img=1",
      likes: 234
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=800&fit=crop",
      title: "Urban Dreams",
      artist: "Marcus Williams",
      avatar: "https://i.pravatar.cc/150?img=2",
      likes: 189
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1583339793403-3d9b001b6008?w=600&h=800&fit=crop",
      title: "Color Explosion",
      artist: "Emma Rodriguez",
      avatar: "https://i.pravatar.cc/150?img=3",
      likes: 456
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1582561424760-0b1a93b89431?w=600&h=800&fit=crop",
      title: "Neon Nights",
      artist: "James Kim",
      avatar: "https://i.pravatar.cc/150?img=4",
      likes: 321
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600&h=800&fit=crop",
      title: "Geometric Flow",
      artist: "Lisa Thompson",
      avatar: "https://i.pravatar.cc/150?img=5",
      likes: 298
    },
    {
      id: 6,
      image: "https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=600&h=800&fit=crop",
      title: "Digital Harmony",
      artist: "Alex Martinez",
      avatar: "https://i.pravatar.cc/150?img=6",
      likes: 412
    },
    {
      id: 7,
      image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&h=800&fit=crop",
      title: "Sunset Boulevard",
      artist: "Nina Patel",
      avatar: "https://i.pravatar.cc/150?img=7",
      likes: 367
    },
    {
      id: 8,
      image: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=600&h=800&fit=crop",
      title: "Abstract Mind",
      artist: "David Lee",
      avatar: "https://i.pravatar.cc/150?img=8",
      likes: 543
    },
    {
      id: 9,
      image: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=600&h=800&fit=crop",
      title: "Purple Dreams",
      artist: "Sophie Anderson",
      avatar: "https://i.pravatar.cc/150?img=9",
      likes: 276
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Buyers & Browse Art</h1>
          <p className="text-xl text-purple-100 max-w-2xl">
            Discover amazing artwork from talented creators around the world
          </p>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 py-4 overflow-x-auto">
            {['All', 'Painting', 'Digital Art', 'Photography', 'Illustration', 'Sculpture'].map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category.toLowerCase())}
                className={`text-sm font-medium whitespace-nowrap pb-2 border-b-2 transition-colors ${
                  filter === category.toLowerCase()
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {artworks.map((artwork) => (
            <div
              key={artwork.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                <img
                  src={artwork.image}
                  alt={artwork.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <Button size="icon" variant="ghost" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full">
                      <Bookmark className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{artwork.title}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={artwork.avatar}
                      alt={artwork.artist}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm text-gray-600">{artwork.artist}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">{artwork.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="rounded-full px-8">
            Load More Artworks
          </Button>
        </div>
      </div>
    </div>
  );
}
