
import { supabase } from '../lib/supabase';

// --- Interfaces (Kept consistent with DB schema) ---

export interface User {
  id: string;
  email: string;
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
  followingIds: string[]; 
  collections?: Collection[];
  // New: Preferences stored in DB
  preferences: InteractionData;
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
  timestampRaw: number;
  isHidden?: boolean;
}

export interface Conversation {
  id: string;
  participants: string[]; 
  messages: Message[];
  lastMessage: string;
  lastMessageTimestamp: number;
  unreadCount: number;
  unreadCounts?: Record<string, number>;
  isHidden?: boolean;
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
  content: string;
  image?: string;
  timestamp: number;
  timestampStr: string;
  likes: string[];
  comments: Comment[];
  author?: {
    name: string;
    avatar: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow';
  actorId: string;
  actorName: string;
  actorAvatar: string;
  contentPreview?: string;
  time: string;
  unread: boolean;
  timestamp: number;
}

export interface FeedItem {
  type: 'post' | 'recommendation';
  data: any;
  reason?: string;
  isHidden?: boolean;
}

export interface SystemAnalytics {
  avgSessionFrequency: number;
  avgSessionDuration: number;
  dailyTimeSpent: number;
  postsPerActiveUser: number;
  commentsPerActiveUser: number;
  likesPerActiveUser: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  activeUsers: number;
}

// --- AI ARTWORK GENERATION (Client-Side) ---
const generateArtworks = (): Artwork[] => {
    const generated: Artwork[] = [];
    const totalImages = 60;
    const styles = [
        "abstract expressionism vibrant colors", "cyberpunk futuristic city neon", "surreal dreamscape fantasy",
        "digital 3d geometric shapes", "oil painting textured impasto", "watercolor floral soft pastel",
        "sci-fi cosmic nebula stars", "pop art retro comic style", "minimalist architectural design", "fantasy character portrait detailed"
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

        generated.push({
            id: `ai_${i + 1}`,
            artistId: ((i % 5) + 1).toString(), 
            image: `https://image.pollinations.ai/prompt/${prompt}?width=${width}&height=${height}&nologo=true&seed=${i}`,
            title: `${titleAdjective} ${titleNoun} #${i + 1}`,
            likes: 50 + (i * 7) % 500,
            description: `A unique AI generated artwork exploring the themes of ${style}.`,
            size: 'Digital',
            tags: ["ai-art", "generative", ...style.split(" ").slice(0, 1)],
            commentsCount: (i * 3) % 15
        });
    }
    return generated;
};

export const artworks: Artwork[] = generateArtworks();

// --- HELPERS: STORAGE ---

const base64ToBlob = async (base64: string): Promise<Blob> => {
  const res = await fetch(base64);
  const blob = await res.blob();
  return blob;
};

// Uploads image to Supabase Storage and returns Public URL
// Falls back to returning the base64 string if upload fails (legacy mode)
const uploadImageToStorage = async (base64Data: string, folder: string): Promise<string> => {
  try {
    // If it's already a URL, ignore
    if (base64Data.startsWith('http')) return base64Data;

    const blob = await base64ToBlob(base64Data);
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, blob, { contentType: 'image/jpeg' });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("Storage Upload Failed (using Base64 fallback):", error);
    return base64Data;
  }
};

// --- NOTIFICATIONS ---

export const createNotification = async (recipientId: string, type: 'like' | 'comment' | 'follow', actorId: string, contentPreview?: string) => {
  if (recipientId === actorId) return;
  
  await supabase.from('notifications').insert([{
      user_id: recipientId,
      type,
      actor_id: actorId,
      content_preview: contentPreview,
      is_read: false
  }]);
};

export const getNotificationsForUser = async (userId: string): Promise<Notification[]> => {
  // Use explicit column join syntax "users!actor_id" to ensure Supabase finds the relationship
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:users!actor_id(name, avatar_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      actorId: n.actor_id,
      actorName: n.actor?.name || 'Unknown User',
      actorAvatar: n.actor?.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png",
      contentPreview: n.content_preview,
      time: new Date(n.created_at).toLocaleDateString(),
      unread: !n.is_read,
      timestamp: new Date(n.created_at).getTime()
  }));
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  return count || 0;
};

export const markNotificationsAsRead = async (userId: string) => {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
};

export const clearAllNotifications = async (userId: string) => {
    await supabase.from('notifications').delete().eq('user_id', userId);
};

export const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
};

// --- INTERACTIONS (DB Based) ---

