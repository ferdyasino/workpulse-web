import type { Json } from "../database.ts";

export type SettingsApiRequest =
  | {
      action: "SETTINGS_GET";
      workspace_id: string;
    }
  | {
      action: "SETTINGS_UPDATE";
      workspace_id: string;
      timezone?: string;
      locale?: string;
      currency?: string;
      metadata?: Json;
    };
