export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          id: string
          is_resolved: boolean | null
          message: string | null
          patient_id: string | null
          severity: string | null
          surgery_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message?: string | null
          patient_id?: string | null
          severity?: string | null
          surgery_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message?: string | null
          patient_id?: string | null
          severity?: string | null
          surgery_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: false
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          answers: Json | null
          created_at: string
          date: string | null
          id: string
          pain_level: number | null
          surgery_id: string | null
          symptoms: Json | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          date?: string | null
          id?: string
          pain_level?: number | null
          surgery_id?: string | null
          symptoms?: Json | null
        }
        Update: {
          answers?: Json | null
          created_at?: string
          date?: string | null
          id?: string
          pain_level?: number | null
          surgery_id?: string | null
          symptoms?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: false
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          created_at: string
          doctor_id: string | null
          id: string
          surgery_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          id: string
          surgery_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          surgery_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: false
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          phone_personal: string | null
          crm: string | null
          role: string | null
          sex: string | null
          updated_at: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          phone_personal?: string | null
          crm?: string | null
          role?: string | null
          sex?: string | null
          updated_at?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_personal?: string | null
          crm?: string | null
          role?: string | null
          sex?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      question_options: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_abnormal: boolean | null
          label: string
          question_id: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_abnormal?: boolean | null
          label: string
          question_id: string
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_abnormal?: boolean | null
          label?: string
          question_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          id: string
          input_type: string
          is_active: boolean | null
          metadata: Json | null
          text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          input_type: string
          is_active?: boolean | null
          metadata?: Json | null
          text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          input_type: string
          is_active?: boolean | null
          metadata?: Json | null
          text: string
          updated_at?: string | null
        }
        Relationships: []
      }
      surgeries: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          notes: string | null
          patient_id: string
          medical_status: 'stable' | 'warning' | 'critical' | null
          status: string
          surgery_date: string
          surgery_type_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          medical_status: 'stable' | 'warning' | 'critical' | null
          notes?: string | null
          patient_id: string
          status?: string
          surgery_date: string
          surgery_type_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          medical_status?: 'stable' | 'warning' | 'critical' | null
          notes?: string | null
          patient_id?: string
          status?: string
          surgery_date?: string
          surgery_type_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surgeries_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_surgery_type_id_fkey"
            columns: ["surgery_type_id"]
            isOneToOne: false
            referencedRelation: "surgery_types"
            referencedColumns: ["id"]
          },
        ]
      }
      surgery_questions: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean | null
          question_id: string
          surgery_type_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          display_order: number
          id?: string
          is_active?: boolean | null
          question_id: string
          surgery_type_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          question_id?: string
          surgery_type_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surgery_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgery_questions_surgery_type_id_fkey"
            columns: ["surgery_type_id"]
            isOneToOne: false
            referencedRelation: "surgery_types"
            referencedColumns: ["id"]
          },
        ]
      }
      surgery_types: {
        Row: {
          created_at: string
          description: string | null
          expected_recovery_days: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          expected_recovery_days?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          expected_recovery_days?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
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
      [_ in never]: never
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof PublicSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