interface InteractionData {
  hiddenPostIds: string[];
  hiddenArtworkIds: string[];
  dismissedRecommendationIds: string[];
  hiddenConversationIds: string[];
  deletedConversationIds: string[];
  hiddenMessageIds: string[];
}

const DEFAULT_PREFS: InteractionData = { 
  hiddenPostIds: [], hiddenArtworkIds: [], dismissedRecommendationIds: [], 
  hiddenConversationIds: [], deletedConversationIds: [], hiddenMessageIds: [] 
};

// Internal helper to update preferences in DB
const updatePreferences = async (userId: string, newPrefs: InteractionData) => {
    await supabase.from('users').update({ preferences: newPrefs }).eq('id', userId);
};

// --- USERS ---

export const findUserById = async (id: string | undefined): Promise<User | undefined> => {
  if (!id) return undefined;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return undefined;
  
  const collections = await findCollectionsByUserId(id);

  return {
      ...data,
      avatar: data.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png", 
      coverImage: data.cover_image_url,
      joinDate: new Date(data.created_at).toLocaleDateString(),
      likedArtworkIds: data.liked_artwork_ids || [],
      followingIds: data.following_ids || [],
      collections: collections,
      stats: data.stats || { followers: 0, following: 0, artworks: 0, collections: collections.length, liked: 0 },
      preferences: data.preferences || DEFAULT_PREFS
  };
};

export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return [];
  return data.map((u: any) => ({
      ...u,
      avatar: u.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png",
      coverImage: u.cover_image_url,
      joinDate: new Date(u.created_at).toLocaleDateString(),
      likedArtworkIds: u.liked_artwork_ids || [],
      followingIds: u.following_ids || [],
      collections: [],
      stats: u.stats || { followers: 0, following: 0 },
      preferences: u.preferences || DEFAULT_PREFS
  }));
};

export const searchUsersAndArtworks = async (query: string) => {
    const lowerQ = query.toLowerCase();
    const allUsers = await getAllUsers();
    const matchedUsers = allUsers.filter(u => 
        u.name.toLowerCase().includes(lowerQ) || 
        u.username.toLowerCase().includes(lowerQ)
    );
    
    const { data: dbArtworks } = await supabase.from('artworks').select('*').ilike('title', `%${query}%`);
    
    const matchedArtworks = [
        ...artworks.filter(a => a.title.toLowerCase().includes(lowerQ) || a.tags.some(t => t.includes(lowerQ))),
        ...(dbArtworks ? dbArtworks.map((a: any) => ({
            id: a.id,
            artistId: a.artist_id,
            image: a.image_url,
            title: a.title,
            likes: a.likes_count,
            description: a.description,
            tags: a.tags || []
        })) : [])
    ];

    return { users: matchedUsers, artworks: matchedArtworks };
};

export const toggleFollowUser = async (currentUserId: string, targetUserId: string): Promise<User> => {
  const currentUser = await findUserById(currentUserId);
  if (!currentUser) throw new Error("User not found");

  const isFollowing = currentUser.followingIds.includes(targetUserId);
  let newFollowing = [...currentUser.followingIds];

  if (isFollowing) {
    newFollowing = newFollowing.filter(id => id !== targetUserId);
  } else {
    newFollowing.push(targetUserId);
  }

  await supabase.from('users').update({ 
      following_ids: newFollowing,
      stats: { ...currentUser.stats, following: newFollowing.length } 
  }).eq('id', currentUserId);

  if (!isFollowing) {
      await createNotification(targetUserId, 'follow', currentUserId);
  }

  return { ...currentUser, followingIds: newFollowing, stats: { ...currentUser.stats, following: newFollowing.length } };
};

