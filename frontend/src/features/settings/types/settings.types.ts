export interface Settings {
  workspace_id: string;
  timezone: string;
  locale: string;
  currency: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsRequest {
  timezone?: string;
  locale?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
}
