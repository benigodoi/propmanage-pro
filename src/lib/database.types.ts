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
      lease_docs: {
        Row: {
          created_at: string
          doc_date: string | null
          id: string
          lease_id: string
          name: string
          org_id: string
          size: string | null
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          doc_date?: string | null
          id?: string
          lease_id: string
          name: string
          org_id: string
          size?: string | null
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          doc_date?: string | null
          id?: string
          lease_id?: string
          name?: string
          org_id?: string
          size?: string | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lease_docs_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_docs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          created_at: string
          id: string
          lease_end: string | null
          lease_start: string
          org_id: string
          status: string
          tenant_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lease_end?: string | null
          lease_start: string
          org_id: string
          status: string
          tenant_id: string
          unit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lease_end?: string | null
          lease_start?: string
          org_id?: string
          status?: string
          tenant_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          base_rent: number
          breakdown: string[]
          created_at: string
          date_paid: string | null
          id: string
          lease_id: string
          month: string
          org_id: string
          partial_amount_paid: number | null
          status: string
          tenant_id: string
          total_due: number
          unit_id: string
          utility_charges: number
        }
        Insert: {
          base_rent?: number
          breakdown?: string[]
          created_at?: string
          date_paid?: string | null
          id?: string
          lease_id: string
          month: string
          org_id: string
          partial_amount_paid?: number | null
          status: string
          tenant_id: string
          total_due?: number
          unit_id: string
          utility_charges?: number
        }
        Update: {
          base_rent?: number
          breakdown?: string[]
          created_at?: string
          date_paid?: string | null
          id?: string
          lease_id?: string
          month?: string
          org_id?: string
          partial_amount_paid?: number | null
          status?: string
          tenant_id?: string
          total_due?: number
          unit_id?: string
          utility_charges?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          org_id: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          org_id: string
          phone?: string | null
          role: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          org_id?: string
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          created_at: string
          icon_type: string
          id: string
          monthly_revenue: number
          name: string
          occupancy_rate: number
          org_id: string
          units_count: number
        }
        Insert: {
          address: string
          created_at?: string
          icon_type: string
          id?: string
          monthly_revenue?: number
          name: string
          occupancy_rate?: number
          org_id: string
          units_count?: number
        }
        Update: {
          address?: string
          created_at?: string
          icon_type?: string
          id?: string
          monthly_revenue?: number
          name?: string
          occupancy_rate?: number
          org_id?: string
          units_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "properties_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          category: string
          created_at: string
          date_created: string
          description: string | null
          id: string
          org_id: string
          status: string
          tenant_id: string
          title: string
          unit_id: string
        }
        Insert: {
          category: string
          created_at?: string
          date_created?: string
          description?: string | null
          id?: string
          org_id: string
          status: string
          tenant_id: string
          title: string
          unit_id: string
        }
        Update: {
          category?: string
          created_at?: string
          date_created?: string
          description?: string | null
          id?: string
          org_id?: string
          status?: string
          tenant_id?: string
          title?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      statements: {
        Row: {
          billing_period: string
          created_at: string
          date_issued: string
          date_paid: string | null
          id: string
          items: Json
          notes: string | null
          org_id: string
          payment_id: string
          statement_no: string
        }
        Insert: {
          billing_period: string
          created_at?: string
          date_issued: string
          date_paid?: string | null
          id?: string
          items?: Json
          notes?: string | null
          org_id: string
          payment_id: string
          statement_no: string
        }
        Update: {
          billing_period?: string
          created_at?: string
          date_issued?: string
          date_paid?: string | null
          id?: string
          items?: Json
          notes?: string | null
          org_id?: string
          payment_id?: string
          statement_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "statements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "statements_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          base_rent: number
          bathrooms: number
          bedrooms: number
          created_at: string
          id: string
          org_id: string
          property_id: string
          sqft: number
          unit_number: string
        }
        Insert: {
          base_rent?: number
          bathrooms?: number
          bedrooms?: number
          created_at?: string
          id?: string
          org_id: string
          property_id: string
          sqft?: number
          unit_number: string
        }
        Update: {
          base_rent?: number
          bathrooms?: number
          bedrooms?: number
          created_at?: string
          id?: string
          org_id?: string
          property_id?: string
          sqft?: number
          unit_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_items: {
        Row: {
          amount: number
          id: string
          name: string
          org_id: string
          unit_id: string
        }
        Insert: {
          amount?: number
          id?: string
          name: string
          org_id: string
          unit_id: string
        }
        Update: {
          amount?: number
          id?: string
          name?: string
          org_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "utility_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization: { Args: { org_name: string }; Returns: string }
      current_org_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
