






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
  followingIds: string[]; // New field for connections
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

export interface Comment {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
}

export interface SocialPost {
  id: string;
  authorId: string;
  content: string; // Text/Article
  image?: string; // Optional image
  timestamp: number; // Unix timestamp for easier sorting
  timestampStr: string; // Display string
  likes: string[]; // Array of user IDs who liked it
  comments: Comment[];
}

// New Interface for Feed Items
export type FeedItem = 
  | { type: 'post'; data: SocialPost }
  | { type: 'recommendation'; data: Artwork; reason: string };

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
    followingIds: ['3', '4']
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
    followingIds: ['1'],
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
  { id: '3', email: 'marcus@test.com', password: 'password123', role: 'artist', name: "Marcus Williams", username: "marcusart", avatar: "https://i.pravatar.cc/150?img=2", bio: "Surreal artist exploring the urban dreamscape.", joinDate: "Feb 2023", stats: { artworks: 1, followers: 800, following: 300 }, likedArtworkIds: [], followingIds: [] },
  { id: '4', email: 'emma@test.com', password: 'password123', role: 'artist', name: "Emma Rodriguez", username: "emmacreates", avatar: "https://i.pravatar.cc/150?img=3", bio: "Painter obsessed with color and texture.", joinDate: "April 2023", stats: { artworks: 1, followers: 2500, following: 450 }, likedArtworkIds: [], followingIds: [] },
  { id: '5', email: 'lisa@test.com', password: 'password123', role: 'artist', name: "Lisa Thompson", username: "lisadesigns", avatar: "https://i.pravatar.cc/150?img=5", bio: "Minimalist illustrator creating geometric wonders.", joinDate: "May 2023", stats: { artworks: 1, followers: 1100, following: 200 }, likedArtworkIds: [], followingIds: [] }
];

let userDatabase: User[] | null = null;

// --- Interaction Tracking System ---
// Stores weighted interests based on user actions
interface UserInteractions {
  tags: Record<string, number>; // tag -> score
  artistIds: Record<string, number>; // artistId -> score
  viewedArtworks: Set<string>;
}

// Mock in-memory storage for interactions (reset on reload in this demo, but could be LS)
const userInteractionsMap: Record<string, UserInteractions> = {};

const getUserInteractions = (userId: string): UserInteractions => {
  if (!userInteractionsMap[userId]) {
    userInteractionsMap[userId] = { tags: {}, artistIds: {}, viewedArtworks: new Set() };
  }
  return userInteractionsMap[userId];
};

export const recordInteraction = (userId: string, artworkId: string, type: 'view' | 'linger' | 'save' | 'like') => {
  const interactions = getUserInteractions(userId);
  const artwork = artworks.find(a => a.id === artworkId);
  if (!artwork) return;

  let weight = 1;
  if (type === 'linger') weight = 3;
  if (type === 'like') weight = 5;
  if (type === 'save') weight = 5;

  // Score tags
  artwork.tags.forEach(tag => {
    interactions.tags[tag] = (interactions.tags[tag] || 0) + weight;
  });

  // Score artist
  interactions.artistIds[artwork.artistId] = (interactions.artistIds[artwork.artistId] || 0) + weight;

  // Mark view
  if (type === 'view') interactions.viewedArtworks.add(artworkId);
};


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

export const getAllUsers = (): User[] => {
  return initializeUserDatabase();
};

export const registerUser = (newUser: Omit<User, 'id'>): User => {
  const db = initializeUserDatabase();
  if (db.some(user => user.email.toLowerCase() === newUser.email.toLowerCase())) {
    throw new Error("An account with this email already exists.");
  }
  if (db.some(user => user.username.toLowerCase() === newUser.username.toLowerCase())) {
    throw new Error("This username is already taken. Please choose another.");
  }
  // Initialize followingIds as empty array
  const user: User = { ...newUser, id: Date.now().toString(), followingIds: [] };
  const newDb = [...db, user];
  saveUserDatabase(newDb);
  return user;
};

