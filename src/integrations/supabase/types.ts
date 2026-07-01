export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      book_annotations: {
        Row: {
          annotation_type: string
          book_id: string
          chapter: string | null
          color: string | null
          content: string
          created_at: string | null
          id: string
          is_favorite: boolean | null
          page_number: number | null
          sentiment: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annotation_type?: string
          book_id: string
          chapter?: string | null
          color?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          page_number?: number | null
          sentiment?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annotation_type?: string
          book_id?: string
          chapter?: string | null
          color?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          page_number?: number | null
          sentiment?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      book_audit_log: {
        Row: {
          action: string
          book_id: string
          book_title: string | null
          changes: Json | null
          created_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          book_id: string
          book_title?: string | null
          changes?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          book_id?: string
          book_title?: string | null
          changes?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          favorite_genres: string[] | null
          id: string
          preferred_reading_time: string | null
          reading_goal: number | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          favorite_genres?: string[] | null
          id?: string
          preferred_reading_time?: string | null
          reading_goal?: number | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          favorite_genres?: string[] | null
          id?: string
          preferred_reading_time?: string | null
          reading_goal?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      reading_list_items: {
        Row: {
          added_at: string | null
          book_id: string
          id: string
          list_id: string
          notes: string | null
          sort_order: number | null
        }
        Insert: {
          added_at?: string | null
          book_id: string
          id?: string
          list_id: string
          notes?: string | null
          sort_order?: number | null
        }
        Update: {
          added_at?: string | null
          book_id?: string
          id?: string
          list_id?: string
          notes?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "reading_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_lists: {
        Row: {
          cover_color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_public: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reading_sessions: {
        Row: {
          book_id: string
          created_at: string | null
          duration_minutes: number
          id: string
          notes: string | null
          pages_read: number | null
          session_date: string | null
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          duration_minutes: number
          id?: string
          notes?: string | null
          pages_read?: number | null
          session_date?: string | null
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          pages_read?: number | null
          session_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_books: {
        Row: {
          authors: string[] | null
          average_rating: number | null
          book_id: string
          categories: string[] | null
          created_at: string | null
          current_page: number | null
          date_added: string | null
          date_finished: string | null
          date_started: string | null
          description: string | null
          id: string
          info_link: string | null
          language: string | null
          my_thoughts: string | null
          notes: string | null
          page_count: number | null
          personal_rating: number | null
          preview_link: string | null
          published_date: string | null
          publisher: string | null
          ratings_count: number | null
          reading_progress: number | null
          reading_status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          time_spent_reading: number | null
          title: string
          updated_at: string | null
          user_id: string
          vault_id: string | null
        }
        Insert: {
          authors?: string[] | null
          average_rating?: number | null
          book_id: string
          categories?: string[] | null
          created_at?: string | null
          current_page?: number | null
          date_added?: string | null
          date_finished?: string | null
          date_started?: string | null
          description?: string | null
          id?: string
          info_link?: string | null
          language?: string | null
          my_thoughts?: string | null
          notes?: string | null
          page_count?: number | null
          personal_rating?: number | null
          preview_link?: string | null
          published_date?: string | null
          publisher?: string | null
          ratings_count?: number | null
          reading_progress?: number | null
          reading_status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          time_spent_reading?: number | null
          title: string
          updated_at?: string | null
          user_id: string
          vault_id?: string | null
        }
        Update: {
          authors?: string[] | null
          average_rating?: number | null
          book_id?: string
          categories?: string[] | null
          created_at?: string | null
          current_page?: number | null
          date_added?: string | null
          date_finished?: string | null
          date_started?: string | null
          description?: string | null
          id?: string
          info_link?: string | null
          language?: string | null
          my_thoughts?: string | null
          notes?: string | null
          page_count?: number | null
          personal_rating?: number | null
          preview_link?: string | null
          published_date?: string | null
          publisher?: string | null
          ratings_count?: number | null
          reading_progress?: number | null
          reading_status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          time_spent_reading?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
          vault_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_books_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vaults: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