export const toggleArtworkLike = async (userId: string, artworkId: string): Promise<User> => {
    const user = await findUserById(userId);
    if (!user) throw new Error("User not found");

    const likes = new Set(user.likedArtworkIds);
    if (likes.has(artworkId)) likes.delete(artworkId);
    else likes.add(artworkId);

    const newLikes = Array.from(likes);

    await supabase.from('users').update({
        liked_artwork_ids: newLikes,
        stats: { ...user.stats, liked: newLikes.length }
    }).eq('id', userId);

    return { ...user, likedArtworkIds: newLikes, stats: { ...user.stats, liked: newLikes.length } };
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
    // Upload images to Storage if changed
    let finalAvatar = updates.avatar;
    let finalCover = updates.coverImage;

    if (updates.avatar && updates.avatar.startsWith('data:')) {
        finalAvatar = await uploadImageToStorage(updates.avatar, 'avatars');
    }
    if (updates.coverImage && updates.coverImage.startsWith('data:')) {
        finalCover = await uploadImageToStorage(updates.coverImage, 'covers');
    }

    const { data, error } = await supabase
        .from('users')
        .update({
            name: updates.name,
            username: updates.username,
            bio: updates.bio,
            location: updates.location,
            website: updates.website,
            contact_email: updates.contactEmail,
            socials: updates.socials,
            commission_status: updates.commissionStatus,
            avatar_url: finalAvatar,
            cover_image_url: finalCover
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    
    return await findUserById(userId) as User;
};

export const deleteUser = async (userId: string) => {
    await supabase.from('users').delete().eq('id', userId);
};

// --- SOCIAL POSTS ---

export const getSocialPosts = async (): Promise<SocialPost[]> => {
  const { data, error } = await supabase
    .from('social_posts')
    .select('*, users!author_id(name, avatar_url)')
    .order('created_at', { ascending: false });

  if (error) return [];

  return data.map((p: any) => ({
    id: p.id,
    authorId: p.author_id,
    content: p.content,
    image: p.image_url,
    timestamp: new Date(p.created_at).getTime(),
    timestampStr: new Date(p.created_at).toLocaleDateString(),
    likes: p.likes || [],
    comments: p.comments || [],
    author: p.users ? {
        name: p.users.name,
        avatar: p.users.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
    } : undefined
  }));
};

export const createSocialPost = async (userId: string, content: string, image?: string): Promise<SocialPost> => {
  let imageUrl = image;
  if (image && image.startsWith('data:')) {
      imageUrl = await uploadImageToStorage(image, 'posts');
  }

  const { data, error } = await supabase.from('social_posts').insert([{
    author_id: userId,
    content,
    image_url: imageUrl,
    likes: [],
    comments: []
  }]).select('*, users!author_id(name, avatar_url)').single();

  if (error) throw error;
  
  return {
      id: data.id,
      authorId: data.author_id,
      content: data.content,
      image: data.image_url,
      timestamp: Date.now(),
      timestampStr: "Just now",
      likes: [],
      comments: [],
      author: data.users ? {
        name: data.users.name,
        avatar: data.users.avatar_url
      } : undefined
  };
};

export const deleteSocialPost = async (postId: string) => {
    await supabase.from('social_posts').delete().eq('id', postId);
};

export const toggleLikeSocialPost = async (postId: string, userId: string) => {
    const { data: post } = await supabase.from('social_posts').select('likes, author_id').eq('id', postId).single();
    if (!post) return;

    const likes = new Set(post.likes || []);
    if (likes.has(userId)) {
        likes.delete(userId);
    } else {
        likes.add(userId);
        await createNotification(post.author_id, 'like', userId);
    }
    await supabase.from('social_posts').update({ likes: Array.from(likes) }).eq('id', postId);
};

export const addCommentToSocialPost = async (postId: string, userId: string, text: string) => {
     const { data: post } = await supabase.from('social_posts').select('comments, author_id').eq('id', postId).single();
     if (!post) return;

     const newComment = {
         id: `cmt_${Date.now()}`,
         userId,
         text,
         timestamp: "Just now"
     };

     const comments = [...(post.comments || []), newComment];
     await supabase.from('social_posts').update({ comments }).eq('id', postId);

     await createNotification(post.author_id, 'comment', userId, text);
};

// --- ARTWORKS ---

export const publishUserArtwork = async (userId: string, artworkData: { title: string; description: string; tags: string; image: string; visibility: string }) => {
    let imageUrl = artworkData.image;
    if (artworkData.image.startsWith('data:')) {
        imageUrl = await uploadImageToStorage(artworkData.image, 'artworks');
    }

    const { data, error } = await supabase.from('artworks').insert([{
        artist_id: userId,
        title: artworkData.title,
        description: artworkData.description,
        tags: artworkData.tags.split(',').map(t => t.trim()),
        image_url: imageUrl,
        likes_count: 0
    }]).select();

    if (error) throw error;
    
    const user = await findUserById(userId);
    if (user) {
       await supabase.from('users').update({
          stats: { ...user.stats, artworks: (user.stats.artworks || 0) + 1 }
       }).eq('id', userId);
    }
    return data;
};

export const findArtworksByArtistId = async (id?: string): Promise<Artwork[]> => {
    if (!id) return [];
    
    const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .eq('artist_id', id)
        .order('created_at', { ascending: false });
        
    const realArtworks: Artwork[] = data ? data.map((a: any) => ({
        id: a.id,
        artistId: a.artist_id,
        image: a.image_url,
        title: a.title,
        likes: a.likes_count || 0,
        description: a.description || '',
        size: 'Digital',
        tags: a.tags || [],
        commentsCount: 0
    })) : [];

    const mockArtworks = artworks.filter(a => a.artistId === id);
    return [...realArtworks, ...mockArtworks];
};

export const deleteUserArtwork = async (uid: string, aid: string) => {
    if (!aid.startsWith('ai_')) { 
       await supabase.from('artworks').delete().eq('id', aid);
    }
};

// --- MESSAGES ---

export const getConversationsForUser = async (userId: string): Promise<Conversation[]> => {
    const { data, error } = await supabase.from('conversations').select('*');
    if (error) return [];

    const user = await findUserById(userId);
    const prefs = user?.preferences || DEFAULT_PREFS;
    
    let userConvs = data.filter((c: any) => 
        c.participants && 
        c.participants.includes(userId) &&
        !prefs.deletedConversationIds.includes(c.id)
    );

    return userConvs.map((c: any) => ({
        id: c.id,
        participants: c.participants,
        messages: [],
        lastMessage: c.last_message || '',
        lastMessageTimestamp: new Date(c.updated_at).getTime(),
        unreadCount: (c.unread_counts && c.unread_counts[userId]) || 0,
        unreadCounts: c.unread_counts,
        isHidden: prefs.hiddenConversationIds.includes(c.id)
    }));
};

export const getMessagesForConversation = async (conversationId: string, userId?: string): Promise<Message[]> => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error || !data) return [];

    let msgs = data.map((m: any) => ({
        id: m.id,
        senderId: m.sender_id,
        text: m.content,
        timestamp: m.created_at,
        timestampRaw: new Date(m.created_at).getTime()
    }));

    if (userId) {
        const user = await findUserById(userId);
        const prefs = user?.preferences || DEFAULT_PREFS;
        msgs = msgs.filter((m: Message) => !prefs.hiddenMessageIds.includes(m.id));
    }
    return msgs;
};

