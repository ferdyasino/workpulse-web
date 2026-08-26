import type { TimezoneId } from "@workpulse/shared";

export interface Settings {
  workspace_id: string;
  timezone: TimezoneId;
  locale: string;
  currency: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsRequest {
  timezone?: TimezoneId;
  locale?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
}
