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
      documents: {
        Row: {
          building_id: string | null
          content_json: Json | null
          created_at: string | null
          document_type: string | null
          file_size: number | null
          file_url: string | null
          id: string
          title: string
          unit_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          building_id?: string | null
          content_json?: Json | null
          created_at?: string | null
          document_type?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          title: string
          unit_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          building_id?: string | null
          content_json?: Json | null
          created_at?: string | null
          document_type?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          title?: string
          unit_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
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
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
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
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: []
      }
      meter_readings: {
        Row: {
          confidence: number | null
          consumption: number | null
          created_at: string
          id: string
          image_url: string | null
          is_verified: boolean | null
          meter_id: string | null
          operating_cost_id: string
          reading_end: number
          reading_start: number
          source: string | null
          submitted_by: string | null
          unit_id: string
        }
        Insert: {
          confidence?: number | null
          consumption?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          meter_id?: string | null
          operating_cost_id: string
          reading_end?: number
          reading_start?: number
          source?: string | null
          submitted_by?: string | null
          unit_id: string
        }
        Update: {
          confidence?: number | null
          consumption?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          meter_id?: string | null
          operating_cost_id?: string
          reading_end?: number
          reading_start?: number
          source?: string | null
          submitted_by?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "meters"
            referencedColumns: ["id"]
          },
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
      meters: {
        Row: {
          created_at: string | null
          id: string
          installation_date: string | null
          meter_number: string
          meter_type: Database["public"]["Enums"]["meter_type"]
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          installation_date?: string | null
          meter_number: string
          meter_type: Database["public"]["Enums"]["meter_type"]
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          installation_date?: string | null
          meter_number?: string
          meter_type?: Database["public"]["Enums"]["meter_type"]
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meters_unit_id_fkey"
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
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          stripe_customer_id: string | null
          subscription_plan: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          stripe_customer_id?: string | null
          subscription_plan?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          stripe_customer_id?: string | null
          subscription_plan?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          organization_id: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          building_id: string | null
          category: Database["public"]["Enums"]["task_category"] | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          building_id?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          building_id?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
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
      user_subscriptions: {
        Row: {
          app_id: string
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_id?: string
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_id?: string
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      tenants_public: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_building_owner: { Args: { building_id: string }; Returns: string }
      get_operating_cost_owner: {
        Args: { operating_cost_id: string }
        Returns: string
      }
      get_tenant_banking_info: {
        Args: { tenant_id: string }
        Returns: {
          bic: string
          iban: string
          id: string
        }[]
      }
      get_unit_owner: { Args: { unit_id: string }; Returns: string }
      get_user_organization: { Args: { user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      same_organization: {
        Args: { user_id_a: string; user_id_b: string }
        Returns: boolean
      }
    }
    Enums: {
      allocation_key: "area" | "persons" | "units" | "consumption" | "direct"
      app_role: "admin" | "user" | "vermieter" | "mieter" | "hausmeister"
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
      meter_type: "electricity" | "gas" | "water_cold" | "water_hot" | "heating"
      operating_cost_status: "draft" | "calculated" | "sent" | "completed"
      task_category: "repair" | "maintenance" | "inspection" | "other"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "open" | "in_progress" | "completed" | "cancelled"
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
      app_role: ["admin", "user", "vermieter", "mieter", "hausmeister"],
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
      meter_type: ["electricity", "gas", "water_cold", "water_hot", "heating"],
      operating_cost_status: ["draft", "calculated", "sent", "completed"],
      task_category: ["repair", "maintenance", "inspection", "other"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["open", "in_progress", "completed", "cancelled"],
    },
  },
} as const
