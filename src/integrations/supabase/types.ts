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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          assigned_to: string | null
          candidate_id: string
          created_at: string
          created_by: string | null
          id: string
          job_id: string
          notes: string | null
          rejection_reason: string | null
          stage: Database["public"]["Enums"]["application_stage"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          candidate_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          job_id: string
          notes?: string | null
          rejection_reason?: string | null
          stage?: Database["public"]["Enums"]["application_stage"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          candidate_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          rejection_reason?: string | null
          stage?: Database["public"]["Enums"]["application_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          created_at: string
          created_by: string | null
          current_company: string | null
          current_position: string | null
          cv_path: string | null
          cv_url: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          linkedin_url: string | null
          location: string | null
          notes: string | null
          phone: string | null
          skills: string[] | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_company?: string | null
          current_position?: string | null
          cv_path?: string | null
          cv_url?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          linkedin_url?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_company?: string | null
          current_position?: string | null
          cv_path?: string | null
          cv_url?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          linkedin_url?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string
          created_by: string | null
          duration_minutes: number
          feedback: string | null
          id: string
          interviewer_id: string | null
          interviewer_name: string | null
          location: string | null
          meeting_url: string | null
          rating: Database["public"]["Enums"]["feedback_rating"] | null
          scheduled_at: string
          status: Database["public"]["Enums"]["interview_status"]
          type: Database["public"]["Enums"]["interview_type"]
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          feedback?: string | null
          id?: string
          interviewer_id?: string | null
          interviewer_name?: string | null
          location?: string | null
          meeting_url?: string | null
          rating?: Database["public"]["Enums"]["feedback_rating"] | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["interview_status"]
          type?: Database["public"]["Enums"]["interview_type"]
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          feedback?: string | null
          id?: string
          interviewer_id?: string | null
          interviewer_name?: string | null
          location?: string | null
          meeting_url?: string | null
          rating?: Database["public"]["Enums"]["feedback_rating"] | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["interview_status"]
          type?: Database["public"]["Enums"]["interview_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          id: string
          location: string | null
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          location?: string | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          location?: string | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      app_role: "admin" | "recruiter"
      application_stage:
        | "new"
        | "screening"
        | "interview"
        | "offer"
        | "hired"
        | "rejected"
      contract_type:
        | "cdi"
        | "cdd"
        | "stage"
        | "alternance"
        | "freelance"
        | "interim"
      feedback_rating: "strong_no" | "no" | "maybe" | "yes" | "strong_yes"
      interview_status: "scheduled" | "completed" | "cancelled" | "no_show"
      interview_type:
        | "phone"
        | "video"
        | "onsite"
        | "technical"
        | "hr"
        | "final"
      job_status: "draft" | "open" | "on_hold" | "closed"
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
      app_role: ["admin", "recruiter"],
      application_stage: [
        "new",
        "screening",
        "interview",
        "offer",
        "hired",
        "rejected",
      ],
      contract_type: [
        "cdi",
        "cdd",
        "stage",
        "alternance",
        "freelance",
        "interim",
      ],
      feedback_rating: ["strong_no", "no", "maybe", "yes", "strong_yes"],
      interview_status: ["scheduled", "completed", "cancelled", "no_show"],
      interview_type: ["phone", "video", "onsite", "technical", "hr", "final"],
      job_status: ["draft", "open", "on_hold", "closed"],
    },
  },
} as const
