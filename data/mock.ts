
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: 'artist' | 'artLover';
  is_admin?: boolean;
  bio?: string;
  location?: string;
  website?: string;
  joinDate: string;
  coverImage?: string;
  stats: {
    followers: number;
    following: number;
    artworks?: number; // Artist only
    collections?: number; // Art Lover only
    liked: number;
  };
  followingIds: string[]; // Can include "pending:123" strings
  likedArtworkIds: string[];
  commissionStatus?: 'Open' | 'Closed' | 'Not Available'; // Artist only
  collections?: { id: string; name: string; artworks: CollectionArtwork[] }[]; // Art Lover only
}

export interface Artwork {
  id: string;
  artistId: string;
  title: string;
  image: string;
  likes: number;
  description?: string;
  size?: string;
  tags: string[];
  commentsCount: number;
  artistName?: string; // For display convenience
  price?: number;           // DB column `price` (public pricing value)
  publicPrice?: number;     // alias – same as price, preferred name going forward
  isPriceVisible?: boolean; // DB column `is_price_visible`
  publicPriceVisible?: boolean; // alias of isPriceVisible
  listedForSale?: boolean;
  // listPrice removed – use price/publicPrice instead
  listingStatus?: "active" | "sold";
  soldAt?: string;
}

export interface CollectionArtwork {
  id: string;
  title: string;
  artistName: string;
  image: string;
  description?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'connect_request' | 'message';
  actorId: string;
  actorName: string;
  actorAvatar: string;
  contentPreview?: string;
  time: string;
  unread: boolean;
}

export interface SocialComment {
    id: string;
    userId: string;
    userUsername: string;
    userAvatar: string;
    text: string;
    timestamp: string;
}

export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  image?: string;
  articleUrl?: string;
  articleTitle?: string;
  articleDescription?: string;
  articleImage?: string;
  timestamp: number;
  timestampStr: string;
  likes: string[]; // userIds
  comments: SocialComment[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  timestampRaw: number;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessage: string;
  lastMessageTimestamp: number;
  unreadCount: number;
  isHidden: boolean;
}

export const DEFAULT_AVATAR_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_691b6257d4173f2ed6ec3e95/7495ad18b_RegestraLogo.png';

// Mock Data Stores - Emptied to rely on Supabase
export let mockUsers: User[] = [];

export let mockArtworks: Artwork[] = [];

export let notifications: Notification[] = [];
export let socialPosts: SocialPost[] = [];
export let conversations: Conversation[] = [];

// Interactions State
const userInteractions: Record<string, { 
    hiddenPostIds: Set<string>; 
    deletedPostIds: Set<string>;
    hiddenConversationIds: Set<string>;
    deletedConversationIds: Set<string>;
}> = {};

export const getUserInteractions = (userId: string) => {
    if (!userInteractions[userId]) {
        userInteractions[userId] = {
            hiddenPostIds: new Set(),
            deletedPostIds: new Set(),
            hiddenConversationIds: new Set(),
            deletedConversationIds: new Set()
        };
    }
    return userInteractions[userId];
};

export const recordInteraction = (userId: string, artworkId: string, type: 'view' | 'linger' | 'save' | 'like') => {
    console.log(`Interaction recorded: User ${userId} ${type} on Artwork ${artworkId}`);
};

export const getNotificationsForUser = (userId: string): Notification[] => {
    return notifications.filter(n => n.userId === userId);
};

export const deleteNotification = (id: string) => {
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) notifications.splice(idx, 1);
};

export const clearAllNotifications = (userId: string) => {
    for (let i = notifications.length - 1; i >= 0; i--) {
        if (notifications[i].userId === userId) {
            notifications.splice(i, 1);
        }
    }
};

export const markNotificationsAsRead = (userId: string) => {
    notifications.forEach(n => {
        if (n.userId === userId) n.unread = false;
    });
};

export const getUnreadNotificationCount = (userId: string): number => {
    return notifications.filter(n => n.userId === userId && n.unread).length;
};

export const getHiddenPostIds = (userId: string): Set<string> => {
    return getUserInteractions(userId).hiddenPostIds;
};

export const getDeletedPostIds = (userId: string): Set<string> => {
    return getUserInteractions(userId).deletedPostIds;
};

