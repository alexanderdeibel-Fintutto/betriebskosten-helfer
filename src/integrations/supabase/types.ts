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
      buildings: {
        Row: {
          city: string
          created_at: string
          house_number: string
          id: string
          name: string
          postal_code: string
          street: string
          total_area: number
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          house_number: string
          id?: string
          name: string
          postal_code: string
          street: string
          total_area?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          house_number?: string
          id?: string
          name?: string
          postal_code?: string
          street?: string
          total_area?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_costs: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          lease_id: string
          operating_cost_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          lease_id: string
          operating_cost_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          lease_id?: string
          operating_cost_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_costs_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_costs_operating_cost_id_fkey"
            columns: ["operating_cost_id"]
            isOneToOne: false
            referencedRelation: "operating_costs"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          monthly_prepayment: number
          persons_count: number
          start_date: string
          tenant_id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_prepayment?: number
          persons_count?: number
          start_date: string
          tenant_id: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_prepayment?: number
          persons_count?: number
          start_date?: string
          tenant_id?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      meter_readings: {
        Row: {
          consumption: number | null
          created_at: string
          id: string
          operating_cost_id: string
          reading_end: number
          reading_start: number
          unit_id: string
        }
        Insert: {
          consumption?: number | null
          created_at?: string
          id?: string
          operating_cost_id: string
          reading_end?: number
          reading_start?: number
          unit_id: string
        }
        Update: {
          consumption?: number | null
          created_at?: string
          id?: string
          operating_cost_id?: string
          reading_end?: number
          reading_start?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_operating_cost_id_fkey"
            columns: ["operating_cost_id"]
            isOneToOne: false
            referencedRelation: "operating_costs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_cost_items: {
        Row: {
          allocation_key: Database["public"]["Enums"]["allocation_key"]
          amount: number
          cost_type: Database["public"]["Enums"]["cost_type"]
          created_at: string
          description: string | null
          id: string
          operating_cost_id: string
        }
        Insert: {
          allocation_key?: Database["public"]["Enums"]["allocation_key"]
          amount?: number
          cost_type: Database["public"]["Enums"]["cost_type"]
          created_at?: string
          description?: string | null
          id?: string
          operating_cost_id: string
        }
        Update: {
          allocation_key?: Database["public"]["Enums"]["allocation_key"]
          amount?: number
          cost_type?: Database["public"]["Enums"]["cost_type"]
          created_at?: string
          description?: string | null
          id?: string
          operating_cost_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operating_cost_items_operating_cost_id_fkey"
            columns: ["operating_cost_id"]
            isOneToOne: false
            referencedRelation: "operating_costs"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_cost_results: {
        Row: {
          balance: number | null
          cost_share: number
          created_at: string
          heating_cost: number | null
          id: string
          lease_id: string
          operating_cost_id: string
          prepayment_total: number
          sent_at: string | null
          sent_method: string | null
          updated_at: string
        }
        Insert: {
          balance?: number | null
          cost_share?: number
          created_at?: string
          heating_cost?: number | null
          id?: string
          lease_id: string
          operating_cost_id: string
          prepayment_total?: number
          sent_at?: string | null
          sent_method?: string | null
          updated_at?: string
        }
        Update: {
          balance?: number | null
          cost_share?: number
          created_at?: string
          heating_cost?: number | null
          id?: string
          lease_id?: string
          operating_cost_id?: string
          prepayment_total?: number
          sent_at?: string | null
          sent_method?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operating_cost_results_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operating_cost_results_operating_cost_id_fkey"
            columns: ["operating_cost_id"]
            isOneToOne: false
            referencedRelation: "operating_costs"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_costs: {
        Row: {
          building_id: string
          created_at: string
          heating_area_percentage: number | null
          heating_total: number | null
          id: string
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["operating_cost_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          building_id: string
          created_at?: string
          heating_area_percentage?: number | null
          heating_total?: number | null
          id?: string
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["operating_cost_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          building_id?: string
          created_at?: string
          heating_area_percentage?: number | null
          heating_total?: number | null
          id?: string
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["operating_cost_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operating_costs_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          bic: string | null
          created_at: string
          email: string | null
          first_name: string
          iban: string | null
          id: string
          last_name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bic?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          iban?: string | null
          id?: string
          last_name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bic?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          iban?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          area: number
          building_id: string
          created_at: string
          floor: number | null
          has_heating_meter: boolean | null
          id: string
          name: string
          rooms: number | null
          updated_at: string
        }
        Insert: {
          area?: number
          building_id: string
          created_at?: string
          floor?: number | null
          has_heating_meter?: boolean | null
          id?: string
          name: string
          rooms?: number | null
          updated_at?: string
        }
        Update: {
          area?: number
          building_id?: string
          created_at?: string
          floor?: number | null
          has_heating_meter?: boolean | null
          id?: string
          name?: string
          rooms?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      get_building_owner: { Args: { building_id: string }; Returns: string }
      get_operating_cost_owner: {
        Args: { operating_cost_id: string }
        Returns: string
      }
      get_unit_owner: { Args: { unit_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      allocation_key: "area" | "persons" | "units" | "consumption" | "direct"
      app_role: "admin" | "user"
      cost_type:
        | "public_charges"
        | "water_supply"
        | "sewage"
        | "heating_central"
        | "hot_water_central"
        | "elevator"
        | "street_cleaning_waste"
        | "building_cleaning"
        | "garden_maintenance"
        | "lighting"
        | "chimney_cleaning"
        | "insurance"
        | "caretaker"
        | "antenna_cable"
        | "laundry_facilities"
        | "other_operating_costs"
        | "reserve"
      operating_cost_status: "draft" | "calculated" | "sent" | "completed"
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
      allocation_key: ["area", "persons", "units", "consumption", "direct"],
      app_role: ["admin", "user"],
      cost_type: [
        "public_charges",
        "water_supply",
        "sewage",
        "heating_central",
        "hot_water_central",
        "elevator",
        "street_cleaning_waste",
        "building_cleaning",
        "garden_maintenance",
        "lighting",
        "chimney_cleaning",
        "insurance",
        "caretaker",
        "antenna_cable",
        "laundry_facilities",
        "other_operating_costs",
        "reserve",
      ],
      operating_cost_status: ["draft", "calculated", "sent", "completed"],
    },
  },
} as const