export const sendMessage = async (conversationId: string, senderId: string, text: string) => {
    await supabase.from('messages').insert([{
        conversation_id: conversationId,
        sender_id: senderId,
        content: text
    }]);
    
    const { data: conv } = await supabase.from('conversations').select('unread_counts, participants').eq('id', conversationId).single();
    if (conv) {
        const newCounts = { ...conv.unread_counts };
        conv.participants.forEach((pid: string) => {
            if (pid !== senderId) newCounts[pid] = (newCounts[pid] || 0) + 1;
        });
        
        await supabase.from('conversations').update({
            last_message: text,
            updated_at: new Date(),
            unread_counts: newCounts
        }).eq('id', conversationId);
    }
};

export const startConversation = async (userId1: string, userId2: string): Promise<string> => {
    const { data: existing } = await supabase.from('conversations').select('*');
    const found = existing?.find((c: any) => c.participants.includes(userId1) && c.participants.includes(userId2));
    
    if (found) return found.id;

    const { data, error } = await supabase.from('conversations').insert([{
        participants: [userId1, userId2],
        last_message: '',
        unread_counts: {}
    }]).select().single();

    if (error) throw error;
    return data.id;
};

export const markConversationAsRead = async (conversationId: string, userId: string) => {
    const { data: conv } = await supabase.from('conversations').select('unread_counts').eq('id', conversationId).single();
    if (conv) {
        const newCounts = { ...conv.unread_counts, [userId]: 0 };
        await supabase.from('conversations').update({ unread_counts: newCounts }).eq('id', conversationId);
    }
};

// --- COLLECTIONS ---

export const findCollectionsByUserId = async (userId: string): Promise<Collection[]> => {
    const { data: collections, error } = await supabase.from('collections').select('*').eq('user_id', userId);
    if (error || !collections) return [];

    const result: Collection[] = [];
    for (const c of collections) {
        const { data: items } = await supabase.from('collection_items').select('*').eq('collection_id', c.id);
        result.push({
            id: c.id,
            name: c.name,
            artworks: items ? items.map((i: any) => ({
                id: i.id,
                image: i.image_url,
                title: i.title,
                artistName: i.artist_name
            })) : []
        });
    }
    return result;
};

export const findCollectionArtworksByUserId = async (userId?: string): Promise<CollectionArtwork[]> => {
    if (!userId) return [];
    const collections = await findCollectionsByUserId(userId);
    return collections.flatMap(c => c.artworks);
};

export const addCollectionArtwork = async (userId: string, art: any) => {
    let { data: collection } = await supabase.from('collections').select('id').eq('user_id', userId).eq('name', 'Favorites').single();
    
    if (!collection) {
        const { data: newCol } = await supabase.from('collections').insert([{ user_id: userId, name: 'Favorites' }]).select().single();
        collection = newCol;
    }

    if (collection) {
        await supabase.from('collection_items').insert([{
            collection_id: collection.id,
            image_url: art.image,
            title: art.title,
            artist_name: art.artistName || art.artist?.name || 'Unknown'
        }]);
    }
};