// Mutual connection function (Connect)
export const toggleFollowUser = (currentUserId: string, targetUserId: string): User => {
  const db = initializeUserDatabase();
  
  // Determine if we are currently connected by checking if currentUser follows targetUser
  // (In a perfect mutual system, both should match, but we rely on one to toggle)
  const currentUser = db.find(u => u.id === currentUserId);
  if (!currentUser) throw new Error("Current user not found");
  
  const isConnected = currentUser.followingIds.includes(targetUserId);
  
  const newDb = db.map(user => {
    // Update Current User
    if (user.id === currentUserId) {
      const newFollowing = isConnected 
        ? user.followingIds.filter(id => id !== targetUserId)
        : [...user.followingIds, targetUserId];
      
      return {
        ...user,
        followingIds: newFollowing,
        stats: {
            ...user.stats,
            following: newFollowing.length,
            // In a mutual connect model, 'followers' usually implies connections too, 
            // but we will just increment both for symmetry or keep them independent if we view it as "friends"
            // Let's increment both following/followers to simulate "Connections" count increasing
            followers: isConnected ? Math.max(0, user.stats.followers - 1) : user.stats.followers + 1
        }
      };
    }

    // Update Target User (Mutual)
    if (user.id === targetUserId) {
       const newFollowing = isConnected 
        ? user.followingIds.filter(id => id !== currentUserId)
        : [...user.followingIds, currentUserId];

      return {
        ...user,
        followingIds: newFollowing,
        stats: {
            ...user.stats,
            following: newFollowing.length,
            followers: isConnected ? Math.max(0, user.stats.followers - 1) : user.stats.followers + 1
        }
      };
    }
    
    return user;
  });

  saveUserDatabase(newDb);
  return newDb.find(u => u.id === currentUserId)!;
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

const generateArtworks = (): Artwork[] => {
    const generated: Artwork[] = [];
    const totalImages = 60; // Set to 60 unique images

    const styles = [
        "abstract expressionism vibrant colors",
        "cyberpunk futuristic city neon",
        "surreal dreamscape fantasy",
        "digital 3d geometric shapes",
        "oil painting textured impasto",
        "watercolor floral soft pastel",
        "sci-fi cosmic nebula stars",
        "pop art retro comic style",
        "minimalist architectural design",
        "fantasy character portrait detailed"
    ];

    const adjectives = ["Ethereal", "Vivid", "Lost", "Silent", "Chaos", "Neon", "Future", "Pastel", "Mystic", "Golden"];
    const nouns = ["Dreams", "City", "Horizon", "Echo", "Fragment", "Vision", "Pulse", "Orbit", "Flow", "Cipher"];

    for (let i = 0; i < totalImages; i++) {
        const style = styles[i % styles.length];
        const prompt = encodeURIComponent(`${style} ${i}`);
        const width = 600;
        const height = 800;
        
        const titleAdjective = adjectives[i % adjectives.length];
        const titleNoun = nouns[(i + Math.floor(i / 10)) % nouns.length];

        // Use deterministic values instead of Math.random() to avoid randomization on refresh
        const artistId = ((i % 5) + 1).toString(); 
        const likes = 50 + (i * 7) % 500;
        const commentsCount = (i * 3) % 15;

        generated.push({
            id: (i + 1).toString(),
            artistId: artistId,
            image: `https://image.pollinations.ai/prompt/${prompt}?width=${width}&height=${height}&nologo=true&seed=${i}`,
            title: `${titleAdjective} ${titleNoun} #${i + 1}`,
            likes: likes,
            description: `A unique AI generated artwork exploring the themes of ${style}. Created with generative algorithms.`,
            size: 'Digital',
            tags: ["ai-art", "generative", ...style.split(" ").slice(0, 1)],
            commentsCount: commentsCount
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
        const artistWorks = findArtworksByArtistId(userId);
        return artistWorks.some(work => work.image === imageBase64);
    } else {
         const collectionWorks = findCollectionArtworksByUserId(userId);
         return collectionWorks.some(work => work.image === imageBase64);
    }
}

export const deleteUserArtwork = (userId: string, artworkId: string) => {
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

// --- Social Feed Logic ---

let socialPosts: SocialPost[] = [];

try {
  const storedPosts = localStorage.getItem('socialPosts');
  if (storedPosts) {
    socialPosts = JSON.parse(storedPosts);
  } else {
    socialPosts = [];
    localStorage.setItem('socialPosts', JSON.stringify(socialPosts));
  }
} catch (e) {
  console.error("Failed to load social posts", e);
  socialPosts = [];
}

const saveSocialPosts = () => {
    localStorage.setItem('socialPosts', JSON.stringify(socialPosts));
};

// --- MIXED FEED ALGORITHM ---

export const getMixedFeed = (userId: string): FeedItem[] => {
  const currentUser = findUserById(userId);
  if (!currentUser) return [];

  // 1. Get Social Posts from Connected Users & Self
  // Users see posts from people they follow, plus their own posts.
  const allowedAuthorIds = [...(currentUser.followingIds || []), currentUser.id];
  
  const relevantPosts: FeedItem[] = socialPosts
    .filter(post => allowedAuthorIds.includes(post.authorId))
    .map(post => ({ type: 'post', data: post }));

  // 2. Get Artwork Recommendations
  // Based on simple scoring algorithm from UserInteractions
  const interactions = getUserInteractions(userId);
  
  // Calculate scores for all artworks
  const scoredArtworks = artworks.map(art => {
    let score = 0;
    let reason = "Recommended for you";

    // Score based on followed artist
    if (currentUser.followingIds?.includes(art.artistId)) {
      score += 10;
      reason = "From an artist you follow";
    }

    // Score based on tags
    art.tags.forEach(tag => {
      if (interactions.tags[tag]) {
        score += interactions.tags[tag];
        reason = `Because you like ${tag}`;
      }
    });

    // Score based on specific artist affinity
    if (interactions.artistIds[art.artistId]) {
      score += interactions.artistIds[art.artistId];
    }

    // Filter out viewed ones to encourage discovery (optional, simplistic here)
    // For now, we just deprioritize slightly if viewed
    if (interactions.viewedArtworks.has(art.id)) {
      score -= 5;
    }

    return { art, score, reason };
  });

  // Filter out artworks with 0 score (unless we need filler) and sort
  const topRecommendations = scoredArtworks
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // Take top 5 recommendations
    .map(item => ({ type: 'recommendation' as const, data: item.art, reason: item.reason }));

  // If no recommendations (new user), allow some random popular ones
  if (topRecommendations.length === 0) {
     const randomPicks = artworks.slice(0, 3).map(art => ({
       type: 'recommendation' as const, 
       data: art, 
       reason: "Popular on Regestra"
     }));
     topRecommendations.push(...randomPicks);
  }

  // 3. Interleave / Merge
  // Simple merge: Add a recommendation every 2 posts
  const combinedFeed: FeedItem[] = [...relevantPosts];
  
  topRecommendations.forEach((rec, index) => {
    // Insert at specific intervals
    const position = (index + 1) * 2; 
    if (position < combinedFeed.length) {
      combinedFeed.splice(position, 0, rec);
    } else {
      combinedFeed.push(rec);
    }
  });

  return combinedFeed;
};

// Legacy export kept for compatibility if needed, but UI should move to getMixedFeed
export const getSocialPosts = (): SocialPost[] => {
    return [...socialPosts].sort((a, b) => b.timestamp - a.timestamp);
};

export const createSocialPost = (userId: string, content: string, image?: string): SocialPost => {
    const newPost: SocialPost = {
        id: `post_${Date.now()}`,
        authorId: userId,
        content,
        image,
        timestamp: Date.now(),
        timestampStr: "Just now",
        likes: [],
        comments: []
    };
    socialPosts.unshift(newPost);
    saveSocialPosts();
    return newPost;
};

export const toggleLikeSocialPost = (postId: string, userId: string): SocialPost[] => {
    socialPosts = socialPosts.map(post => {
        if (post.id === postId) {
            const likes = new Set(post.likes);
            if (likes.has(userId)) {
                likes.delete(userId);
            } else {
                likes.add(userId);
            }
            // Record interaction
            recordInteraction(userId, "social_interaction", 'like'); // Generic interaction
            return { ...post, likes: Array.from(likes) };
        }
        return post;
    });
    saveSocialPosts();
    return getSocialPosts(); // Logic in UI will handle feed refresh
};

export const addCommentToSocialPost = (postId: string, userId: string, text: string): SocialPost[] => {
    socialPosts = socialPosts.map(post => {
        if (post.id === postId) {
            const newComment: Comment = {
                id: `cmt_${Date.now()}`,
                userId,
                text,
                timestamp: "Just now"
            };
            return { ...post, comments: [...post.comments, newComment] };
        }
        return post;
    });
    saveSocialPosts();
    return getSocialPosts();
};

// --- Messaging Mock Data ---
let conversations: Conversation[] = [];

try {
  const storedConvs = localStorage.getItem('conversations');
  if (storedConvs) {
    conversations = JSON.parse(storedConvs);
  }
} catch (e) {
  console.error("Failed to load conversations", e);
}

const saveConversations = () => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
}

export const getConversationsForUser = (userId: string): Conversation[] => {
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
        conv.unreadCount = 0;
        saveConversations();
    }
};

export const startConversation = (userId1: string, userId2: string): string => {
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
        saveConversations();
    }
    return conv.id;
};
