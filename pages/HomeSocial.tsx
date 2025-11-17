import React, { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

interface Post {
  id: number;
  artist: {
    name: string;
    username: string;
    avatar: string;
  };
  image: string;
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
  liked: boolean;
}

interface PostState {
  [key: number]: {
    liked: boolean;
    bookmarked: boolean;
  };
}

export default function HomeSocial() {
  const posts: Post[] = [
    {
      id: 1,
      artist: { name: "Sarah Chen", username: "@sarahchen", avatar: "https://i.pravatar.cc/150?img=1" },
      image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=1000&fit=crop",
      caption: "Just finished this piece! What do you think? 🎨✨",
      likes: 1243, comments: 87, timeAgo: "2 hours ago", liked: false
    },
    {
      id: 2,
      artist: { name: "Marcus Williams", username: "@marcusart", avatar: "https://i.pravatar.cc/150?img=2" },
      image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=1000&fit=crop",
      caption: "Urban exploration series - Part 3 🏙️",
      likes: 892, comments: 45, timeAgo: "5 hours ago", liked: true
    },
    {
      id: 3,
      artist: { name: "Emma Rodriguez", username: "@emmacreates", avatar: "https://i.pravatar.cc/150?img=3" },
      image: "https://images.unsplash.com/photo-1583339793403-3d9b001b6008?w=800&h=1000&fit=crop",
      caption: "Experimenting with bold colors today 🌈",
      likes: 2156, comments: 134, timeAgo: "8 hours ago", liked: false
    },
    {
      id: 4,
      artist: { name: "James Kim", username: "@jamesvisual", avatar: "https://i.pravatar.cc/150?img=4" },
      image: "https://images.unsplash.com/photo-1582561424760-0b1a-93b89431?w=800&h=1000&fit=crop",
      caption: "Neon dreams collection 💜",
      likes: 1567, comments: 92, timeAgo: "1 day ago", liked: true
    }
  ];

  const [postStates, setPostStates] = useState<PostState>(
    posts.reduce((acc, post) => ({ ...acc, [post.id]: { liked: post.liked, bookmarked: false } }), {})
  );

  const toggleLike = (postId: number) => {
    setPostStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], liked: !prev[postId].liked }
    }));
  };

  const toggleBookmark = (postId: number) => {
    setPostStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], bookmarked: !prev[postId].bookmarked }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <img src={post.artist.avatar} alt={post.artist.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-semibold text-gray-900">{post.artist.name}</p>
                    <p className="text-sm text-gray-500">{post.timeAgo}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </Button>
              </div>

              <div className="relative bg-gray-100">
                <img src={post.image} alt="Artwork" className="w-full object-cover" style={{ maxHeight: '600px' }} />
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => toggleLike(post.id)} className="rounded-full">
                      <Heart className={`w-6 h-6 transition-colors ${postStates[post.id]?.liked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <MessageCircle className="w-6 h-6 text-gray-700" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Send className="w-6 h-6 text-gray-700" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => toggleBookmark(post.id)} className="rounded-full">
                    <Bookmark className={`w-6 h-6 transition-colors ${postStates[post.id]?.bookmarked ? 'fill-purple-600 text-purple-600' : 'text-gray-700'}`} />
                  </Button>
                </div>
                <p className="font-semibold text-gray-900">{post.likes.toLocaleString()} likes</p>
                <p className="text-gray-900">
                  <span className="font-semibold mr-2">{post.artist.name}</span>
                  {post.caption}
                </p>
                {post.comments > 0 && (
                  <button className="text-sm text-gray-500 hover:text-gray-700">
                    View all {post.comments} comments
                  </button>
                )}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <Input 
                    type="text" 
                    placeholder="Add a comment..." 
                    className="flex-1 h-auto py-0 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0" 
                  />
                  <button className="text-sm font-semibold text-purple-600 hover:text-purple-700">Post</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" className="rounded-full px-8">
            Load More Posts
          </Button>
        </div>
      </div>
    </div>
  );
}