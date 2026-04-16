import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Database } from '../types/supabase';
import { 
  User, 
  Artwork, 
  CollectionArtwork, 
  SocialPost, 
  Conversation, 
  Message,
  mockUsers,
  mockArtworks,
  findUserById,
  updateUserProfile,
  deleteUser,
  getSocialPosts,
  createSocialPost,
  deleteSocialPost,
  toggleHideSocialPost,
  authenticateUser,
  registerUser,
  getHiddenPostIds,
  getDeletedPostIds,
  getHiddenConversationIds,
  getDeletedConversationIds,
  markPostAsDeletedLocally,
  addCollectionArtwork,
  findCollectionArtworksByUserId,
  deleteUserArtwork, 
  deleteCollectionArtwork,
  toggleLikeSocialPost,
  addCommentToSocialPost,
  getConversationsForUser,
  getMessagesForConversation,
  sendMessage as mockSendMessage,
  startConversation as mockStartConversation,
  getAllUsers,
  toggleHideConversation,
  deleteConversationForUser,
  getNotificationsForUser,
  markNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadNotificationCount,
  DEFAULT_AVATAR_URL,
  conversations as mockConversations
} from '../data/mock';

const getErrorMessage = (err: any): string => {
    if (!err) return "An unknown database error occurred.";
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    
    const errorBody = err.error || err;
    let message = errorBody.message || errorBody.error_description || errorBody.error;
    let code = errorBody.code || err.code;
    let status = errorBody.status || err.status;
    
    if (message && typeof message === 'object') {
        message = message.message || JSON.stringify(message);
    }
    
    if (typeof message === 'string') {
        if (status === 404 && message.toLowerCase().includes("bucket not found")) {
            return "STORAGE ERROR: Create 'artworks' and 'avatars' buckets in Supabase Storage.";
        }
        if (status === 403 || message.toLowerCase().includes("permission denied")) {
            return `PERMISSION ERROR: RLS is blocking this update. (${message})`;
        }
        if (code === 'PGRST204' || message.toLowerCase().includes('schema cache') || message.toLowerCase().includes('out of date')) {
            return "SYNC ERROR: Database cache is stale. Run the repair script and REFRESH your browser.";
        }
        
        // Refined Schema Mismatch detection: Ignore character column references (e.g., "column 65")
        const isActualColumnError = (code === '42703' || message.toLowerCase().includes('does not exist')) && 
                                    !message.toLowerCase().includes('failed to parse logic tree');
                                    
        if (isActualColumnError) {
            return `SCHEMA MISMATCH: Required columns (Pricing/Metadata) are missing in the API cache. Error: ${message}`;
        }
        
        if (message.toLowerCase().includes('violates foreign key constraint')) {
            // Certificate exists for this artwork — block deletion with clear message
            if (message.toLowerCase().includes('certificates')) {
                return "CERTIFICATE EXISTS: This artwork has a Certificate of Authenticity issued. It cannot be deleted to preserve provenance records.";
            }
            return "ACCOUNT SYNC ERROR: Your user profile is missing. Log out and back in.";
        }
        return code ? `${message} (Code: ${code})` : message;
    }
    
    try {
        return JSON.stringify(err);
    } catch {
        return String(err) || "Database connection error";
    }
};

