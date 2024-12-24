import { AvgEvaluationScores, EvaluationCriteriaType, EvaluationRubricType, EvaluationScores, QuestionAnswerFeedback } from '@/types'
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
          role: string
          skill: string
          description: string
          mode: Database["public"]["Enums"]["interview_mode"]
          difficulty: Database["public"]["Enums"]["template_difficulty"]
          question_count: number
          duration: number
          evaluation_criterias: EvaluationCriteriaType[]
          start_time: string
          end_time: string
          status: Database["public"]["Enums"]["interview_status"]
          current_question_index: number
          is_general: boolean
          is_system_defined: boolean
          created_at: string
        }
        Insert: {
          template_id: string
          candidate_id: string
          title: string
          role?: string
          skill?: string
          description?: string
          mode: Database["public"]["Enums"]["interview_mode"]
          difficulty: Database["public"]["Enums"]["template_difficulty"]
          question_count: number
          duration: number
          evaluation_criterias: EvaluationCriteriaType[]
          start_time: string
          end_time?: string
          status: Database["public"]["Enums"]["interview_status"]
          current_question_index: number
          is_general: boolean
          is_system_defined: boolean
          created_at?: string
        }
        Update: {
          template_id?: string
          candidate_id?: string
          title?: string
          role?: string
          skill?: string
          description?: string
          mode?: Database["public"]["Enums"]["interview_mode"]
          difficulty?: Database["public"]["Enums"]["template_difficulty"]
          question_count?: number
          duration?: number
          evaluation_criterias?: EvaluationCriteriaType[]
          start_time?: string
          end_time?: string
          status?: Database["public"]["Enums"]["interview_status"]
          current_question_index?: number
          is_general?: boolean
          is_system_defined?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: true
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }

      interview_evaluations: {
        Row: {
          id: string
          interview_id: string
          overall_grade: number
          evaluation_scores: EvaluationScores[]
          strengths: string
          areas_for_improvement: string
          recommendations: string
          question_answer_feedback: QuestionAnswerFeedback[];
          created_at: string
        }

        Insert: {
          interview_id: string
          overall_grade: number
          evaluation_scores: EvaluationScores[]
          strengths: string
          areas_for_improvement: string
          recommendations: string
          question_answer_feedback: QuestionAnswerFeedback[];
          created_at?: string
        }
        Update: {
          interview_id?: string
          overall_grade?: number
          evaluation_scores?: EvaluationScores[]
          strengths?: string
          areas_for_improvement?: string
          recommendations?: string
          question_answer_feedback?: QuestionAnswerFeedback[];
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_evaluations_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: true
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_analytics: {
        Row: {
          id: string
          candidate_id: string
          template_id: string
          interview_title: string
          interview_description: string
          total_interviews: number
          question_count: number
          avg_overall_grade: number
          avg_evaluation_criteria_scores: AvgEvaluationScores[]
          strengths_summary: string[]
          areas_for_improvement_summary: string[]
          recommendations_summary: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          template_id: string
          candidate_id: string
          interview_title: string
          interview_description: string
          total_interviews: number
          question_count: number
          avg_overall_grade: number
          avg_evaluation_criteria_scores: AvgEvaluationScores[]
          strengths_summary: string[]
          areas_for_improvement_summary: string[]
          recommendations_summary: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          template_id?: string
          candidate_id?: string
          interview_title?: string
          interview_description?: string
          total_interviews?: number
          question_count?: number
          avg_overall_grade?: number
          avg_evaluation_criteria_scores?: AvgEvaluationScores[]
          strengths_summary?: string[]
          areas_for_improvement_summary?: string[]
          recommendations_summary?: string[]
          created_at?: string
          updated_at?: string
        }

        Relationships: [
          {
            foreignKeyName: "interview_analytics_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: true
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_analytics_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_criteria: {
        Row: {
          id: string
          name: string
          description: string
          is_system_defined: boolean
          created_at: string
        }
        Insert: {
          name: string
          description: string
          is_system_defined: boolean
          created_at: string
        }
        Update: {
          name?: string
          description?: string
          is_system_defined?: boolean
          created_at?: string
        }
      }

      template_evaluation_criteria: {
        Row: {
          template_id: string
          evaluation_criteria_id: string
          rubrics: EvaluationRubricType[]
        }
        Insert: {
          template_id: string
          evaluation_criteria_id: string
          rubrics: EvaluationRubricType[]
        }
        Update: {
          template_id?: string
          evaluation_criteria_id?: string
          rubrics?: EvaluationRubricType[]
        }
        Relationships: [
          {
            foreignKeyName: "template_evaluation_criteria_template_id_fkey"
            columns: ["template_id"]
            isManyToMany: true
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_evaluation_criteria_evaluation_criteria_id_fkey"
            columns: ["evaluation_criteria_id"]
            isManyToMany: true
            referencedRelation: "evaluation_criteria"
            referencedColumns: ["id"]
          },
        ]
      }

      templates: {
        Row: {
          id: string
          user_id: string
          category: Database["public"]["Enums"]["template_category"]
          title: string
          role: string
          skill: string
          description: string
          duration: number
          difficulty: Database["public"]["Enums"]["template_difficulty"]
          question_count: number;
          company: string
          is_company_specific: boolean
          is_industry_specific: boolean
          is_general: boolean
          is_system_defined: boolean
          created_at: string
        }
        Insert: {
          user_id?: string
          category: Database["public"]["Enums"]["template_category"]
          title: string
          role: string
          skill: string
          description: string
          duration: number
          difficulty: Database["public"]["Enums"]["template_difficulty"]
          question_count: number;
          company?: string
          is_company_specific: boolean
          is_industry_specific: boolean
          is_general: boolean
          is_system_defined: boolean
          created_at?: string
        }
        Update: {
          user_id?: string
          category?: Database["public"]["Enums"]["template_category"]
          title?: string
          role?: string
          skill?: string
          description?: string
          duration?: number
          difficulty?: Database["public"]["Enums"]["template_difficulty"]
          question_count: number;
          company?: string
          is_company_specific?: boolean
          is_industry_specific?: boolean
          is_general?: boolean
          is_system_defined?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }

      questions: {
        Row: {
          id: string
          template_id: string
          type: Database["public"]["Enums"]["question_type"]
          evaluation_criteria_id: string
          text: string
          sample_answer: string
        }
        Insert: {
          template_id: string
          type: Database["public"]["Enums"]["question_type"]
          evaluation_criteria_id: string
          text?: string
          sample_answer: string
        }
        Update: {
          template_id?: string
          type?: Database["public"]["Enums"]["question_type"]
          evaluation_criteria_id?: string
          text?: string
          sample_answer?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: true
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_evaluation_criteria_id_fkey"
            columns: ["evaluation_criteria_id"]
            isOneToOne: true
            referencedRelation: "evaluation_criteria"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          id: string
          interview_id: string
          type: Database["public"]["Enums"]["question_type"]
          evaluation_criteria: EvaluationCriteriaType
          text: string
          sample_answer: string
        }
        Insert: {
          interview_id: string
          type: Database["public"]["Enums"]["question_type"]
          evaluation_criteria: EvaluationCriteriaType
          text: string
          sample_answer: string
        }
        Update: {
          interview_id?: string
          type?: Database["public"]["Enums"]["question_type"]
          evaluation_criteria?: EvaluationCriteriaType
          text?: string
          sample_answer?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: true
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_answers: {
        Row: {
          id: string
          interview_question_id: string
          text: string
          feedback: string
        }
        Insert: {
          interview_question_id: string
          text: string
          feedback?: string
        }
        Update: {
          interview_question_id?: string
          text?: string
          feedback?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_answers_interview_question_id_fkey"
            columns: ["interview_question_id"]
            isOneToOne: true
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      //and job status

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
      template_category: "General Skills-Based" | "General Job-Based" | "Accounting" | "Finance" | "Admin" | "Customer Service" | "IT" | "HR" | "Legal" | "Education" | "Training" | "Real Estate" | "Engineering" | "Construction" | "Healthcare" | "Pharma" | "Hospitality" | "Travel" | "Law Enforcement" | "Security" | "Logistics" | "Real Estate" | "Marketing" | "PR" | "Media" | "Sales" | "Retail" | "Other"
      question_type: "General" | "Behavioral" | "Role-Specific" | "Operational"
      job_application_tracker_status: "not_started" | "applied" | "in_progress" | "rejected" | "offered" | "hired"
      interview_mode: "practice" | "interview"
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

