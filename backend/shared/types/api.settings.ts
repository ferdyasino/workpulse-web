import type { Json } from "./json.types.ts";

export type SettingsApiRequest =
  | {
      action: "SETTINGS_GET";
    }
  | {
      action: "SETTINGS_UPDATE";
      timezone?: string;
      locale?: string;
      currency?: string;
      metadata?: Json;
    };