export const db = {
  auth: {
    async getCurrentUser() {
      if (!isSupabaseConfigured) return null; 
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      return db.users.getFullProfile(session.user.id);
    },
    async signOut() {
      if (!isSupabaseConfigured) return { error: null };
      return supabase.auth.signOut();
    },
    async signInWithPassword(email: string, password: string) {
        if (!isSupabaseConfigured) {
            const user = authenticateUser(email, password);
            if (user) return { data: { user: { id: user.id, email: user.email }, session: { access_token: 'mock', user: { id: user.id } } }, error: null };
            return { data: { user: null, session: null }, error: { message: "Invalid login." } };
        }
        return supabase.auth.signInWithPassword({ email, password });
    },
    async signInWithMagicLink(email: string) {
        if (!isSupabaseConfigured) return { data: {}, error: null };
        return supabase.auth.signInWithOtp({ email, options: { redirectTo: `${window.location.origin}/#/auth-callback` } });
    },
    async signUp(email: string, password: string, data: { username: string; full_name: string; role: 'artist' | 'artLover' }) {
        if (!isSupabaseConfigured) {
            const user = registerUser({ email, name: data.full_name, username: data.username, role: data.role });
            return { data: { user: { id: user.id, email: user.email }, session: { access_token: 'mock', user: { id: user.id } } }, error: null };
        }
        return supabase.auth.signUp({ email, password, options: { data: { username: data.username, full_name: data.full_name, role: data.role } } });
    },
    async resetPasswordForEmail(email: string) {
        if (!isSupabaseConfigured) return { error: null };
        return supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/#/auth-callback` });
    },
    async updateUser(attributes: { password?: string }) {
        if (!isSupabaseConfigured) return { error: null };
        return supabase.auth.updateUser(attributes);
    }
  },

  users: {
    async getProfile(userId: string) {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) throw new Error(getErrorMessage(error));
      return data;
    },
    async getAllProfiles(limit = 100) {
        if (!isSupabaseConfigured) return getAllUsers();
        const { data, error } = await supabase.from('profiles').select('*').limit(limit);
        if (error) throw new Error(getErrorMessage(error));
        return data || [];
    },
    async isUsernameAvailable(username: string): Promise<boolean> {
        if (!isSupabaseConfigured) return !mockUsers.some(u => u.username.toLowerCase() === username.toLowerCase());
        const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).ilike('username', username);
        if (error) throw new Error(getErrorMessage(error));
        return count === 0;
    },
    async getFullProfile(userId: string): Promise<User | null> {
        if (!isSupabaseConfigured) return findUserById(userId) || null;
        try {
            const [profile, followers, following, artworks, followingData] = await Promise.all([
                this.getProfile(userId),
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId).eq('status', 'accepted'),
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId).eq('status', 'accepted'),
                supabase.from('artworks').select('*', { count: 'exact', head: true }).eq('artist_id', userId).eq('profile_visible', true),
                supabase.from('follows').select('following_id, status').eq('follower_id', userId)
            ]);

            if (!profile) return null;
            const followingIds = (followingData.data || []).map(f => f.status === 'pending' ? `pending:${f.following_id}` : f.following_id);
            let collections = [];
            if (profile.collections) {
                collections = typeof profile.collections === 'string' ? JSON.parse(profile.collections) : profile.collections;
            }

            return {
                id: profile.id, name: profile.full_name || 'User', username: profile.username || 'user', email: profile.email || '',
                avatar: profile.avatar_url || DEFAULT_AVATAR_URL, role: (profile.role as any) || 'artist', bio: profile.bio || '',
                location: profile.location || '', website: profile.website || '', joinDate: new Date(profile.created_at).toLocaleDateString(),
                coverImage: profile.cover_image || undefined, is_admin: (profile as any).is_admin === true,
                stats: { followers: followers.count || 0, following: following.count || 0, artworks: artworks.count || 0, collections: collections.length, liked: 0 },
                followingIds: followingIds, likedArtworkIds: [], commissionStatus: (profile.commission_status as any) || 'Not Available',
                collections: collections.length > 0 ? [{ id: 'main', name: 'My Collection', artworks: collections }] : []
            };
        } catch (e) { 
          const msg = getErrorMessage(e);
          if (msg.includes("SYNC ERROR") || msg.includes("CACHE") || msg.includes("SCHEMA MISMATCH")) throw new Error(msg);
          return null; 
        }
    },
    async getProfileByUsername(username: string): Promise<User | null> {
        if (!isSupabaseConfigured) return mockUsers.find(u => u.username === username) || null;
        try {
            const { data: profile, error } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
            if (error) throw new Error(getErrorMessage(error));
            if (!profile) return null;
            return this.getFullProfile(profile.id);
        } catch (e) {
            console.error("Error fetching by username:", e);
            return null;
        }
    },
    async updateProfile(userId: string, updates: Partial<User>) {
        if (isSupabaseConfigured) {
          const { error } = await supabase.from('profiles').update({ 
            full_name: updates.name, username: updates.username, bio: updates.bio, 
            location: updates.location, website: updates.website, 
            avatar_url: updates.avatar, cover_image: updates.coverImage,
            commission_status: updates.commissionStatus as any
          }).eq('id', userId);
          if (error) throw new Error(getErrorMessage(error));
        } else {
          updateUserProfile(userId, updates);
        }
    },
    async followUser(followerId: string, followingId: string) {
        if (isSupabaseConfigured) {
            await Promise.all([
                supabase.from('follows').insert({ follower_id: followerId, following_id: followingId, status: 'pending' }),
                supabase.from('notifications').insert({ user_id: followingId, actor_id: followerId, type: 'connect_request', is_read: false }),
            ]);
        }
    },
    async unfollowUser(followerId: string, followingId: string) {
        if (isSupabaseConfigured) {
            await Promise.all([
                supabase.from('follows').delete().or(`and(follower_id.eq.${followerId},following_id.eq.${followingId}),and(follower_id.eq.${followingId},following_id.eq.${followerId})`),
                supabase.from('notifications').delete().match({ user_id: followingId, actor_id: followerId, type: 'connect_request' }),
            ]);
        }
    },
    async acceptRequest(actorId: string, userId: string) {
      if (isSupabaseConfigured) {
          await Promise.all([
              supabase.from('follows').update({ status: 'accepted' }).match({ follower_id: actorId, following_id: userId }),
              supabase.from('follows').upsert({ follower_id: userId, following_id: actorId, status: 'accepted' }),
              supabase.from('notifications').insert({ user_id: actorId, actor_id: userId, type: 'follow', is_read: false }),
          ]);
      }
    },
    async declineRequest(actorId: string, userId: string) {
        if (isSupabaseConfigured) await supabase.from('follows').delete().match({ follower_id: actorId, following_id: userId });
    },
    async deleteProfile(userId: string) {
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw new Error(getErrorMessage(error));
        } else {
            deleteUser(userId);
        }
    }
  },

  artworks: {
    async getAll(limit = 100): Promise<Artwork[]> {
        if (!isSupabaseConfigured) return [];
        const { data, error } = await supabase
          .from('artworks')
          .select('*')
          .eq('profile_visible', true)  // never show deleted/hidden artworks
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw new Error(getErrorMessage(error));
        return (data || []).map(art => ({
            id: art.id, artistId: art.artist_id, title: art.title, image: art.image_url, likes: art.likes_count,
            description: art.description || '', tags: art.tags || [], commentsCount: 0,
            price: art.price, publicPrice: art.price,
            isPriceVisible: art.is_price_visible, publicPriceVisible: art.is_price_visible,
            listedForSale: art.listed_for_sale || false
        }));
    },
    async getForSale(limit = 100): Promise<Artwork[]> {
        if (!isSupabaseConfigured) return [];

        // --- Primary query: uses listing_status (requires migration to have run) ---
        const { data, error } = await supabase.from('artworks')
            .select('*, profiles(full_name, username, avatar_url)')
            .eq('listed_for_sale', true)
            // Only show items still visible on the marketplace
            .eq('marketplace_visible', true)
            .or('listing_status.is.null,listing_status.eq.active')
            .order('created_at', { ascending: false })
            .limit(limit);

        // --- Graceful fallback if listing_status column doesn't exist yet ---
        if (error) {
            const msg = getErrorMessage(error);
            const msgLower = (error.message || '').toLowerCase();
            const isColumnMissing =
                error.code === '42703' ||
                msgLower.includes('listing_status') ||
                msgLower.includes('marketplace_visible') ||
                msgLower.includes('does not exist');

            if (isColumnMissing) {
                if (import.meta.env.DEV) {
                    console.warn(
                        '[Marketplace] listing_status column not found – falling back to listed_for_sale only.\n' +
                        'Run step1_run_in_supabase_sql_editor.sql in your Supabase project to fix this permanently.'
                    );
                }
                // Fallback: query without listing_status filter
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('artworks')
                    .select('*, profiles(full_name, username, avatar_url)')
                    .eq('listed_for_sale', true)
                    // Fallback does not assume marketplace_visible exists.
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (fallbackError) throw new Error(getErrorMessage(fallbackError));

                return (fallbackData || []).map(art => ({
                    id: art.id, artistId: art.artist_id, title: art.title, image: art.image_url, likes: art.likes_count,
                    description: art.description || '', tags: art.tags || [], commentsCount: 0,
                    price: (art as any).price ?? null, publicPrice: (art as any).price ?? null,
                    isPriceVisible: (art as any).is_price_visible ?? true,
                    publicPriceVisible: (art as any).is_price_visible ?? true,
                    listedForSale: true,
                    listingStatus: 'active' as const,
                    soldAt: undefined,
                    artistName: (art.profiles as any)?.full_name,
                }));
            }

            // Any other error: surface it normally
            throw new Error(msg);
        }

        return (data || []).map(art => ({
            id: art.id, artistId: art.artist_id, title: art.title, image: art.image_url, likes: art.likes_count,
            description: art.description || '', tags: art.tags || [], commentsCount: 0,
            price: art.price, publicPrice: art.price,
            isPriceVisible: art.is_price_visible, publicPriceVisible: art.is_price_visible,
            listedForSale: true,
            listingStatus: (art.listing_status as 'active' | 'sold') || 'active',
            soldAt: art.sold_at || undefined,
            artistName: (art.profiles as any)?.full_name,
        }));
    },
    async getByArtist(artistId: string): Promise<Artwork[]> {
        if (!isSupabaseConfigured) return [];
        // Profile should show ONLY items that are still visible on profile.
        const { data, error } = await supabase
          .from('artworks')
          .select('*')
          .eq('artist_id', artistId)
          .eq('profile_visible', true)
          .order('created_at', { ascending: false });

        if (error) {
          const msg = getErrorMessage(error);
          const msgLower = (error.message || '').toLowerCase();
          const isColumnMissing = error.code === '42703' || msgLower.includes('profile_visible') || msgLower.includes('does not exist');
          if (isColumnMissing) {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('artworks')
              .select('*')
              .eq('artist_id', artistId)
              .order('created_at', { ascending: false });
            if (fallbackError) throw new Error(getErrorMessage(fallbackError));
            return (fallbackData || []).map(art => ({
              id: art.id, artistId: art.artist_id, title: art.title, image: art.image_url, likes: art.likes_count,
              description: art.description || '', tags: art.tags || [], commentsCount: 0,
              price: (art as any).price ?? null, publicPrice: (art as any).price ?? null,
              isPriceVisible: (art as any).is_price_visible ?? true,
              publicPriceVisible: (art as any).is_price_visible ?? true,
              listedForSale: (art as any).listed_for_sale || false,
              listingStatus: (art as any).listing_status || undefined,
              soldAt: (art as any).sold_at || undefined,
            }));
          }
          throw new Error(msg);
        }
        return (data || []).map(art => ({
            id: art.id, artistId: art.artist_id, title: art.title, image: art.image_url, likes: art.likes_count,
            description: art.description || '', tags: art.tags || [], commentsCount: 0,
            price: art.price, publicPrice: art.price,
            isPriceVisible: art.is_price_visible, publicPriceVisible: art.is_price_visible,
            listedForSale: art.listed_for_sale || false,
            listingStatus: (art.listing_status as "active" | "sold") || undefined,
            soldAt: art.sold_at || undefined,
        }));
    },
    async getById(id: string): Promise<Artwork | null> {
        if (!isSupabaseConfigured) return mockArtworks.find(a => a.id === id) || null;
        const { data, error } = await supabase.from('artworks').select('*, profiles(*)').eq('id', id).maybeSingle();
        if (error) throw new Error(getErrorMessage(error));
        if (!data) return null;
        return {
            id: data.id, artistId: data.artist_id, title: data.title, image: data.image_url, likes: data.likes_count,
            description: data.description || '', tags: data.tags || [], commentsCount: 0,
            price: data.price, publicPrice: data.price,
            isPriceVisible: data.is_price_visible, publicPriceVisible: data.is_price_visible,
            listedForSale: data.listed_for_sale || false,
            artistName: data.profiles?.full_name,
            _artist: data.profiles ? {
              id: data.profiles.id,
              name: data.profiles.full_name,
              username: data.profiles.username,
              avatar: data.profiles.avatar_url
            } : null
        } as any;
    },
    async create(artwork: any) {
        if (isSupabaseConfigured) {
          const payload: any = {
              artist_id: artwork.artist_id,
              title: artwork.title,
              description: artwork.description,
              image_url: artwork.image_url,
              tags: artwork.tags,
          };

          // Use publicPrice or price – publicPrice takes precedence (new field name)
          const priceVal = artwork.publicPrice ?? artwork.price;
          if (priceVal !== undefined && priceVal !== null) payload.price = priceVal;
          // Visibility: if listed_for_sale, force visible = true; otherwise respect user choice
          const listedForSale = !!(artwork.listed_for_sale);
          payload.is_price_visible = listedForSale ? true : (artwork.is_price_visible !== undefined ? artwork.is_price_visible : true);
          payload.listed_for_sale = listedForSale;
          // list_price intentionally NOT written – deprecated; price column is canonical
          // Set listing_status='active' when listed for sale, null otherwise
          payload.listing_status = payload.listed_for_sale ? 'active' : null;

          // Dual visibility (decoupled removals)
          payload.profile_visible = artwork.profile_visible !== undefined ? artwork.profile_visible : true;
          payload.marketplace_visible = payload.listed_for_sale ? true : (artwork.marketplace_visible ?? false);

          // Optional: stored path for deletion
          if (artwork.image_path) payload.image_path = artwork.image_path;
          
          const { error } = await supabase.from('artworks').insert(payload);
          if (error) throw new Error(getErrorMessage(error));
        }
        else mockArtworks.unshift({ id: `art_${Date.now()}`, artistId: artwork.artist_id, title: artwork.title, image: artwork.image_url, likes: 0, tags: artwork.tags || [], commentsCount: 0, description: artwork.description, price: artwork.price, isPriceVisible: artwork.is_price_visible !== undefined ? artwork.is_price_visible : true });
    },
    async update(id: string, updates: Partial<Artwork>) {
        if (isSupabaseConfigured) {
          const { error } = await supabase.from('artworks').update({ 
              title: updates.title, 
              description: updates.description, 
              tags: updates.tags,
              price: updates.price,
              is_price_visible: updates.isPriceVisible
          }).eq('id', id);
          if (error) throw new Error(getErrorMessage(error));
        } else {
          const idx = mockArtworks.findIndex(a => a.id === id);
          if (idx !== -1) mockArtworks[idx] = { ...mockArtworks[idx], ...updates };
        }
    },
    async markSold(id: string, sellerId: string): Promise<void> {
        if (isSupabaseConfigured) {
            const { data: art, error: fetchErr } = await supabase.from('artworks').select('artist_id').eq('id', id).maybeSingle();
            if (fetchErr) throw new Error(getErrorMessage(fetchErr));
            if (!art || art.artist_id !== sellerId) throw new Error('Permission denied: only the seller can mark as sold.');
            const { error } = await supabase.from('artworks').update({
                listing_status: 'sold',
                sold_at: new Date().toISOString(),
            }).eq('id', id);
            if (error) throw new Error(getErrorMessage(error));
        } else {
            const idx = mockArtworks.findIndex(a => a.id === id);
            if (idx !== -1) {
                if (mockArtworks[idx].artistId !== sellerId) throw new Error('Permission denied.');
                mockArtworks[idx] = { ...mockArtworks[idx], listingStatus: 'sold', soldAt: new Date().toISOString() };
            }
        }
    },
    async unlist(id: string, sellerId: string): Promise<void> {
        if (isSupabaseConfigured) {
            const { data: art, error: fetchErr } = await supabase.from('artworks').select('artist_id').eq('id', id).maybeSingle();
            if (fetchErr) throw new Error(getErrorMessage(fetchErr));
            if (!art || art.artist_id !== sellerId) throw new Error('Permission denied: only the seller can remove a listing.');
            const { error } = await supabase.from('artworks').update({
                listed_for_sale: false,
                // list_price intentionally not reset (deprecated column)
                listing_status: null,
                marketplace_visible: false,
            }).eq('id', id);
            if (error) throw new Error(getErrorMessage(error));
        } else {
            const idx = mockArtworks.findIndex(a => a.id === id);
            if (idx !== -1) {
                if (mockArtworks[idx].artistId !== sellerId) throw new Error('Permission denied.');
                mockArtworks[idx] = { ...mockArtworks[idx], listedForSale: false, listingStatus: undefined };
            }
        }
    },
    async delete(id: string) {
        if (isSupabaseConfigured) await supabase.from('artworks').delete().eq('id', id);
        else deleteUserArtwork(id);
    }
    ,
    async removeFromProfile(id: string, userId: string): Promise<void> {
        if (isSupabaseConfigured) {
            const { data: art, error: fetchErr } = await supabase
              .from('artworks')
              .select('artist_id')
              .eq('id', id)
              .maybeSingle();
            if (fetchErr) throw new Error(getErrorMessage(fetchErr));
            if (!art || art.artist_id !== userId) throw new Error('Permission denied: only the owner can remove from profile.');
            // Always hide — works whether cert exists or not
            const { error } = await supabase.from('artworks').update({
                profile_visible: false,
                marketplace_visible: false,
                listed_for_sale: false,
                listing_status: null,
            }).eq('id', id);
            if (error) throw new Error(getErrorMessage(error));
        } else {
            const idx = mockArtworks.findIndex(a => a.id === id);
            if (idx !== -1 && mockArtworks[idx].artistId === userId) {
              mockArtworks.splice(idx, 1);
            }
        }
    },
    async deleteEverywhere(id: string, userId: string): Promise<void> {
        if (!isSupabaseConfigured) { deleteUserArtwork(id); return; }

        const { data: art, error: fetchErr } = await supabase
          .from('artworks')
          .select('artist_id, image_url, image_path')
          .eq('id', id)
          .maybeSingle();
        if (fetchErr) throw new Error(getErrorMessage(fetchErr));
        if (!art || art.artist_id !== userId) throw new Error('Permission denied: only the owner can delete everywhere.');

        // Check if a certificate exists for this artwork
        const { data: cert } = await supabase
          .from('certificates')
          .select('id')
          .eq('artwork_id', id)
          .maybeSingle();

        if (cert) {
            // Certificate exists — hide everywhere but preserve the artwork row
            // so the certificate's provenance record remains intact on-chain.
            // Also snapshot the current image URL into the cert so it persists
            // even if the artwork row or storage file is later modified.
            if (art.image_url) {
                await supabase
                  .from('certificates')
                  .update({ artwork_image_url: art.image_url })
                  .eq('artwork_id', id);
            }
            const { error } = await supabase.from('artworks').update({
                profile_visible: false,
                marketplace_visible: false,
                listed_for_sale: false,
                listing_status: null,
            }).eq('id', id);
            if (error) throw new Error(getErrorMessage(error));
            // Note: image file is intentionally kept in storage since cert references it
            return;
        }

        // No certificate — safe to fully delete including storage
        const path = (art as any).image_path as string | null;
        if (path) {
          await supabase.storage.from('artworks').remove([path]);
        } else if (art.image_url) {
          try {
            const url = new URL(art.image_url);
            const parts = url.pathname.split('/');
            const file = parts[parts.length - 1];
            if (file) await supabase.storage.from('artworks').remove([file]);
          } catch { /* ignore */ }
        }

        const { error: delErr } = await supabase.from('artworks').delete().eq('id', id);
        if (delErr) throw new Error(getErrorMessage(delErr));
    }
  },

  collections: {
    async add(userId: string, artwork: CollectionArtwork) { 
        if (!isSupabaseConfigured) { addCollectionArtwork(userId, artwork); return; }
        // Try the RPC first (works for adding to another user's collection)
        const { error: rpcErr } = await supabase.rpc('add_to_collection', {
          p_user_id: userId,
          p_artwork: artwork,
        });
        if (!rpcErr) return;
        // Fallback to direct update (works when adding to own collection)
        const { data: profile } = await supabase.from('profiles').select('collections').eq('id', userId).single();
        let current = Array.isArray(profile?.collections) ? profile.collections : [];
        await supabase.from('profiles').update({ collections: [artwork, ...current] }).eq('id', userId);
    },
    async getById(userId: string, artworkId: string): Promise<CollectionArtwork | null> {
        if (!isSupabaseConfigured) {
            const user = findUserById(userId);
            return user?.collections?.flatMap(c => c.artworks).find(a => a.id === artworkId) || null;
        }
        const { data: profile } = await supabase.from('profiles').select('collections').eq('id', userId).single();
        let current = Array.isArray(profile?.collections) ? profile.collections : [];
        return current.find((a: any) => a.id === artworkId) || null;
    },
    async update(userId: string, artworkId: string, updates: Partial<CollectionArtwork>) {
        if (!isSupabaseConfigured) return;
        const { data: profile } = await supabase.from('profiles').select('collections').eq('id', userId).single();
        let current = Array.isArray(profile?.collections) ? profile.collections : [];
        const updated = current.map((a: any) => a.id === artworkId ? { ...a, ...updates } : a);
        await supabase.from('profiles').update({ collections: updated }).eq('id', userId);
    },
    async delete(userId: string, artworkId: string) {
        if (!isSupabaseConfigured) { deleteCollectionArtwork(userId, artworkId); return; }
        const { data: profile } = await supabase.from('profiles').select('collections').eq('id', userId).single();
        let current = Array.isArray(profile?.collections) ? profile.collections : [];
        await supabase.from('profiles').update({ collections: current.filter((a: any) => a.id !== artworkId) }).eq('id', userId);
    }
  },

  feed: {
    async getRecentPosts(userId?: string): Promise<SocialPost[]> {
        if (!isSupabaseConfigured) {
            const posts = getSocialPosts();
            return posts.filter(p => {
                if (p.authorUsername === 'regestra') return true;
                if (!userId) return false;
                if (p.authorId === userId) return true;
                const user = findUserById(userId);
                return user?.followingIds.includes(p.authorId) || false;
            }).filter(p => userId ? (!getHiddenPostIds(userId).has(p.id) && !getDeletedPostIds(userId).has(p.id)) : true);
        }

        // Fetch Regestra's ID for consistent feed inclusion
        const { data: regUser } = await supabase.from('profiles').select('id').eq('username', 'regestra').maybeSingle();
        const regId = regUser?.id;

        const allowedAuthorIds: string[] = [];
        if (userId) {
            allowedAuthorIds.push(userId);
            const { data: follows } = await supabase.from('follows')
                .select('following_id')
                .eq('follower_id', userId)
                .eq('status', 'accepted');
            if (follows) allowedAuthorIds.push(...follows.map(f => f.following_id));
        }
        
        if (regId && !allowedAuthorIds.includes(regId)) {
            allowedAuthorIds.push(regId);
        }

        // Use a simple 'in' filter which is far more stable than cross-table 'or' logic
        const query = supabase.from('social_posts')
            .select('*, profiles!inner(*), likes(user_id), social_comments(*, profiles(*))')
            .in('author_id', allowedAuthorIds)
            .order('created_at', { ascending: false })
            .limit(50);

        const { data, error } = await query;
        if (error) throw new Error(getErrorMessage(error));
        
        const hiddenIds = userId ? getHiddenPostIds(userId) : new Set<string>();
        const deletedIds = userId ? getDeletedPostIds(userId) : new Set<string>();
        
        return (data || [])
            .filter(post => !hiddenIds.has(post.id) && !deletedIds.has(post.id))
            .map(post => ({
                id: post.id, authorId: post.author_id, authorName: post.profiles?.full_name || 'User', authorUsername: post.profiles?.username || 'user', authorAvatar: post.profiles?.avatar_url || DEFAULT_AVATAR_URL,
                content: post.content || '', image: post.image_url || undefined, articleUrl: post.article_url || undefined, articleTitle: post.article_title || undefined, articleDescription: post.article_description || undefined, articleImage: post.article_image || undefined,
                timestamp: new Date(post.created_at).getTime(), timestampStr: new Date(post.created_at).toLocaleDateString(), 
                likes: (post.likes || []).map((l: any) => l.user_id), 
                comments: (post.social_comments || []).map((c: any) => ({ id: c.id, userId: c.user_id, userUsername: c.profiles?.username || 'user', userAvatar: c.profiles?.avatar_url || DEFAULT_AVATAR_URL, text: c.content, timestamp: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }))
            }));
    },
    async createPost(post: any) {
        if (isSupabaseConfigured) {
          const payload = {
              author_id: post.author_id, 
              content: post.content, 
              image_url: post.image_url,
              article_url: post.article_url, 
              article_title: post.article_title,
              article_description: post.article_description, 
              article_image: post.article_image
          };
          const { error } = await supabase.from('social_posts').insert(payload);
          if (error) throw new Error(getErrorMessage(error));
        } else {
          createSocialPost(post.author_id, post.content, post.image_url, post);
        }
    },
    async likePost(userId: string, postId: string) {
        if (isSupabaseConfigured) {
            const { data } = await supabase.from('likes').select('*').eq('user_id', userId).eq('post_id', postId).maybeSingle();
            if (data) await supabase.from('likes').delete().eq('id', data.id);
            else await supabase.from('likes').insert({ user_id: userId, post_id: postId });
        } else toggleLikeSocialPost(postId, userId);
    },
    async deletePost(userId: string, postId: string) {
        if (isSupabaseConfigured) await supabase.from('social_posts').delete().eq('id', postId).eq('author_id', userId);
        else { deleteSocialPost(postId); markPostAsDeletedLocally(userId, postId); }
    },
    async hidePost(userId: string, postId: string) { toggleHideSocialPost(userId, postId); },
    async addComment(postId: string, userId: string, content: string) {
        if (isSupabaseConfigured) await supabase.from('social_comments').insert({ post_id: postId, user_id: userId, content });
        else addCommentToSocialPost(postId, userId, content);
    },
    async updatePost(userId: string, postId: string, content: string) {
        if (isSupabaseConfigured) await supabase.from('social_posts').update({ content, updated_at: new Date().toISOString() }).eq('id', postId).eq('author_id', userId);
    },
    async updateComment(userId: string, commentId: string, content: string) {
        if (isSupabaseConfigured) await supabase.from('social_comments').update({ content, updated_at: new Date().toISOString() }).eq('id', commentId).eq('user_id', userId);
    },
    async deleteComment(userId: string, commentId: string) {
        if (isSupabaseConfigured) await supabase.from('social_comments').delete().eq('id', commentId).eq('user_id', userId);
    },
  },

  chat: {
    async getConversations(userId: string): Promise<Conversation[]> {
        if (!isSupabaseConfigured) return getConversationsForUser(userId);
        try {
            // Single query — join through conversation_participants, exclude hidden
            const { data: myParticipation } = await supabase
                .from('conversation_participants')
                .select(`
                    conversation_id, is_hidden,
                    conversations(
                        id, updated_at,
                        messages(content, created_at, sender_id, is_read),
                        conversation_participants(user_id, is_hidden, profiles(id, full_name, username, avatar_url))
                    )
                `)
                .eq('user_id', userId)
                .eq('is_hidden', false);

            if (!myParticipation || myParticipation.length === 0) return [];

            return (myParticipation || [])
                .filter(p => p.conversations)
                .map(p => {
                    const c = p.conversations as any;
                    const msgs = c.messages || [];
                    msgs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    return {
                        id: c.id,
                        participants: c.conversation_participants.map((cp: any) => cp.user_id),
                        messages: [],
                        lastMessage: msgs[0]?.content || '',
                        lastMessageTimestamp: new Date(c.updated_at).getTime(),
                        unreadCount: msgs.filter((m: any) => m.sender_id !== userId && !m.is_read).length || 0,
                        isHidden: false,
                        _participantProfiles: c.conversation_participants.map((cp: any) => cp.profiles),
                    };
                })
                .sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp) as any;
        } catch (err) { return []; }
    },
    async getMessages(convId: string): Promise<Message[]> {
        if (!isSupabaseConfigured) return getMessagesForConversation(convId);
        const { data } = await supabase.from('messages').select('*, profiles(id, full_name, username, avatar_url)').eq('conversation_id', convId).order('created_at', { ascending: true });
        return (data || []).map(m => ({
            id: m.id, senderId: m.sender_id, text: m.content,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestampRaw: new Date(m.created_at).getTime(), isRead: m.is_read, _senderProfile: m.profiles
        }));
    },
    async sendMessage(convId: string, senderId: string, text: string): Promise<string | null> {
        if (isSupabaseConfigured) {
            const now = new Date().toISOString();
            const [insertResult] = await Promise.all([
                supabase.from('messages').insert({ conversation_id: convId, sender_id: senderId, content: text, created_at: now }).select('id').single(),
                supabase.from('conversations').update({ updated_at: now }).eq('id', convId),
                // Unhide for all participants so the thread reappears after being hidden
                supabase.from('conversation_participants').update({ is_hidden: false }).eq('conversation_id', convId),
            ]);
            return insertResult.data?.id ?? null;
        } else {
            mockSendMessage(convId, senderId, text);
            return null;
        }
    },
    async startConversation(currentUserId: string, targetUserId: string): Promise<string> {
        if (!isSupabaseConfigured) return mockStartConversation(currentUserId, targetUserId);
        // Find existing shared conversation
        const [{ data: currentP }, { data: targetP }] = await Promise.all([
            supabase.from('conversation_participants').select('conversation_id').eq('user_id', currentUserId),
            supabase.from('conversation_participants').select('conversation_id').eq('user_id', targetUserId),
        ]);
        const shared = (currentP || []).filter(cp => (targetP || []).some(tp => tp.conversation_id === cp.conversation_id));
        if (shared.length > 0) {
            const existingId = shared[0].conversation_id;
            // Unhide for the current user so it reappears in their inbox
            await supabase.from('conversation_participants').update({ is_hidden: false }).eq('conversation_id', existingId).eq('user_id', currentUserId);
            return existingId;
        }
        const newId = crypto.randomUUID();
        await supabase.from('conversations').insert({ id: newId });
        await supabase.from('conversation_participants').insert([
            { conversation_id: newId, user_id: currentUserId },
            { conversation_id: newId, user_id: targetUserId },
        ]);
        return newId;
    },
    async markAsRead(convId: string, userId: string) {
        if (isSupabaseConfigured) await supabase.from('messages').update({ is_read: true }).eq('conversation_id', convId).neq('sender_id', userId);
    },
    async markAllAsRead(userId: string) {
        if (isSupabaseConfigured) {
            const { data: p } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', userId);
            if (p && p.length > 0) await supabase.from('messages').update({ is_read: true }).in('conversation_id', p.map(pr => pr.conversation_id)).neq('sender_id', userId).eq('is_read', false);
        }
    },
    async getUnreadCount(userId: string): Promise<number> {
        if (!isSupabaseConfigured) return 0;
        const { data: p } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', userId);
        if (!p || p.length === 0) return 0;
        const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).in('conversation_id', p.map(pr => pr.conversation_id)).neq('sender_id', userId).eq('is_read', false);
        return count || 0;
    },
    async hideConversation(userId: string, convId: string) {
        if (isSupabaseConfigured) await supabase.from('conversation_participants').update({ is_hidden: true }).eq('conversation_id', convId).eq('user_id', userId);
    },
    async deleteConversation(userId: string, convId: string) {
        if (isSupabaseConfigured) await supabase.from('conversation_participants').delete().eq('conversation_id', convId).eq('user_id', userId);
        else deleteConversationForUser(userId, convId);
    },
    async unhideConversation(userId: string, convId: string) {
        if (isSupabaseConfigured) await supabase.from('conversation_participants').update({ is_hidden: false }).eq('conversation_id', convId).eq('user_id', userId);
    },
    async deleteMessage(messageId: string, senderId: string) {
        if (isSupabaseConfigured) await supabase.from('messages').delete().eq('id', messageId).eq('sender_id', senderId);
    },
  },

  notifications: {
    async get(userId: string) {
        if (!isSupabaseConfigured) return getNotificationsForUser(userId);
        const { data } = await supabase.from('notifications').select('*, profiles!notifications_actor_id_fkey(full_name, avatar_url, username)').eq('user_id', userId).order('created_at', { ascending: false });
        return (data || []).map(n => ({
            id: n.id, userId: n.user_id, actorId: n.actor_id, type: n.type, actorName: (n as any).profiles?.full_name || 'User',
            actorAvatar: (n as any).profiles?.avatar_url || DEFAULT_AVATAR_URL, contentPreview: n.content || '',
            time: new Date(n.created_at).toLocaleDateString(), unread: !n.is_read,
            actorUsername: (n as any).profiles?.username,
        }));
    },
    async markAsRead(userId: string) { if (isSupabaseConfigured) await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId); },
    async delete(id: string) { if (isSupabaseConfigured) await supabase.from('notifications').delete().eq('id', id); },
    async clearAll(userId: string) { if (isSupabaseConfigured) await supabase.from('notifications').delete().eq('user_id', userId); },
    async getUnreadCount(userId: string): Promise<number> {
        if (!isSupabaseConfigured) return 0;
        const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
        return count || 0;
    }
  },

  storage: {
    async uploadImage(bucket: string, file: File): Promise<string> {
        if (!isSupabaseConfigured) return new Promise((r) => { const reader = new FileReader(); reader.onload = (e) => r(e.target?.result as string); reader.readAsDataURL(file); });
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
        if (error) throw new Error(getErrorMessage(error));
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return publicUrl;
    },
    async uploadImageWithPath(bucket: string, file: File): Promise<{ publicUrl: string; path: string }>{
        if (!isSupabaseConfigured) {
          const publicUrl = await new Promise<string>((r) => { const reader = new FileReader(); reader.onload = (e) => r(e.target?.result as string); reader.readAsDataURL(file); });
          return { publicUrl, path: '' };
        }
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage.from(bucket).upload(fileName, file);
        if (error) throw new Error(getErrorMessage(error));
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return { publicUrl, path: fileName };
    }
  },

  admin: {
    async getMetrics(): Promise<Record<string, number>> {
      if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase.rpc('admin_metrics');
      if (error) throw new Error(getErrorMessage(error));
      return data as Record<string, number>;
    },
    async changePasswordWithReauth(currentPassword: string, newPassword: string, email: string): Promise<void> {
      if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
      // Re-authenticate with current credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (signInError) throw new Error('Current password is incorrect.');
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw new Error(getErrorMessage(updateError));
    },
  },

  general: {
    async search(query: string) {
        if (!isSupabaseConfigured) return { users: getAllUsers().filter(u => u.name.toLowerCase().includes(query.toLowerCase())), artworks: [] };
        const { data: users } = await supabase.from('profiles').select('*').or(`full_name.ilike.%${query}%,username.ilike.%${query}%`).limit(10);
        return { users: (users || []).map(u => ({ id: u.id, name: u.full_name, username: u.username, avatar: u.avatar_url || DEFAULT_AVATAR_URL })), artworks: [] } as any;
    }
  }
};
