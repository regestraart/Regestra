import { supabase } from '../lib/supabase';
import { UserPreferences } from '../components/OnboardingQuiz';

export interface RecommendedArtist {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  artworkCount: number;
  matchScore: number;
  matchReason?: string;
  sampleImages: string[];
}

export interface RecommendedArtwork {
  id: string;
  title: string;
  image_url: string;
  artist_name: string;
  artist_id: string;
  tags: string[];
  matchReason?: string;
}

export const recommendationService = {

  // Record a user interaction for learning
  async recordInteraction(
    userId: string,
    artworkId: string,
    artworkTags: string[],
    action: 'like' | 'view' | 'skip' | 'connect' | 'save',
    durationMs?: number
  ): Promise<void> {
    try {
      await supabase.from('artwork_interactions').insert({
        user_id: userId,
        artwork_id: artworkId,
        artwork_tags: artworkTags,
        action,
        duration_ms: durationMs ?? null,
      });
    } catch { /* non-fatal */ }
  },

  // Build enriched preference profile from static prefs + interactions
  async buildPreferenceProfile(userId: string): Promise<{
    tags: string[];
    boostedTags: string[];
    preferences: UserPreferences | null;
  }> {
    try {
      // Get static preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      const prefs = profile?.preferences as UserPreferences | null;
      const staticTags = [
        ...(prefs?.styles ?? []),
        ...(prefs?.themes ?? []),
        prefs?.vibe ? [prefs.vibe] : [],
      ];

      // Get interaction-based tag boosts (last 30 days)
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: interactions } = await supabase
        .from('artwork_interactions')
        .select('artwork_tags, action')
        .eq('user_id', userId)
        .in('action', ['like', 'save', 'connect'])
        .gte('created_at', since);

      // Weight positive interactions
      const tagCounts: Record<string, number> = {};
      for (const interaction of interactions ?? []) {
        const weight = interaction.action === 'like' ? 2 : interaction.action === 'save' ? 3 : 1;
        for (const tag of interaction.artwork_tags ?? []) {
          tagCounts[tag] = (tagCounts[tag] || 0) + weight;
        }
      }

      const boostedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);

      return {
        tags: [...new Set([...staticTags, ...boostedTags])],
        boostedTags,
        preferences: prefs,
      };
    } catch {
      return { tags: [], boostedTags: [], preferences: null };
    }
  },

  // Step 1: Tag-based matching (fast)
  async getTagMatchedArtists(userId: string, limit = 20): Promise<Array<{ artist_id: string; match_score: number }>> {
    try {
      const { data, error } = await supabase.rpc('get_tag_matched_artists', {
        p_user_id: userId,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as Array<{ artist_id: string; match_score: number }>;
    } catch {
      return [];
    }
  },

  // Step 2: Gemini AI re-ranking
  async geminiRerank(
    userId: string,
    candidates: Array<{ artist_id: string; name: string; tags: string[]; bio?: string }>,
    preferences: UserPreferences | null
  ): Promise<Array<{ artist_id: string; reason: string; score: number }>> {
    if (!candidates.length || !preferences) return [];

    try {
      const prompt = `You are an art recommendation engine for Regestra, an art community platform.

User's taste profile:
- Art styles they like: ${preferences.styles?.join(', ') || 'not specified'}
- Themes they're drawn to: ${preferences.themes?.join(', ') || 'not specified'}
- Aesthetic vibe: ${preferences.vibe || 'not specified'}
- Why they're here: ${preferences.intent?.join(', ') || 'not specified'}

Here are ${candidates.length} artist candidates with their tags and bio:
${candidates.map((c, i) => `${i + 1}. Artist ID: ${c.artist_id} | Name: ${c.name} | Tags: ${c.tags.join(', ')} | Bio: ${c.bio || 'No bio'}`).join('\n')}

Rank these artists by how well they match the user's taste. For each, provide:
- artist_id
- score (0-100)
- reason (one short sentence explaining the match, written for the user, e.g. "Creates bold abstract work that matches your love of color")

Respond ONLY with a JSON array. No markdown, no explanation outside the JSON.
Example: [{"artist_id":"abc","score":85,"reason":"Their urban photography matches your city themes"}]`;

      const response = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'recommend', prompt }),
      });

      if (!response.ok) throw new Error('Gemini proxy failed');
      const data = await response.json();

      // Extract text from Gemini response
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const ranked = JSON.parse(clean);
      return Array.isArray(ranked) ? ranked : [];
    } catch {
      return [];
    }
  },

  // Full recommendation pipeline
  async getRecommendations(userId: string): Promise<{
    artists: RecommendedArtist[];
    artworks: RecommendedArtwork[];
    fromCache: boolean;
  }> {
    // Check cache first (valid for 6 hours)
    try {
      const { data: cache } = await supabase
        .from('recommendation_cache')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (cache?.recommended_artist_ids?.length > 0) {
        const artists = await this.hydrateArtists(cache.recommended_artist_ids, cache.reasoning);
        const artworks = await this.getRecommendedArtworks(userId, cache.recommended_artist_ids);
        return { artists, artworks, fromCache: true };
      }
    } catch { /* ignore cache errors */ }

    // Build fresh recommendations
    const { tags, preferences } = await this.buildPreferenceProfile(userId);

    // Step 1: Tag matching
    const tagMatches = await this.getTagMatchedArtists(userId, 30);
    if (!tagMatches.length) {
      return { artists: [], artworks: [], fromCache: false };
    }

    // Step 2: Hydrate artists for Gemini
    const artistIds = tagMatches.map(m => m.artist_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, bio')
      .in('id', artistIds);

    // Get tags for each artist from their artworks
    const { data: artworkData } = await supabase
      .from('artworks')
      .select('artist_id, tags')
      .in('artist_id', artistIds)
      .eq('profile_visible', true);

    const artistTagMap: Record<string, Set<string>> = {};
    for (const aw of artworkData ?? []) {
      if (!artistTagMap[aw.artist_id]) artistTagMap[aw.artist_id] = new Set();
      for (const tag of aw.tags ?? []) artistTagMap[aw.artist_id].add(tag);
    }

    const candidates = (profiles ?? []).map((p: any) => ({
      artist_id: p.id,
      name: p.full_name || p.username,
      tags: Array.from(artistTagMap[p.id] ?? []),
      bio: p.bio,
    }));

    // Step 3: Gemini re-ranking
    const ranked = await this.geminiRerank(userId, candidates, preferences);

    // Merge scores
    const finalOrder = ranked.length > 0
      ? ranked.sort((a, b) => b.score - a.score).map(r => r.artist_id)
      : artistIds;

    const reasoningMap: Record<string, string> = {};
    for (const r of ranked) reasoningMap[r.artist_id] = r.reason;

    // Save to cache
    try {
      await supabase.from('recommendation_cache').upsert({
        user_id: userId,
        recommended_artist_ids: finalOrder.slice(0, 20),
        reasoning: ranked,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'user_id' });
    } catch { /* non-fatal */ }

    const artists = await this.hydrateArtists(finalOrder.slice(0, 10), ranked);
    const artworks = await this.getRecommendedArtworks(userId, finalOrder.slice(0, 10));

    return { artists, artworks, fromCache: false };
  },

  async hydrateArtists(
    artistIds: string[],
    reasoning: Array<{ artist_id: string; reason: string }> = []
  ): Promise<RecommendedArtist[]> {
    if (!artistIds.length) return [];

    const reasonMap: Record<string, string> = {};
    for (const r of reasoning) reasonMap[r.artist_id] = r.reason;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, bio')
      .in('id', artistIds);

    const { data: artworks } = await supabase
      .from('artworks')
      .select('artist_id, image_url')
      .in('artist_id', artistIds)
      .eq('profile_visible', true)
      .order('created_at', { ascending: false });

    const artworkMap: Record<string, string[]> = {};
    const countMap: Record<string, number> = {};
    for (const aw of artworks ?? []) {
      if (!artworkMap[aw.artist_id]) artworkMap[aw.artist_id] = [];
      if (artworkMap[aw.artist_id].length < 3) artworkMap[aw.artist_id].push(aw.image_url);
      countMap[aw.artist_id] = (countMap[aw.artist_id] || 0) + 1;
    }

    return artistIds
      .map(id => {
        const p = (profiles ?? []).find((p: any) => p.id === id);
        if (!p) return null;
        return {
          id: p.id,
          name: p.full_name || p.username,
          username: p.username,
          avatar_url: p.avatar_url,
          bio: p.bio,
          artworkCount: countMap[id] || 0,
          matchScore: 0,
          matchReason: reasonMap[id],
          sampleImages: artworkMap[id] || [],
        } as RecommendedArtist;
      })
      .filter(Boolean) as RecommendedArtist[];
  },

  async getRecommendedArtworks(userId: string, artistIds: string[]): Promise<RecommendedArtwork[]> {
    if (!artistIds.length) return [];
    const { data } = await supabase
      .from('artworks')
      .select('id, title, image_url, artist_id, tags')
      .in('artist_id', artistIds)
      .eq('profile_visible', true)
      .order('created_at', { ascending: false })
      .limit(20);

    return (data ?? []).map((aw: any) => ({
      id: aw.id,
      title: aw.title,
      image_url: aw.image_url,
      artist_name: '',
      artist_id: aw.artist_id,
      tags: aw.tags || [],
    }));
  },

  // Invalidate cache when preferences change
  async invalidateCache(userId: string): Promise<void> {
    try {
      await supabase.from('recommendation_cache').delete().eq('user_id', userId);
    } catch { /* non-fatal */ }
  },
};
