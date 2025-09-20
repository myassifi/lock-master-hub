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
      activities: {
        Row: {
          action_type: string
          created_at: string
          description: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          brand: string | null
          category: string | null
          cost: number | null
          created_at: string
          id: string
          key_type: string
          last_used_date: string | null
          low_stock_threshold: number | null
          quantity: number
          sku: string
          supplier: string | null
          total_cost_value: number | null
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          key_type: string
          last_used_date?: string | null
          low_stock_threshold?: number | null
          quantity?: number
          sku: string
          supplier?: string | null
          total_cost_value?: number | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          key_type?: string
          last_used_date?: string | null
          low_stock_threshold?: number | null
          quantity?: number
          sku?: string
          supplier?: string | null
          total_cost_value?: number | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      inventory_usage: {
        Row: {
          cost_per_unit: number | null
          id: string
          inventory_id: string
          job_id: string | null
          notes: string | null
          quantity_used: number
          total_cost: number | null
          used_date: string
          user_id: string | null
        }
        Insert: {
          cost_per_unit?: number | null
          id?: string
          inventory_id: string
          job_id?: string | null
          notes?: string | null
          quantity_used: number
          total_cost?: number | null
          used_date?: string
          user_id?: string | null
        }
        Update: {
          cost_per_unit?: number | null
          id?: string
          inventory_id?: string
          job_id?: string | null
          notes?: string | null
          quantity_used?: number
          total_cost?: number | null
          used_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_usage_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_inventory: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          job_id: string
          quantity_used: number
          total_cost: number | null
          unit_cost: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          job_id: string
          quantity_used?: number
          total_cost?: number | null
          unit_cost?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          job_id?: string
          quantity_used?: number
          total_cost?: number | null
          unit_cost?: number | null
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          job_date: string
          job_type: Database["public"]["Enums"]["job_type"]
          material_cost: number | null
          notes: string | null
          photos: string[] | null
          price: number | null
          profit_margin: number | null
          status: Database["public"]["Enums"]["job_status"]
          total_cost: number | null
          updated_at: string
          vehicle_lock_details: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          job_date?: string
          job_type: Database["public"]["Enums"]["job_type"]
          material_cost?: number | null
          notes?: string | null
          photos?: string[] | null
          price?: number | null
          profit_margin?: number | null
          status?: Database["public"]["Enums"]["job_status"]
          total_cost?: number | null
          updated_at?: string
          vehicle_lock_details?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          job_date?: string
          job_type?: Database["public"]["Enums"]["job_type"]
          material_cost?: number | null
          notes?: string | null
          photos?: string[] | null
          price?: number | null
          profit_margin?: number | null
          status?: Database["public"]["Enums"]["job_status"]
          total_cost?: number | null
          updated_at?: string
          vehicle_lock_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_activity: {
        Args: {
          p_action_type: string
          p_description: string
          p_entity_id: string
          p_entity_name: string
          p_entity_type: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      job_status: "pending" | "in_progress" | "completed" | "paid"
      job_type:
        | "spare_key"
        | "all_keys_lost"
        | "car_unlock"
        | "smart_key_programming"
        | "house_rekey"
        | "lock_repair"
        | "lock_installation"
        | "other"
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
      job_status: ["pending", "in_progress", "completed", "paid"],
      job_type: [
        "spare_key",
        "all_keys_lost",
        "car_unlock",
        "smart_key_programming",
        "house_rekey",
        "lock_repair",
        "lock_installation",
        "other",
      ],
    },
  },
} as const
