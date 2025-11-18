

export interface User {
  id: string;
  email: string;
  password?: string; // Should not be passed to client-side after auth
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
    followers: number;
    following: number;
    artworks?: number;
    collections?: number;
    liked?: number;
  };
  likedArtworkIds: string[];
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
  commentsCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  messages: Message[];
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
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

// --- LocalStorage User Database ---
const initialUsers: User[] = [
  {
    id: '1',
    email: 'sarah@test.com',
    password: 'password123',
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
    likedArtworkIds: ['2'],
  },
  {
    id: '2',
    email: 'alex@test.com',
    password: 'password123',
    role: 'artLover',
    name: "Alex Johnson",
    username: "alexj",
    avatar: "https://i.pravatar.cc/300?img=11",
    coverImage: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=300&fit=crop",
    bio: "Lover of all things abstract and colorful. Building my personal collection one piece at a time.",
    location: "New York, NY",
    joinDate: "March 2023",
    stats: { liked: 152, collections: 1, following: 89, followers: 120 },
    likedArtworkIds: ['1', '5', '6'],
    collections: [
        {
            id: 'col1',
            name: 'Main Collection',
            artworks: [
                { id: 'c1', image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&h=800&fit=crop', title: 'Galaxy Rising', artistName: 'Unknown Artist' }
            ]
        }
    ]
  },
  { id: '3', email: 'marcus@test.com', password: 'password123', role: 'artist', name: "Marcus Williams", username: "marcusart", avatar: "https://i.pravatar.cc/150?img=2", bio: "Surreal artist exploring the urban dreamscape.", joinDate: "Feb 2023", stats: { artworks: 1, followers: 800, following: 300 }, likedArtworkIds: [] },
  { id: '4', email: 'emma@test.com', password: 'password123', role: 'artist', name: "Emma Rodriguez", username: "emmacreates", avatar: "https://i.pravatar.cc/150?img=3", bio: "Painter obsessed with color and texture.", joinDate: "April 2023", stats: { artworks: 1, followers: 2500, following: 450 }, likedArtworkIds: [] },
  { id: '5', email: 'lisa@test.com', password: 'password123', role: 'artist', name: "Lisa Thompson", username: "lisadesigns", avatar: "https://i.pravatar.cc/150?img=5", bio: "Minimalist illustrator creating geometric wonders.", joinDate: "May 2023", stats: { artworks: 1, followers: 1100, following: 200 }, likedArtworkIds: [] }
];

let userDatabase: User[] | null = null;

const initializeUserDatabase = (): User[] => {
  if (userDatabase) {
    return userDatabase;
  }
  try {
    const db = localStorage.getItem('userDatabase');
    if (db) {
      userDatabase = JSON.parse(db);
      return userDatabase!;
    }
  } catch (error) {
    console.error("Failed to parse userDatabase from localStorage, resetting.", error);
    try { localStorage.removeItem('userDatabase'); } catch(e) { console.error("Failed to remove corrupted userDatabase.", e); }
  }
  
  try {
    localStorage.setItem('userDatabase', JSON.stringify(initialUsers));
    userDatabase = initialUsers;
  } catch (error) {
    console.error("Failed to set initial userDatabase in localStorage. Using in-memory fallback.", error);
    userDatabase = initialUsers; // Fallback to in-memory
  }
  return userDatabase;
};

const saveUserDatabase = (db: User[]) => {
  try {
    localStorage.setItem('userDatabase', JSON.stringify(db));
  } catch (error) {
    console.error("Failed to save userDatabase to localStorage", error);
  }
  userDatabase = db;
};

export const registerUser = (newUser: Omit<User, 'id'>): User => {
  const db = initializeUserDatabase();
  if (db.some(user => user.email.toLowerCase() === newUser.email.toLowerCase())) {
    throw new Error("An account with this email already exists.");
  }
  if (db.some(user => user.username.toLowerCase() === newUser.username.toLowerCase())) {
    throw new Error("This username is already taken. Please choose another.");
  }
  const user: User = { ...newUser, id: Date.now().toString() };
  const newDb = [...db, user];
  saveUserDatabase(newDb);
  return user;
};

export const checkEmailExists = (email: string): boolean => {
  const db = initializeUserDatabase();
  return db.some(user => user.email.toLowerCase() === email.toLowerCase());
};

export const checkUsernameExists = (username: string): boolean => {
    const db = initializeUserDatabase();
    return db.some(user => user.username.toLowerCase() === username.toLowerCase());
};

export const authenticateUser = (email: string, password_provided: string): User | null => {
  const db = initializeUserDatabase();
  const user = db.find(user => user.email === email && user.password === password_provided);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
  return null;
};

export const deleteUser = (userId: string) => {
    let db = initializeUserDatabase();
    const newDb = db.filter(user => user.id !== userId);
    saveUserDatabase(newDb);
};
// -- End DB --

// -- Artworks --
// Pool of artistic/abstract image IDs
const artworkIds = [
    "1579783902614-a3fb3927b6a5", // Abstract Waves
    "1541961017774-22349e4a1262", // Paint
    "1583339793403-3d9b001b6008", // Abstract
    "1582561424760-0b1a93b89431", // Neon
    "1547891654-e66ed7ebb968",    // Geometric
    "1578301978162-7aae4d755744", // Digital
    "1569172194622-6202a391a0a5", // Fluid
    "1565578255382-f56c2b39003e", // Abstract 2
    "1580137189272-c9379f8864fd", // Dark abstract
    "1577720580479-7d839d829c73", // Cube
    "1550684848-fac1c5b4e853",    // Urban Mirage
    "1536924940846-227afb31e2a5", // Space
    "1561214115-f2f134cc4912",    // Dark 2
    "1618005182384-a83a8bd57fbe", // Cover
    "1558470598-a5dda9640f6b",    // Paint 2
    "1563089145-599997674d42",    // Neon 2
    "1550258987-190a2d41a8ba",    // Fluid 2
    "1545239351-ef35f4394e4e",    // Geometric 2
    "1515405295579-ba7f454346a3", // Space 2
    "1558591714-0320663d6dcd"     // Abstract 3
];

// Possible tags for random generation
const tagPool = ["abstract", "modern", "colorful", "neon", "geometric", "surreal", "digital", "nature", "urban", "minimalist", "oil", "acrylic", "portrait", "landscape"];

const generateArtworks = (): Artwork[] => {
    const generated: Artwork[] = [];
    // Add predefined ones first to ensure specific users have specific art
    const manualArtworks: Artwork[] = [
        { id: '1', artistId: '1', image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=800&fit=crop", title: "Abstract Waves", likes: 234, description: "A vibrant and dynamic abstract piece exploring the motion of ocean waves through a unique color palette.", size: '24" x 36"', tags: ["abstract", "ocean", "colorful"], commentsCount: 12 },
        { id: '2', artistId: '1', image: "https://images.unsplash.com/photo-1582561424760-0b1a93b89431?w=600&h=800&fit=crop", title: "Neon Nights", likes: 321, description: "Inspired by the neon glow of city nights, this piece captures the energy of the urban landscape after dark.", size: '20" x 30"', tags: ["neon", "photography", "urban"], commentsCount: 34 },
        { id: '3', artistId: '1', image: "https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=600&h=800&fit=crop", title: "Digital Harmony", likes: 412, description: "A fusion of organic shapes and digital textures, creating a harmonious visual experience.", size: '36" x 36"', tags: ["digitalart", "abstract", "harmony"], commentsCount: 5 },
        { id: '4', artistId: '3', image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&h=800&fit=crop", title: "Metropolitan Mirage", likes: 189, description: "A surreal interpretation of city life where reality bends and shifts.", size: '24" x 36"', tags: ["surreal", "urban", "digital"], commentsCount: 8 },
        { id: '5', artistId: '4', image: "https://images.unsplash.com/photo-1583339793403-3d9b001b6008?w=600&h=800&fit=crop", title: "Color Explosion", likes: 456, description: "An explosion of color and texture, created with acrylic on canvas.", size: '48" x 48"', tags: ["acrylic", "painting", "vibrant"], commentsCount: 45 },
        { id: '6', artistId: '5', image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600&h=800&fit=crop", title: "Geometric Flow", likes: 298, description: "A study in shape and form, this digital illustration explores the interplay of geometric patterns.", size: '18" x 24"', tags: ["geometric", "illustration", "minimalist"], commentsCount: 0 },
    ];
    
    generated.push(...manualArtworks);

    // Generate the rest to reach 300 total
    for (let i = generated.length; i < 300; i++) {
        const randomId = artworkIds[Math.floor(Math.random() * artworkIds.length)];
        const artistId = (Math.floor(Math.random() * 5) + 1).toString(); // Random artist 1-5
        const numTags = Math.floor(Math.random() * 3) + 1;
        const tags: string[] = [];
        for (let j = 0; j < numTags; j++) {
             tags.push(tagPool[Math.floor(Math.random() * tagPool.length)]);
        }
        
        generated.push({
            id: (i + 1).toString(),
            artistId: artistId,
            image: `https://images.unsplash.com/photo-${randomId}?w=600&h=800&fit=crop&q=80`,
            title: `Artwork ${i + 1}`,
            likes: Math.floor(Math.random() * 500),
            description: "A unique piece of generative art.",
            size: '18" x 24"',
            tags: Array.from(new Set(tags)), // unique tags
            commentsCount: Math.floor(Math.random() * 20)
        });
    }
    return generated;
};

export const artworks: Artwork[] = generateArtworks();

export const findUserById = (id: string | undefined): User | undefined => {
  if (!id) return undefined;
  const db = initializeUserDatabase();
  const user = db.find(user => user.id === id);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
  return undefined;
}

export const findArtworksByArtistId = (artistId: string | undefined): Artwork[] => {
  if (!artistId) return [];
  return artworks.filter(artwork => artwork.artistId === artistId);
}

export const findCollectionArtworksByUserId = (userId: string | undefined): CollectionArtwork[] => {
    const user = findUserById(userId);
    return user?.collections?.flatMap(c => c.artworks) || [];
};

export const addCollectionArtwork = (userId: string, artwork: CollectionArtwork) => {
    let db = initializeUserDatabase();
    const newDb = db.map(user => {
        if (user.id === userId) {
             // Check for duplicates in existing collection
             const allCollectionImages = user.collections?.flatMap(c => c.artworks).map(a => a.image) || [];
             if (allCollectionImages.includes(artwork.image)) {
                 throw new Error("You have already added this artwork to your collection.");
             }

            const newCollections = user.collections ? [...user.collections] : [{ id: 'col1', name: 'Main Collection', artworks: [] }];
            newCollections[0].artworks.unshift(artwork);
            return { ...user, collections: newCollections };
        }
        return user;
    });
    saveUserDatabase(newDb);
};

export const isDuplicateArtwork = (userId: string, imageBase64: string): boolean => {
    const user = findUserById(userId);
    if (!user) return false;

    if (user.role === 'artist') {
        // Check artist's portfolio (using mock data source for now, but in real app would query DB)
        const artistWorks = findArtworksByArtistId(userId);
        return artistWorks.some(work => work.image === imageBase64);
    } else {
         // Check art lover's collections
         const collectionWorks = findCollectionArtworksByUserId(userId);
         return collectionWorks.some(work => work.image === imageBase64);
    }
}

export const deleteUserArtwork = (userId: string, artworkId: string) => {
    // This is a mock; in a real app, you'd delete from a separate 'artworks' table.
    console.log(`Deleted artwork ${artworkId} for user ${userId}`);
};

export const deleteCollectionArtwork = (userId: string, artworkId: string) => {
    let db = initializeUserDatabase();
    const newDb = db.map(user => {
        if (user.id === userId && user.collections) {
            const newCollections = user.collections.map(collection => ({
                ...collection,
                artworks: collection.artworks.filter(art => art.id !== artworkId),
            }));
            return { ...user, collections: newCollections };
        }
        return user;
    });
    saveUserDatabase(newDb);
};

// Recommendation Engine
export const getRecommendedArtworks = (likedIds: Set<string> | string[]): Artwork[] => {
  const likedArray = Array.from(likedIds);
  if (likedArray.length === 0) {
    return artworks; // Return default order if no likes
  }

  // 1. Analyze preferences
  const likedObjs = artworks.filter(a => likedArray.includes(a.id));
  
  // Collect all tags from liked artworks
  const likedTags = new Set<string>();
  likedObjs.forEach(a => a.tags.forEach(t => likedTags.add(t)));
  
  // Collect artists the user has liked
  const likedArtistIds = new Set<string>();
  likedObjs.forEach(a => likedArtistIds.add(a.artistId));

  // 2. Score items
  const scoredArtworks = artworks.map(art => {
      let score = 0;

      // Penalize already liked items to push them to the bottom
      if (likedArray.includes(art.id)) {
        score -= 100;
      }

      // Signal 1: Tag Matching
      // Give points for each tag that matches a tag from a liked artwork
      const matchingTags = art.tags.filter(t => likedTags.has(t)).length;
      score += matchingTags * 2;

      // Signal 2: Artist Affinity
      // Give points if the user has liked other work by this artist
      if (likedArtistIds.has(art.artistId)) {
        score += 5;
      }
      
      // Add a tiny random factor to keep the feed feeling dynamic even with same likes
      score += Math.random();

      return { art, score };
  });

  // 3. Sort by score (descending)
  scoredArtworks.sort((a, b) => b.score - a.score);

  return scoredArtworks.map(item => item.art);
};

// --- Messaging Mock Data ---
let conversations: Conversation[] = [];

export const getConversationsForUser = (userId: string): Conversation[] => {
  if (conversations.length === 0) {
      // Init some mock conversations if empty
      conversations = [
          {
              id: 'conv1',
              participants: ['1', '2'], // Sarah and Alex
              messages: [
                  { id: 'm1', senderId: '2', text: "Hi Sarah! I love your 'Abstract Waves' piece.", timestamp: '10:00 AM' },
                  { id: 'm2', senderId: '1', text: "Thank you so much Alex! Glad you like it.", timestamp: '10:05 AM' }
              ],
              lastMessage: "Thank you so much Alex! Glad you like it.",
              lastMessageTimestamp: '10:05 AM',
              unreadCount: 0
          }
      ];
  }
  return conversations.filter(c => c.participants.includes(userId));
};

export const getMessagesForConversation = (conversationId: string): Message[] => {
    const conv = conversations.find(c => c.id === conversationId);
    return conv ? conv.messages : [];
};

export const sendMessage = (conversationId: string, senderId: string, text: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
        const newMessage: Message = {
            id: `m${Date.now()}`,
            senderId,
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        conv.messages.push(newMessage);
        conv.lastMessage = text;
        conv.lastMessageTimestamp = newMessage.timestamp;
    }
};

export const startConversation = (userId1: string, userId2: string): string => {
    // Check if exists
    let conv = conversations.find(c => c.participants.includes(userId1) && c.participants.includes(userId2));
    if (!conv) {
        conv = {
            id: `conv${Date.now()}`,
            participants: [userId1, userId2],
            messages: [],
            lastMessage: '',
            lastMessageTimestamp: '',
            unreadCount: 0
        };
        conversations.push(conv);
    }
    return conv.id;
};
