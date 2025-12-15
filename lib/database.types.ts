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
      users: {
        Row: {
          id: string
          name: string
          email: string
          password: string
          role: 'user' | 'admin' | 'seller'
          phone: string | null
          avatar: string | null
          gender: 'male' | 'female' | 'other' | null
          date_of_birth: string | null
          full_address: string | null
          reset_password_token: string | null
          reset_password_expires: string | null
          last_login_activity: string | null
          loyalty_points: number
          membership_tier: 'Bronze' | 'Silver' | 'Titanium' | 'Gold' | 'Platinum' | 'Diamond'
          tier_achieved_at: string | null
          notification_settings: Json
          privacy_settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          password: string
          role?: 'user' | 'admin' | 'seller'
          phone?: string | null
          avatar?: string | null
          gender?: 'male' | 'female' | 'other' | null
          date_of_birth?: string | null
          full_address?: string | null
          reset_password_token?: string | null
          reset_password_expires?: string | null
          last_login_activity?: string | null
          loyalty_points?: number
          membership_tier?: 'Bronze' | 'Silver' | 'Titanium' | 'Gold' | 'Platinum' | 'Diamond'
          tier_achieved_at?: string | null
          notification_settings?: Json
          privacy_settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password?: string
          role?: 'user' | 'admin' | 'seller'
          phone?: string | null
          avatar?: string | null
          gender?: 'male' | 'female' | 'other' | null
          date_of_birth?: string | null
          full_address?: string | null
          reset_password_token?: string | null
          reset_password_expires?: string | null
          last_login_activity?: string | null
          loyalty_points?: number
          membership_tier?: 'Bronze' | 'Silver' | 'Titanium' | 'Gold' | 'Platinum' | 'Diamond'
          tier_achieved_at?: string | null
          notification_settings?: Json
          privacy_settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          regular_price: number
          discount_price: number | null
          cogs: number
          description: string | null
          category: string | null
          brand: string | null
          images: string[]
          available_sizes: string[]
          available_colors: string[]
          total_stock: number
          specifications: Json | null
          is_active: boolean
          featured: boolean
          price: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          regular_price: number
          discount_price?: number | null
          cogs?: number
          description?: string | null
          category?: string | null
          brand?: string | null
          images?: string[]
          available_sizes?: string[]
          available_colors?: string[]
          total_stock?: number
          specifications?: Json | null
          is_active?: boolean
          featured?: boolean
          price?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          regular_price?: number
          discount_price?: number | null
          cogs?: number
          description?: string | null
          category?: string | null
          brand?: string | null
          images?: string[]
          available_sizes?: string[]
          available_colors?: string[]
          total_stock?: number
          specifications?: Json | null
          is_active?: boolean
          featured?: boolean
          price?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          order_number: string | null
          items: Json
          total: number | null
          total_amount: number | null
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
          is_paid: boolean
          paid_at: string | null
          payment_method: string
          cancel_request: Json | null
          return_request: Json | null
          shipping_address: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          order_number?: string | null
          items: Json
          total?: number | null
          total_amount?: number | null
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
          is_paid?: boolean
          paid_at?: string | null
          payment_method?: string
          cancel_request?: Json | null
          return_request?: Json | null
          shipping_address?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          order_number?: string | null
          items?: Json
          total?: number | null
          total_amount?: number | null
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
          is_paid?: boolean
          paid_at?: string | null
          payment_method?: string
          cancel_request?: Json | null
          return_request?: Json | null
          shipping_address?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subcategories: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          type: 'Home' | 'Office' | 'Shipping'
          name: string
          phone: string
          street: string
          city: string
          state: string | null
          postal_code: string
          country: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: 'Home' | 'Office' | 'Shipping'
          name: string
          phone: string
          street: string
          city: string
          state?: string | null
          postal_code: string
          country?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'Home' | 'Office' | 'Shipping'
          name?: string
          phone?: string
          street?: string
          city?: string
          state?: string | null
          postal_code?: string
          country?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          type: 'order' | 'support' | 'profile' | 'promotion' | 'app' | 'broadcast'
          category: string
          title: string
          message: string
          data: Json | null
          is_read: boolean
          read_at: string | null
          action_url: string | null
          icon: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          type: 'order' | 'support' | 'profile' | 'promotion' | 'app' | 'broadcast'
          category: string
          title: string
          message: string
          data?: Json | null
          is_read?: boolean
          read_at?: string | null
          action_url?: string | null
          icon?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: 'order' | 'support' | 'profile' | 'promotion' | 'app' | 'broadcast'
          category?: string
          title?: string
          message?: string
          data?: Json | null
          is_read?: boolean
          read_at?: string | null
          action_url?: string | null
          icon?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          created_at?: string
          updated_at?: string
        }
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          added_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          added_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          added_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
