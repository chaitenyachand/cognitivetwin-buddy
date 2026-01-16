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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string | null
          id: string
          topic_id: string | null
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          created_at?: string | null
          id?: string
          topic_id?: string | null
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string | null
          id?: string
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          challenge_type: string
          description: string
          id: string
          requirement_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          challenge_date?: string
          challenge_type: string
          description: string
          id?: string
          requirement_value?: number
          title: string
          xp_reward?: number
        }
        Update: {
          challenge_date?: string
          challenge_type?: string
          description?: string
          id?: string
          requirement_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          created_at: string
          flashcard_json: Json
          id: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          flashcard_json?: Json
          id?: string
          topic_id: string
        }
        Update: {
          created_at?: string
          flashcard_json?: Json
          id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_cache: {
        Row: {
          current_level: number
          current_streak: number
          display_name: string
          id: string
          rank: number | null
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_level?: number
          current_streak?: number
          display_name: string
          id?: string
          rank?: number | null
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_level?: number
          current_streak?: number
          display_name?: string
          id?: string
          rank?: number | null
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_sessions: {
        Row: {
          completed: boolean | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          session_type: string
          topic_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          session_type: string
          topic_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          session_type?: string
          topic_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          material_type: string
          topic_id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          material_type: string
          topic_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          material_type?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      mindmaps: {
        Row: {
          created_at: string
          edges_json: Json
          id: string
          nodes_json: Json
          topic_id: string
        }
        Insert: {
          created_at?: string
          edges_json?: Json
          id?: string
          nodes_json?: Json
          topic_id: string
        }
        Update: {
          created_at?: string
          edges_json?: Json
          id?: string
          nodes_json?: Json
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mindmaps_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      partial_transcripts: {
        Row: {
          created_at: string
          id: string
          session_id: string
          speaker: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          speaker: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          speaker?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "partial_transcripts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "voice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          created_at: string
          id: string
          recommendations: string | null
          score: number
          topic_id: string
          user_id: string
          weak_areas: string[] | null
        }
        Insert: {
          created_at?: string
          id?: string
          recommendations?: string | null
          score: number
          topic_id: string
          user_id: string
          weak_areas?: string[] | null
        }
        Update: {
          created_at?: string
          id?: string
          recommendations?: string | null
          score?: number
          topic_id?: string
          user_id?: string
          weak_areas?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_notes: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          likes_count: number
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          likes_count?: number
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          likes_count?: number
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_notes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_notes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      spaced_repetition_cards: {
        Row: {
          card_back: string
          card_front: string
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_reviewed_at: string | null
          next_review_date: string
          repetitions: number
          topic_id: string
          user_id: string
        }
        Insert: {
          card_back: string
          card_front: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_date?: string
          repetitions?: number
          topic_id: string
          user_id: string
        }
        Update: {
          card_back?: string
          card_front?: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_date?: string
          repetitions?: number
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaced_repetition_cards_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          invite_code: string
          is_public: boolean
          max_members: number
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          invite_code: string
          is_public?: boolean
          max_members?: number
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string
          is_public?: boolean
          max_members?: number
          name?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          ai_recommendations: Json | null
          created_at: string
          daily_study_minutes: number
          goal_description: string
          id: string
          status: string
          target_date: string | null
          topics_to_cover: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_recommendations?: Json | null
          created_at?: string
          daily_study_minutes?: number
          goal_description: string
          id?: string
          status?: string
          target_date?: string | null
          topics_to_cover?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_recommendations?: Json | null
          created_at?: string
          daily_study_minutes?: number
          goal_description?: string
          id?: string
          status?: string
          target_date?: string | null
          topics_to_cover?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          duration_seconds: number
          ended_at: string | null
          id: string
          session_type: string
          started_at: string
          topic_id: string | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          session_type?: string
          started_at?: string
          topic_id?: string | null
          user_id: string
          xp_earned?: number
        }
        Update: {
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          session_type?: string
          started_at?: string
          topic_id?: string | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          best_score: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          progress: number | null
          summary: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          best_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          progress?: number | null
          summary?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          best_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          progress?: number | null
          summary?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_challenges: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          id: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          created_at: string
          daily_goal_minutes: number | null
          id: string
          interests: string[] | null
          learning_style: string | null
          onboarding_completed: boolean
          preferred_study_time: string | null
          step_completed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_goal_minutes?: number | null
          id?: string
          interests?: string[] | null
          learning_style?: string | null
          onboarding_completed?: boolean
          preferred_study_time?: string | null
          step_completed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_goal_minutes?: number | null
          id?: string
          interests?: string[] | null
          learning_style?: string | null
          onboarding_completed?: boolean
          preferred_study_time?: string | null
          step_completed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string
          current_level: number
          current_streak: number
          daily_goal_minutes: number
          daily_goal_progress: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          total_flashcards_reviewed: number
          total_quizzes_completed: number
          total_study_time_minutes: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: number
          current_streak?: number
          daily_goal_minutes?: number
          daily_goal_progress?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          total_flashcards_reviewed?: number
          total_quizzes_completed?: number
          total_study_time_minutes?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: number
          current_streak?: number
          daily_goal_minutes?: number
          daily_goal_progress?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          total_flashcards_reviewed?: number
          total_quizzes_completed?: number
          total_study_time_minutes?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      voice_sessions: {
        Row: {
          ended_at: string | null
          id: string
          persona: string | null
          started_at: string
          topic: string
          user_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          persona?: string | null
          started_at?: string
          topic: string
          user_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          persona?: string | null
          started_at?: string
          topic?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weak_topics: {
        Row: {
          addressed: boolean | null
          created_at: string
          id: string
          identified_from: string
          notes: string | null
          score: number | null
          topic_id: string | null
          topic_name: string
          user_id: string
          weak_area: string
        }
        Insert: {
          addressed?: boolean | null
          created_at?: string
          id?: string
          identified_from: string
          notes?: string | null
          score?: number | null
          topic_id?: string | null
          topic_name: string
          user_id: string
          weak_area: string
        }
        Update: {
          addressed?: boolean | null
          created_at?: string
          id?: string
          identified_from?: string
          notes?: string | null
          score?: number | null
          topic_id?: string | null
          topic_name?: string
          user_id?: string
          weak_area?: string
        }
        Relationships: [
          {
            foreignKeyName: "weak_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