export const markPostAsDeletedLocally = (userId: string, postId: string) => {
    getUserInteractions(userId).deletedPostIds.add(postId);
};

export const toggleHideSocialPost = (userId: string, postId: string) => {
    const hidden = getUserInteractions(userId).hiddenPostIds;
    if (hidden.has(postId)) {
        hidden.delete(postId);
    } else {
        hidden.add(postId);
    }
};

export const getSocialPosts = (): SocialPost[] => {
    return [...socialPosts];
};

export const createSocialPost = (authorId: string, content: string, image?: string, articleData?: Partial<SocialPost>) => {
    const user = findUserById(authorId);
    const newPost: SocialPost = {
        id: `p${Date.now()}`,
        authorId,
        authorName: user?.name || 'Unknown',
        authorUsername: user?.username || 'unknown',
        authorAvatar: user?.avatar || '',
        content,
        image,
        articleUrl: articleData?.articleUrl,
        articleTitle: articleData?.articleTitle,
        articleDescription: articleData?.articleDescription,
        articleImage: articleData?.articleImage,
        timestamp: Date.now(),
        timestampStr: 'Just now',
        likes: [],
        comments: []
    };
    socialPosts.unshift(newPost);
    return newPost;
};

export const deleteSocialPost = (postId: string) => {
    const idx = socialPosts.findIndex(p => p.id === postId);
    if (idx !== -1) socialPosts.splice(idx, 1);
};

export const toggleLikeSocialPost = (postId: string, userId: string) => {
    const post = socialPosts.find(p => p.id === postId);
    if (post) {
        if (post.likes.includes(userId)) {
            post.likes = post.likes.filter(id => id !== userId);
        } else {
            post.likes.push(userId);
        }
    }
};

export const addCommentToSocialPost = (postId: string, userId: string, text: string) => {
    const post = socialPosts.find(p => p.id === postId);
    const user = findUserById(userId);
    if (post) {
        post.comments.push({
            id: `c${Date.now()}`,
            userId,
            userUsername: user?.username || 'user',
            userAvatar: user?.avatar || DEFAULT_AVATAR_URL,
            text,
            timestamp: new Date().toLocaleTimeString()
        });
    }
};

export const addCollectionArtwork = (userId: string, item: CollectionArtwork) => {
    const user = findUserById(userId);
    if (user && user.collections && user.collections[0]) {
        user.collections[0].artworks.unshift(item);
    } else if (user) {
        user.collections = [{ id: 'default', name: 'My Collection', artworks: [item] }];
    }
};

export const findCollectionArtworksByUserId = (userId: string): CollectionArtwork[] => {
    const user = findUserById(userId);
    return user?.collections?.flatMap(c => c.artworks) || [];
};

export const deleteUserArtwork = (artworkId: string) => {
    const idx = mockArtworks.findIndex(a => a.id === artworkId);
    if (idx !== -1) mockArtworks.splice(idx, 1);
};

export const deleteCollectionArtwork = (userId: string, artworkId: string) => {
    const user = findUserById(userId);
    if (user && user.collections) {
        user.collections.forEach(col => {
            col.artworks = col.artworks.filter(a => a.id !== artworkId);
        });
    }
};

// --- Updated Chat Mock logic ---

export const getHiddenConversationIds = (userId: string): Set<string> => {
    return getUserInteractions(userId).hiddenConversationIds;
};

export const getDeletedConversationIds = (userId: string): Set<string> => {
    return getUserInteractions(userId).deletedConversationIds;
};

export const getConversationsForUser = (userId: string): Conversation[] => {
    const interactions = getUserInteractions(userId);
    const userConversations = conversations
        .filter(c => {
            // Find anyone who has ever messaged in this thread OR is a participant
            const history = new Set(c.participants);
            c.messages.forEach(m => history.add(m.senderId));
            return history.has(userId) && 
                   !interactions.hiddenConversationIds.has(c.id) &&
                   !interactions.deletedConversationIds.has(c.id);
        })
        .map(c => {
            const history = new Set(c.participants);
            c.messages.forEach(m => history.add(m.senderId));
            return { ...c, participants: Array.from(history) };
        });

    // Client-side deduplication keyed by other participant
    const unique: Record<string, Conversation> = {};
    userConversations.forEach(c => {
        const otherId = c.participants.find(p => p !== userId);
        const key = otherId || c.id;
        if (!unique[key] || c.lastMessageTimestamp > unique[key].lastMessageTimestamp) {
            unique[key] = c;
        }
    });

    return Object.values(unique).sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
};

