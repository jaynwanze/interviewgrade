export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      account_delete_tokens: {
        Row: {
          token: string
          user_id: string
        }
        Insert: {
          token?: string
          user_id: string
        }
        Update: {
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_delete_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          user_type: Database["public"]["Enums"]["user_types"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          user_type?: Database["public"]["Enums"]["user_types"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          user_type?: Database["public"]["Enums"]["user_types"]
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          id: string
          token_id: string
        }
        Insert: {
          id: string
          token_id: string
        }
        Update: {
          id?: string
          token_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "account_delete_tokens"
            referencedColumns: ["token"]
          },
        ]
      }
      products: {
        Row: {
          id: string
          product_type: Database["public"]["Enums"]["product_type"]
          title: string | null
          description: string | null
          price: number | null
          status: Database["public"]["Enums"]["product_status"]
          tokens: number | null
          subscription_duration: string | null
        }
        Insert: {
          id: string
          product_type: Database["public"]["Enums"]["product_type"]
          title?: string | null
          description?: string | null
          price?: number | null
          status: Database["public"]["Enums"]["product_status"]
          tokens?: number | null
          subscription_duration?: string | null
        }
        Update: {
          id?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          title?: string | null
          description?: string | null
          price?: number | null
          status?: Database["public"]["Enums"]["product_status"]
          tokens?: number | null
          subscription_duration?: string | null
        }
      }
      tokens: {
        Row: {
          id: string
          tokens_available: string
          total_tokens_used: string | null
          total_tokens_purchased: string | null
          last_token_purchase_date: string | null
        }
        Insert: {
          id: string
          tokens_available: string
          total_tokens_used?: string | null
          total_tokens_purchased?: string | null
          last_token_purchase_date?: string | null
        }
        Update: {
          id?: string
          tokens_available?: string
          total_tokens_used?: string | null
          total_tokens_purchased?: string | null
          last_token_purchase_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          id: string
          template_id: string
          candidate_id: string
          title: string
          description: string
          start_time: string
          end_time: string
          status: Database["public"]["Enums"]["interview_status"]
        }
        Insert: {
          id: string
          template_id: string
          candidate_id: string
          title: string
          description?: string
          start_time: string
          end_time?: string
          status: Database["public"]["Enums"]["interview_status"]
        }
        Update: {
          id?: string
          template_id?: string
          candidate_id?: string
          title?: string
          description?: string
          start_time?: string
          end_time?: string
          status?: Database["public"]["Enums"]["interview_status"]
        }
      }
      //interview evals,feedbacks and analytics
      templates: {
        Row: {
          id: string
          user_id: string
          category: Database["public"]["Enums"]["template_category"]
          title: string
          role: string
          description: string
          duration: number
          difficulty: Database["public"]["Enums"]["template_difficulty"]
          questions_count: number;
          company: string
          is_company_specific: boolean
          is_industry_specific: boolean
          is_general: boolean
          is_system_defined: boolean
          created_at: string
          }
        Insert: {
          id: string
          user_id?: string
          category: Database["public"]["Enums"]["template_category"]
          title: string
          role: string
          description: string
          duration: number
          difficulty: Database["public"]["Enums"]["template_difficulty"]
          questions_count: number;
          company?: string
          is_company_specific: boolean
          is_industry_specific: boolean
          is_general: boolean
          is_system_defined: boolean
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: Database["public"]["Enums"]["template_category"]
          title?: string
          role?: string
          description?: string
          duration?: number
          difficulty?: Database["public"]["Enums"]["template_difficulty"]
          questions_count: number;
          company?: string
          is_company_specific?: boolean
          is_industry_specific?: boolean
          is_general?: boolean
          is_system_defined?: boolean
          created_at?: string
        }
      }

      questions: {
        Row: {
          id: string
          template_id: string
          type: Database["public"]["Enums"]["question_type"]
          text: string
          sample_answer: string
          is_system_defined: boolean
          }
        Insert: {
          id: string
          template_id: string
          type: Database["public"]["Enums"]["question_type"]
          sample_answer: string
          is_system_defined: boolean
        }
        Update: {
          id?: string
          template_id?: string
          type: Database["public"]["Enums"]["question_type"]
          text?: string
          sample_answer: string
          is_system_defined: boolean
        }
      }
      // interview questions and answers and job status
        
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_admin_get_user_id_by_email: {
        Args: {
          emailarg: string
        }
        Returns: string
      }
      check_if_authenticated_user_owns_email: {
        Args: {
          email: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_types: "employer" | "candidate"
      product_type: "subscription" | "token"
      product_status: "active" | "inactive"
      interview_status: "not_started" | "in_progress" | "completed"
      template_difficulty: "Easy" | "Medium" | "Hard"
      template_category: "General Skills-Based" | "General Job-Based" | "Accounting" | "Finance" | "Admin"  | "Customer Service" | "IT" | "HR" | "Legal" | "Education" | "Training" | "Real Estate" | "Engineering" | "Construction"  | "Healthcare" | "Pharma" | "Hospitality" | "Travel" | "Law Enforcement" | "Security" | "Logistics" | "Real Estate" | "Marketing" | "PR" | "Media" | "Sales" | "Retail" | "Other"
      question_type: "General" | "Behavioral" | "Role-Specific" | "Operational"
      job_application_tracker_status: "not_started" | "applied" | "in_progress" | "rejected" | "offered" | "hired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
    PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
    PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

