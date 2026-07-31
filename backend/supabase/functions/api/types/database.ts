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
      attendance_policies: {
        Row: {
          allow_breaks: boolean
          allow_early_time_in: boolean
          allow_late_time_out: boolean
          allow_lunch: boolean
          allow_overtime: boolean
          created_at: string
          deleted_at: string | null
          description: string | null
          grace_minutes: number
          id: string
          lunch_minutes: number | null
          max_break_minutes: number | null
          max_breaks: number | null
          metadata: Json
          minimum_overtime_minutes: number
          name: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          allow_breaks?: boolean
          allow_early_time_in?: boolean
          allow_late_time_out?: boolean
          allow_lunch?: boolean
          allow_overtime?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          grace_minutes?: number
          id?: string
          lunch_minutes?: number | null
          max_break_minutes?: number | null
          max_breaks?: number | null
          metadata?: Json
          minimum_overtime_minutes?: number
          name: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          allow_breaks?: boolean
          allow_early_time_in?: boolean
          allow_late_time_out?: boolean
          allow_lunch?: boolean
          allow_overtime?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          grace_minutes?: number
          id?: string
          lunch_minutes?: number | null
          max_break_minutes?: number | null
          max_breaks?: number | null
          metadata?: Json
          minimum_overtime_minutes?: number
          name?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_policies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          browser: string | null
          created_at: string
          deleted_at: string | null
          device_name: string | null
          device_type: string
          fingerprint: string
          id: string
          last_seen_at: string | null
          metadata: Json
          operating_system: string | null
          trusted: boolean
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          deleted_at?: string | null
          device_name?: string | null
          device_type?: string
          fingerprint: string
          id?: string
          last_seen_at?: string | null
          metadata?: Json
          operating_system?: string | null
          trusted?: boolean
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          deleted_at?: string | null
          device_name?: string | null
          device_type?: string
          fingerprint?: string
          id?: string
          last_seen_at?: string | null
          metadata?: Json
          operating_system?: string | null
          trusted?: boolean
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          currency: string
          locale: string
          metadata: Json
          timezone: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          locale?: string
          metadata?: Json
          timezone?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          locale?: string
          metadata?: Json
          timezone?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          break_minutes: number
          created_at: string
          deleted_at: string | null
          description: string | null
          end_time: string
          grace_minutes: number
          id: string
          is_overnight: boolean
          metadata: Json
          name: string
          start_time: string
          status: string
          timezone: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          break_minutes?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_time: string
          grace_minutes?: number
          id?: string
          is_overnight?: boolean
          metadata?: Json
          name: string
          start_time: string
          status?: string
          timezone: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          break_minutes?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_time?: string
          grace_minutes?: number
          id?: string
          is_overnight?: boolean
          metadata?: Json
          name?: string
          start_time?: string
          status?: string
          timezone?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      time_logs: {
        Row: {
          accuracy: number | null
          client_timestamp: string | null
          created_at: string
          device_id: string | null
          event_time_utc: string
          event_type: string
          id: string
          ip_address: unknown
          latitude: number | null
          log_no: string
          longitude: number | null
          metadata: Json
          timezone: string
          user_agent: string | null
          user_id: string
          user_shift_id: string
          work_date: string
          workspace_id: string
        }
        Insert: {
          accuracy?: number | null
          client_timestamp?: string | null
          created_at?: string
          device_id?: string | null
          event_time_utc: string
          event_type: string
          id?: string
          ip_address?: unknown
          latitude?: number | null
          log_no: string
          longitude?: number | null
          metadata?: Json
          timezone: string
          user_agent?: string | null
          user_id: string
          user_shift_id: string
          work_date: string
          workspace_id: string
        }
        Update: {
          accuracy?: number | null
          client_timestamp?: string | null
          created_at?: string
          device_id?: string | null
          event_time_utc?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          latitude?: number | null
          log_no?: string
          longitude?: number | null
          metadata?: Json
          timezone?: string
          user_agent?: string | null
          user_id?: string
          user_shift_id?: string
          work_date?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_user_shift_id_fkey"
            columns: ["user_shift_id"]
            isOneToOne: false
            referencedRelation: "user_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_shift_overrides: {
        Row: {
          created_at: string
          deleted_at: string | null
          effective_from: string
          effective_to: string | null
          id: string
          metadata: Json | null
          reason: string | null
          shift_id: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          effective_from: string
          effective_to?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          shift_id: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          shift_id?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_shift_overrides_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_shift_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_shift_overrides_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_shifts: {
        Row: {
          attendance_policy_id: string | null
          created_at: string
          deleted_at: string | null
          effective_from: string
          effective_to: string | null
          id: string
          metadata: Json
          shift_id: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          attendance_policy_id?: string | null
          created_at?: string
          deleted_at?: string | null
          effective_from: string
          effective_to?: string | null
          id?: string
          metadata?: Json
          shift_id: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          attendance_policy_id?: string | null
          created_at?: string
          deleted_at?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          metadata?: Json
          shift_id?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_shifts_attendance_policy_id_fkey"
            columns: ["attendance_policy_id"]
            isOneToOne: false
            referencedRelation: "attendance_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_shifts_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_shifts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_enabled: boolean
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          department_id: string | null
          display_name: string
          email: string
          employee_no: string
          employment_status: string
          employment_type: string
          first_name: string
          hire_date: string | null
          id: string
          invited_at: string | null
          last_login_at: string | null
          last_name: string
          login_provider: string
          metadata: Json
          middle_name: string | null
          position_id: string | null
          role: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          auth_enabled?: boolean
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          display_name: string
          email: string
          employee_no: string
          employment_status?: string
          employment_type?: string
          first_name: string
          hire_date?: string | null
          id: string
          invited_at?: string | null
          last_login_at?: string | null
          last_name: string
          login_provider?: string
          metadata?: Json
          middle_name?: string | null
          position_id?: string | null
          role?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          auth_enabled?: boolean
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          display_name?: string
          email?: string
          employee_no?: string
          employment_status?: string
          employment_type?: string
          first_name?: string
          hire_date?: string | null
          id?: string
          invited_at?: string | null
          last_login_at?: string | null
          last_name?: string
          login_provider?: string
          metadata?: Json
          middle_name?: string | null
          position_id?: string | null
          role?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          code: string
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          owner_email: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          owner_email?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          owner_email?: string | null
          status?: string
          updated_at?: string
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
