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
        }
        Relationships: []
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
