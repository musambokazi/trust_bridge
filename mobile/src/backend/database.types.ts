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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assessment_reviews: {
        Row: {
          assessment_id: string
          contact_checked: boolean
          discrepancies_resolved: boolean
          documents_checked: boolean
          notes: string
          status: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          assessment_id: string
          contact_checked: boolean
          discrepancies_resolved: boolean
          documents_checked: boolean
          notes: string
          status: string
          updated_at?: string
          user_id: string
          version: number
        }
        Update: {
          assessment_id?: string
          contact_checked?: boolean
          discrepancies_resolved?: boolean
          documents_checked?: boolean
          notes?: string
          status?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_reviews_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          created_at: string
          id: string
          result: Json
          supplier_id: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id: string
          result: Json
          supplier_id?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          result?: Json
          supplier_id?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          phone: string
          phone_country: string
          text_scale: number
          username: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          first_name: string
          id: string
          last_name: string
          phone: string
          phone_country: string
          text_scale?: number
          username: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
          phone_country?: string
          text_scale?: number
          username?: string
        }
        Relationships: []
      }
      supplier_changes: {
        Row: {
          actor_id: string | null
          after_values: Json
          before_values: Json | null
          created_at: string
          id: string
          reason: string
          supplier_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          actor_id?: string | null
          after_values: Json
          before_values?: Json | null
          created_at?: string
          id?: string
          reason: string
          supplier_id: string
          version: number
          workspace_id: string
        }
        Update: {
          actor_id?: string | null
          after_values?: Json
          before_values?: Json | null
          created_at?: string
          id?: string
          reason?: string
          supplier_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_changes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_changes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          bank_reference: string
          category: string
          contact: string
          created_at: string
          id: string
          last_change_reason: string
          name: string
          registration: string
          reviewed_at: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          bank_reference: string
          category?: string
          contact?: string
          created_at?: string
          id?: string
          last_change_reason?: string
          name: string
          registration?: string
          reviewed_at?: string | null
          version?: number
          workspace_id: string
        }
        Update: {
          bank_reference?: string
          category?: string
          contact?: string
          created_at?: string
          id?: string
          last_change_reason?: string
          name?: string
          registration?: string
          reviewed_at?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          address: string
          alternate_email: string
          alternate_phone: string
          contact_name: string
          contact_role: string
          country: string
          created_at: string
          email: string
          id: string
          industry: string
          kind: string
          name: string
          offering: string
          owner_id: string
          phone: string
          registration: string
          tax_number: string
        }
        Insert: {
          address?: string
          alternate_email?: string
          alternate_phone?: string
          contact_name?: string
          contact_role?: string
          country: string
          created_at?: string
          email: string
          id?: string
          industry?: string
          kind: string
          name: string
          offering?: string
          owner_id: string
          phone: string
          registration?: string
          tax_number?: string
        }
        Update: {
          address?: string
          alternate_email?: string
          alternate_phone?: string
          contact_name?: string
          contact_role?: string
          country?: string
          created_at?: string
          email?: string
          id?: string
          industry?: string
          kind?: string
          name?: string
          offering?: string
          owner_id?: string
          phone?: string
          registration?: string
          tax_number?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_workflow_operation: {
        Args: {
          entity_id: string
          expected_version: number
          operation: string
          payload: Json
          request_id: string
        }
        Returns: Json
      }
      compare_invoice: {
        Args: {
          invoice_amount: number
          invoice_name: string
          invoice_number: string
          invoice_reference: string
          request_id: string
          supplier: string
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
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