export const deleteCollectionArtwork = async (userId: string, aid: string) => {
    await supabase.from('collection_items').delete().eq('id', aid);
};


// --- FEED ALGORITHM ---

export const getMixedFeed = async (userId: string): Promise<FeedItem[]> => {
    const posts = await getSocialPosts();
    const user = await findUserById(userId);
    const prefs = user?.preferences || DEFAULT_PREFS;
    
    const feedPosts: FeedItem[] = posts
        .filter(p => !prefs.hiddenPostIds.includes(p.id))
        .map(p => ({ type: 'post', data: p, isHidden: false }));

    const recs: FeedItem[] = artworks
        .slice(0, 5)
        .filter(a => !prefs.dismissedRecommendationIds.includes(a.id))
        .map(art => ({ 
            type: 'recommendation', 
            data: art, 
            reason: "Trending on Regestra",
            isHidden: prefs.hiddenArtworkIds.includes(art.id)
        }));

    const combined: FeedItem[] = [...feedPosts];
    recs.forEach((rec, i) => {
        if (combined.length > (i + 1) * 2) {
             combined.splice((i + 1) * 2, 0, rec);
        } else {
            combined.push(rec);
        }
    });
    return combined;
};

// --- PREFERENCE UPDATERS ---

export const recordInteraction = (userId: string, artworkId: string, type: string) => {
    console.log(`Interaction: User ${userId} ${type} on ${artworkId}`);
};

export const dismissRecommendation = async (userId: string, artworkId: string) => {
    const user = await findUserById(userId);
    if (!user) return;
    const prefs = user.preferences;
    prefs.dismissedRecommendationIds.push(artworkId);
    await updatePreferences(userId, prefs);
};

export const toggleHideSocialPost = async (userId: string, postId: string): Promise<User | undefined> => {
    const user = await findUserById(userId);
    if (!user) return;
    const prefs = user.preferences;
    if (prefs.hiddenPostIds.includes(postId)) prefs.hiddenPostIds = prefs.hiddenPostIds.filter(id => id !== postId);
    else prefs.hiddenPostIds.push(postId);
    await updatePreferences(userId, prefs);
    return { ...user, preferences: prefs };
};

export const toggleHideRecommendation = async (userId: string, artworkId: string) => {
    const user = await findUserById(userId);
    if (!user) return;
    const prefs = user.preferences;
    if (prefs.hiddenArtworkIds.includes(artworkId)) prefs.hiddenArtworkIds = prefs.hiddenArtworkIds.filter(id => id !== artworkId);
    else prefs.hiddenArtworkIds.push(artworkId);
    await updatePreferences(userId, prefs);
};

export const toggleHideConversation = async (userId: string, convId: string) => {
    const user = await findUserById(userId);
    if (!user) return;
    const prefs = user.preferences;
    if (prefs.hiddenConversationIds.includes(convId)) prefs.hiddenConversationIds = prefs.hiddenConversationIds.filter(id => id !== convId);
    else prefs.hiddenConversationIds.push(convId);
    await updatePreferences(userId, prefs);
};

export const deleteConversationForUser = async (userId: string, convId: string) => {
    const user = await findUserById(userId);
    if (!user) return;
    const prefs = user.preferences;
    if (!prefs.deletedConversationIds.includes(convId)) {
        prefs.deletedConversationIds.push(convId);
    }
    await updatePreferences(userId, prefs);
};

export const toggleHideMessage = async (userId: string, msgId: string) => {
    const user = await findUserById(userId);
    if (!user) return;
    const prefs = user.preferences;
    if (prefs.hiddenMessageIds.includes(msgId)) prefs.hiddenMessageIds = prefs.hiddenMessageIds.filter(id => id !== msgId);
    else prefs.hiddenMessageIds.push(msgId);
    await updatePreferences(userId, prefs);
};

export const deleteMessage = async (convId: string, msgId: string) => {
    await supabase.from('messages').delete().eq('id', msgId);
};

export const getSystemAnalytics = (): SystemAnalytics => {
    return {
        avgSessionFrequency: 3.5, avgSessionDuration: 12, dailyTimeSpent: 45,
        postsPerActiveUser: 1.2, commentsPerActiveUser: 3.4, likesPerActiveUser: 15,
        totalPosts: 120, totalComments: 450, totalLikes: 1200, activeUsers: 85
    };
};
