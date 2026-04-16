
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          cover_image: string | null
          bio: string | null
          role: 'artist' | 'artLover'
          location: string | null
          website: string | null
          commission_status: 'Open' | 'Closed' | 'Not Available' | null
          updated_at: string | null
          created_at: string
          is_admin: boolean | null
        }
        Insert: {
          id: string
          email?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          cover_image?: string | null
          bio?: string | null
          role?: 'artist' | 'artLover'
          location?: string | null
          website?: string | null
          commission_status?: 'Open' | 'Closed' | 'Not Available' | null
          updated_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          cover_image?: string | null
          bio?: string | null
          role?: 'artist' | 'artLover'
          location?: string | null
          website?: string | null
          commission_status?: 'Open' | 'Closed' | 'Not Available' | null
          updated_at?: string | null
          created_at?: string
        }
      }
      artworks: {
        Row: {
          id: string
          artist_id: string
          title: string
          description: string | null
          image_url: string
          tags: string[]
          likes_count: number
          created_at: string
          // Pricing & marketplace columns
          price: number | null
          is_price_visible: boolean | null
          listed_for_sale: boolean
          list_price: number | null
          listing_status: 'active' | 'sold' | null
          sold_at: string | null
        }
        Insert: {
          id?: string
          artist_id: string
          title: string
          description?: string | null
          image_url: string
          tags?: string[]
          likes_count?: number
          created_at?: string
          price?: number | null
          is_price_visible?: boolean | null
          listed_for_sale?: boolean
          list_price?: number | null
          listing_status?: 'active' | 'sold' | null
          sold_at?: string | null
        }
        Update: {
          id?: string
          artist_id?: string
          title?: string
          description?: string | null
          image_url?: string
          tags?: string[]
          likes_count?: number
          created_at?: string
          price?: number | null
          is_price_visible?: boolean | null
          listed_for_sale?: boolean
          list_price?: number | null
          listing_status?: 'active' | 'sold' | null
          sold_at?: string | null
        }
      }
      social_posts: {
        Row: {
          id: string
          author_id: string
          content: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          author_id: string
          content?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          content?: string | null
          image_url?: string | null
          created_at?: string
        }
      }
      social_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          artwork_id: string | null
          post_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          artwork_id?: string | null
          post_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          artwork_id?: string | null
          post_id?: string | null
          created_at?: string
        }
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
          status: 'pending' | 'accepted'
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
          status?: 'pending' | 'accepted'
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string
          status?: 'pending' | 'accepted'
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string
          type: 'like' | 'comment' | 'follow' | 'connect_request' | 'message'
          content: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id: string
          type: 'like' | 'comment' | 'follow' | 'connect_request' | 'message'
          content?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          actor_id?: string
          type?: 'like' | 'comment' | 'follow' | 'connect_request' | 'message'
          content?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
        }
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          user_id: string
          created_at: string
          is_hidden: boolean
        }
        Insert: {
          conversation_id: string
          user_id: string
          created_at?: string
          is_hidden?: boolean
        }
        Update: {
          conversation_id?: string
          user_id?: string
          created_at?: string
          is_hidden?: boolean
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}