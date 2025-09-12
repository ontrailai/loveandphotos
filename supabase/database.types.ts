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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      availability: {
        Row: {
          created_at: string | null
          date: string
          id: string
          is_available: boolean | null
          notes: string | null
          photographer_id: string
          time_slots: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          photographer_id: string
          time_slots?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          photographer_id?: string
          time_slots?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_status: Database["public"]["Enums"]["booking_status"] | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          contract_signed_at: string | null
          contract_url: string | null
          created_at: string | null
          customer_id: string
          deposit_amount: number | null
          event_date: string
          event_end_time: string | null
          event_time: string
          event_type: string | null
          final_amount: number | null
          guest_count: number | null
          id: string
          overtime_hours: number | null
          package_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          personalization_data: Json | null
          photographer_id: string
          special_requests: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total_amount: number
          updated_at: string | null
          venue_address: Json | null
          venue_name: string | null
        }
        Insert: {
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contract_signed_at?: string | null
          contract_url?: string | null
          created_at?: string | null
          customer_id: string
          deposit_amount?: number | null
          event_date: string
          event_end_time?: string | null
          event_time: string
          event_type?: string | null
          final_amount?: number | null
          guest_count?: number | null
          id?: string
          overtime_hours?: number | null
          package_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          personalization_data?: Json | null
          photographer_id: string
          special_requests?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string | null
          venue_address?: Json | null
          venue_name?: string | null
        }
        Update: {
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contract_signed_at?: string | null
          contract_url?: string | null
          created_at?: string | null
          customer_id?: string
          deposit_amount?: number | null
          event_date?: string
          event_end_time?: string | null
          event_time?: string
          event_type?: string | null
          final_amount?: number | null
          guest_count?: number | null
          id?: string
          overtime_hours?: number | null
          package_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          personalization_data?: Json | null
          photographer_id?: string
          special_requests?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount?: number
          updated_at?: string | null
          venue_address?: Json | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          event_type: string | null
          first_name: string
          id: string
          last_name: string
          message: string
          notes: string | null
          phone: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_type?: string | null
          first_name: string
          id?: string
          last_name: string
          message: string
          notes?: string | null
          phone?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_type?: string | null
          first_name?: string
          id?: string
          last_name?: string
          message?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
        }
        Relationships: []
      }
      job_queue: {
        Row: {
          booking_id: string
          created_at: string | null
          customer_approved: boolean | null
          deadline: string | null
          delivered_at: string | null
          delivery_password: string | null
          delivery_url: string | null
          files_uploaded: Json | null
          id: string
          notes: string | null
          overtime_approved: boolean | null
          overtime_logged: number | null
          photographer_id: string
          updated_at: string | null
          upload_status: Database["public"]["Enums"]["upload_status"] | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          customer_approved?: boolean | null
          deadline?: string | null
          delivered_at?: string | null
          delivery_password?: string | null
          delivery_url?: string | null
          files_uploaded?: Json | null
          id?: string
          notes?: string | null
          overtime_approved?: boolean | null
          overtime_logged?: number | null
          photographer_id: string
          updated_at?: string | null
          upload_status?: Database["public"]["Enums"]["upload_status"] | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          customer_approved?: boolean | null
          deadline?: string | null
          delivered_at?: string | null
          delivery_password?: string | null
          delivery_url?: string | null
          files_uploaded?: Json | null
          id?: string
          notes?: string | null
          overtime_approved?: boolean | null
          overtime_logged?: number | null
          photographer_id?: string
          updated_at?: string | null
          upload_status?: Database["public"]["Enums"]["upload_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "job_queue_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_queue_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          booking_id: string | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          parent_message_id: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          attachments?: Json | null
          booking_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          parent_message_id?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          attachments?: Json | null
          booking_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          parent_message_id?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          base_price: number
          booking_count: number | null
          created_at: string | null
          deliverables: Json | null
          description: string | null
          duration_minutes: number
          id: string
          includes: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          max_guests: number | null
          photographer_id: string | null
          title: string
          updated_at: string | null
          upsells: Json | null
        }
        Insert: {
          base_price: number
          booking_count?: number | null
          created_at?: string | null
          deliverables?: Json | null
          description?: string | null
          duration_minutes: number
          id?: string
          includes?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_guests?: number | null
          photographer_id?: string | null
          title: string
          updated_at?: string | null
          upsells?: Json | null
        }
        Update: {
          base_price?: number
          booking_count?: number | null
          created_at?: string | null
          deliverables?: Json | null
          description?: string | null
          duration_minutes?: number
          id?: string
          includes?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_guests?: number | null
          photographer_id?: string | null
          title?: string
          updated_at?: string | null
          upsells?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_tiers: {
        Row: {
          badge_color: string | null
          commission_percentage: number | null
          created_at: string | null
          hourly_rate: number
          id: number
          min_jobs_required: number | null
          name: string
          perks: string[] | null
        }
        Insert: {
          badge_color?: string | null
          commission_percentage?: number | null
          created_at?: string | null
          hourly_rate: number
          id?: number
          min_jobs_required?: number | null
          name: string
          perks?: string[] | null
        }
        Update: {
          badge_color?: string | null
          commission_percentage?: number | null
          created_at?: string | null
          hourly_rate?: number
          id?: number
          min_jobs_required?: number | null
          name?: string
          perks?: string[] | null
        }
        Relationships: []
      }
      photographers: {
        Row: {
          average_rating: number | null
          bio: string | null
          camera_type: string[] | null
          cancellation_rate: number | null
          completed_jobs_count: number | null
          created_at: string | null
          equipment_list: Json | null
          experience_years: number | null
          id: string
          instagram_handle: string | null
          is_public: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          pay_tier_id: number | null
          portfolio_url: string | null
          response_time_hours: number | null
          specialties: string[] | null
          stripe_account_id: string | null
          total_reviews: number | null
          travel_radius_miles: number | null
          trust_badges: string[] | null
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          average_rating?: number | null
          bio?: string | null
          camera_type?: string[] | null
          cancellation_rate?: number | null
          completed_jobs_count?: number | null
          created_at?: string | null
          equipment_list?: Json | null
          experience_years?: number | null
          id?: string
          instagram_handle?: string | null
          is_public?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          pay_tier_id?: number | null
          portfolio_url?: string | null
          response_time_hours?: number | null
          specialties?: string[] | null
          stripe_account_id?: string | null
          total_reviews?: number | null
          travel_radius_miles?: number | null
          trust_badges?: string[] | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          average_rating?: number | null
          bio?: string | null
          camera_type?: string[] | null
          cancellation_rate?: number | null
          completed_jobs_count?: number | null
          created_at?: string | null
          equipment_list?: Json | null
          experience_years?: number | null
          id?: string
          instagram_handle?: string | null
          is_public?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          pay_tier_id?: number | null
          portfolio_url?: string | null
          response_time_hours?: number | null
          specialties?: string[] | null
          stripe_account_id?: string | null
          total_reviews?: number | null
          travel_radius_miles?: number | null
          trust_badges?: string[] | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photographers_pay_tier_id_fkey"
            columns: ["pay_tier_id"]
            isOneToOne: false
            referencedRelation: "pay_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photographers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          is_featured: boolean | null
          like_count: number | null
          metadata: Json | null
          order_index: number | null
          photographer_id: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_featured?: boolean | null
          like_count?: number | null
          metadata?: Json | null
          order_index?: number | null
          photographer_id: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_featured?: boolean | null
          like_count?: number | null
          metadata?: Json | null
          order_index?: number | null
          photographer_id?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          is_featured: boolean | null
          is_verified: boolean | null
          photographer_id: string
          photos: string[] | null
          rating: number
          response: string | null
          response_at: string | null
          reviewer_id: string
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          photographer_id: string
          photos?: string[] | null
          rating: number
          response?: string | null
          response_at?: string | null
          reviewer_id: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          photographer_id?: string
          photos?: string[] | null
          rating?: number
          response?: string | null
          response_at?: string | null
          reviewer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_modules: {
        Row: {
          category: string | null
          content_url: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_required: boolean | null
          order_index: number
          passing_score: number | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_required?: boolean | null
          order_index: number
          passing_score?: number | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_required?: boolean | null
          order_index?: number
          passing_score?: number | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      training_status: {
        Row: {
          attempts: number | null
          completed_at: string | null
          id: string
          is_complete: boolean | null
          module_id: string
          score: number | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          id?: string
          is_complete?: boolean | null
          module_id: string
          score?: number | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          id?: string
          is_complete?: boolean | null
          module_id?: string
          score?: number | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_status_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          metadata?: Json | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      payment_status: "pending" | "paid" | "refunded" | "failed"
      upload_status: "pending" | "in_progress" | "completed" | "approved"
      user_role: "customer" | "photographer" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      payment_status: ["pending", "paid", "refunded", "failed"],
      upload_status: ["pending", "in_progress", "completed", "approved"],
      user_role: ["customer", "photographer", "admin"],
    },
  },
} as const
