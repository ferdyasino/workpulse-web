import type { TimezoneId } from "../config/timezones";

export type ThemeMode = "light" | "dark" | "system";

export type TimeFormat = "12h" | "24h";

export type WeekStartsOn = 0 | 1;

export interface UserSettings {
  timezone: TimezoneId | null;
  locale: string | null;
  currency: string | null;
  date_format: string | null;
  time_format: TimeFormat | null;
  week_starts_on: WeekStartsOn | null;
  theme: ThemeMode | null;
  metadata: Record<string, unknown>;
}

export interface WorkspaceSettings {
  workspace_id: string;
  timezone: TimezoneId;
  locale: string;
  currency: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EffectiveSettings {
  workspace_id: string;

  timezone: TimezoneId;
  locale: string;
  currency: string;

  date_format: string;
  time_format: TimeFormat;
  week_starts_on: WeekStartsOn;
  theme: ThemeMode;

  metadata: Record<string, unknown>;
}

export interface UpdateUserSettingsRequest {
  timezone?: TimezoneId | null;
  locale?: string | null;
  currency?: string | null;
  date_format?: string | null;
  time_format?: TimeFormat | null;
  week_starts_on?: WeekStartsOn | null;
  theme?: ThemeMode | null;
  metadata?: Record<string, unknown>;
}

export interface UpdateWorkspaceSettingsRequest {
  timezone?: TimezoneId;
  locale?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
}