export const getMessagesForConversation = (conversationId: string): Message[] => {
    const conv = conversations.find(c => c.id === conversationId);
    return conv ? [...conv.messages].sort((a, b) => a.timestampRaw - b.timestampRaw) : [];
};

export const sendMessage = (conversationId: string, senderId: string, text: string): Message | null => {
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
        const now = Date.now();
        const msg: Message = {
            id: `m${now}`,
            senderId,
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestampRaw: now,
            isRead: false
        };
        conv.messages.push(msg);
        conv.lastMessage = text;
        conv.lastMessageTimestamp = now;
        
        // Ensure all historic parties have this thread un-deleted/un-hidden
        const members = new Set(conv.participants);
        conv.messages.forEach(m => members.add(m.senderId));
        members.add(senderId);
        
        Array.from(members).forEach(mId => {
            const interactions = getUserInteractions(mId);
            interactions.hiddenConversationIds.delete(conversationId);
            interactions.deletedConversationIds.delete(conversationId);
        });

        return msg;
    }
    return null;
};

export const startConversation = (currentUserId: string, targetUserId: string): string => {
    // AGGRESSIVE DISCOVERY: Search for any thread where these two have ever interacted
    let conv = conversations.find(c => {
        const history = new Set(c.participants);
        c.messages.forEach(m => history.add(m.senderId));
        return history.size === 2 && history.has(targetUserId) && history.has(currentUserId);
    });
    
    if (conv) {
        // Restore for current user
        const interactions = getUserInteractions(currentUserId);
        interactions.hiddenConversationIds.delete(conv.id);
        interactions.deletedConversationIds.delete(conv.id);
        if (!conv.participants.includes(currentUserId)) conv.participants.push(currentUserId);
        return conv.id;
    }
    
    // Create brand new thread
    const newConv: Conversation = {
        id: `conv_${Date.now()}`,
        participants: [currentUserId, targetUserId],
        messages: [],
        lastMessage: '',
        lastMessageTimestamp: Date.now(),
        unreadCount: 0,
        isHidden: false
    };
    conversations.unshift(newConv);
    return newConv.id;
};

export const toggleHideConversation = (userId: string, conversationId: string) => {
    const hidden = getUserInteractions(userId).hiddenConversationIds;
    if (hidden.has(conversationId)) hidden.delete(conversationId);
    else hidden.add(conversationId);
};

export const deleteConversationForUser = (userId: string, conversationId: string) => {
    const interactions = getUserInteractions(userId);
    interactions.deletedConversationIds.add(conversationId);
};

export const getAllUsers = (): User[] => mockUsers;

export const findUserById = (userId: string): User | undefined => {
    return mockUsers.find(u => u.id === userId);
};

export const authenticateUser = (email: string, password: string): User | undefined => {
    return mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const registerUser = (userData: Partial<User>): User => {
    const newUser: User = {
        id: `user_${Date.now()}`,
        name: userData.name || 'New User',
        username: userData.username || 'newuser',
        email: userData.email || '',
        avatar: userData.avatar || DEFAULT_AVATAR_URL,
        role: userData.role || 'artLover',
        bio: userData.bio || '',
        joinDate: new Date().toISOString(),
        stats: { followers: 0, following: 0, liked: 0, artworks: 0, collections: 0 },
        followingIds: [],
        likedArtworkIds: [],
        ...userData
    } as User;
    mockUsers.push(newUser);
    return newUser;
};

export const updateUserProfile = (userId: string, updates: Partial<User>) => {
    const idx = mockUsers.findIndex(u => u.id === userId);
    if (idx !== -1) {
        mockUsers[idx] = { ...mockUsers[idx], ...updates };
        return mockUsers[idx];
    }
    return null;
};

export const deleteUser = (userId: string) => {
    const idx = mockUsers.findIndex(u => u.id === userId);
    if (idx !== -1) mockUsers.splice(idx, 1);
};
