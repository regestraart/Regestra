
export interface User {
  id: string;
  role: 'artist' | 'artLover';
  name: string;
  username: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  location?: string;
  website?: string;
  joinDate: string;
  commissionStatus?: 'Open' | 'Closed' | 'Not Available';
  contactEmail?: string;
  socials?: {
    instagram?: string;
    twitter?: string;
    behance?: string;
  };
  stats: {
    followers?: number;
    following: number;
    artworks?: number;
    collections?: number;
    liked?: number;
  };
  likedArtworkIds?: string[];
  collections?: Collection[];
}

export interface Artwork {
  id: string;
  artistId: string;
  image: string;
  title: string;
  likes: number;
  description: string;
  size: string;
  tags: string[];
}

export interface CollectionArtwork {
    id: string;
    image: string;
    title: string;
    artistName: string;
    likes?: number;
    description?: string;
    size?: string;
    tags?: string[];
}

export interface Collection {
    id: string;
    name: string;
    artworks: CollectionArtwork[];
}

const dbUsers: User[] = [
  {
    id: '1',
    role: 'artist',
    name: "Sarah Chen",
    username: "sarahchen",
    avatar: "https://i.pravatar.cc/300?img=1",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=300&fit=crop",
    bio: "Digital artist & illustrator | Creating colorful worlds | Available for commissions 🎨",
    location: "San Francisco, CA",
    website: "sarahchen.art",
    joinDate: "January 2023",
    commissionStatus: 'Open',
    contactEmail: 'hello@sarahchen.art',
    socials: { instagram: 'sarahchen.art', twitter: 'sarahchen', behance: 'sarahchen' },
    stats: { artworks: 3, followers: 1234, following: 567 },
    likedArtworkIds: ['2', '4'],
  },
  {
    id: '2',
    role: 'artLover',
    name: "Alex Johnson",
    username: "alexj",
    avatar: "https://i.pravatar.cc/300?img=11",
    coverImage: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=300&fit=crop",
    bio: "Lover of all things abstract and colorful. Building my personal collection one piece at a time.",
    location: "New York, NY",
    joinDate: "March 2023",
    stats: { liked: 152, collections: 1, following: 89 },
    likedArtworkIds: ['1', '5', '6'],
    collections: [
        {
            id: 'col1',
            name: 'Main Collection',
            artworks: [
                {
                    id: 'c1',
                    image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&h=800&fit=crop',
                    title: 'Galaxy Rising',
                    artistName: 'Unknown Artist'
                }
            ]
        }
    ]
  },
  {
    id: '3',
    role: 'artist',
    name: "Marcus Williams",
    username: "marcusart",
    avatar: "https://i.pravatar.cc/150?img=2",
    bio: "Surreal artist exploring the urban dreamscape.",
    joinDate: "Feb 2023",
    stats: { artworks: 1, followers: 800, following: 300 }
  },
  {
    id: '4',
    role: 'artist',
    name: "Emma Rodriguez",
    username: "emmacreates",
    avatar: "https://i.pravatar.cc/150?img=3",
    bio: "Painter obsessed with color and texture.",
    joinDate: "April 2023",
    stats: { artworks: 1, followers: 2500, following: 450 }
  },
   {
    id: '5',
    role: 'artist',
    name: "Lisa Thompson",
    username: "lisadesigns",
    avatar: "https://i.pravatar.cc/150?img=5",
    bio: "Minimalist illustrator creating geometric wonders.",
    joinDate: "May 2023",
    stats: { artworks: 1, followers: 1100, following: 200 }
  }
];

export const users = {
  artist: dbUsers[0],
  artLover: dbUsers[1],
};

export const artworks: Artwork[] = [
    { 
      id: '1', 
      artistId: '1',
      image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=800&fit=crop", 
      title: "Abstract Waves", 
      likes: 234,
      description: "A vibrant and dynamic abstract piece exploring the motion of ocean waves through a unique color palette.",
      size: '24" x 36"',
      tags: ["abstract", "ocean", "colorful"],
    },
    { 
      id: '2', 
      artistId: '1',
      image: "https://images.unsplash.com/photo-1582561424760-0b1a93b89431?w=600&h=800&fit=crop", 
      title: "Neon Nights", 
      likes: 321,
      description: "Inspired by the neon glow of city nights, this piece captures the energy of the urban landscape after dark.",
      size: '20" x 30"',
      tags: ["neon", "photography", "urban"],
    },
     { 
      id: '3', 
      artistId: '1',
      image: "https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=600&h=800&fit=crop", 
      title: "Digital Harmony", 
      likes: 412,
      description: "A fusion of organic shapes and digital textures, creating a harmonious visual experience.",
      size: '36" x 36"',
      tags: ["digitalart", "abstract", "harmony"],
    },
    {
      id: '4',
      artistId: '3',
      image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=800&fit=crop",
      title: "Urban Dreams",
      likes: 189,
      description: "A surreal take on city life, blending architectural elements with dreamlike imagery.",
      size: '30" x 40"',
      tags: ["cityscape", "surreal", "digital"],
    },
    {
      id: '5',
      artistId: '4',
      image: "https://images.unsplash.com/photo-1583339793403-3d9b001b6008?w=600&h=800&fit=crop",
      title: "Color Explosion",
      likes: 456,
      description: "An explosion of color and texture, created with acrylic on canvas.",
      size: '48" x 48"',
      tags: ["acrylic", "painting", "vibrant"],
    },
    {
      id: '6',
      artistId: '5',
      image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600&h=800&fit=crop",
      title: "Geometric Flow",
      likes: 298,
      description: "A study in shape and form, this digital illustration explores the interplay of geometric patterns.",
      size: '18" x 24"',
      tags: ["geometric", "illustration", "minimalist"],
    },
];

// --- Data Access Functions ---
export const findUserById = (id: string | undefined): User | undefined => {
  if (!id) return undefined;
  return dbUsers.find(user => user.id === id);
}

export const findArtworksByArtistId = (artistId: string | undefined): Artwork[] => {
  if (!artistId) return [];
  return artworks.filter(artwork => artwork.artistId === artistId);
}

export const findCollectionArtworksByUserId = (userId: string | undefined): CollectionArtwork[] => {
    const user = findUserById(userId);
    if (user && user.collections && user.collections.length > 0) {
        return user.collections.flatMap(c => c.artworks);
    }
    return [];
};
