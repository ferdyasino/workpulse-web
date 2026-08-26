import { apiRequest } from "@/utils/api";

import type { Settings, UpdateSettingsRequest } from "@/features/settings/types/settings.types";

/* -------------------------------------------------------------------------- */
/* GET SETTINGS                                                               */
/* -------------------------------------------------------------------------- */

export type SettingsGetRequest = {
  workspace_id: string;
};

type SettingsGetResponse = {
  success: boolean;
  message?: string;
  settings: Settings | null;
};

/* -------------------------------------------------------------------------- */
/* UPDATE SETTINGS                                                            */
/* -------------------------------------------------------------------------- */

export type SettingsUpdateRequest = UpdateSettingsRequest & {
  workspace_id: string;
};

type SettingsUpdateResponse = {
  success: boolean;
  message?: string;
  settings: Settings;
};

/* -------------------------------------------------------------------------- */
/* GET                                                                        */
/* -------------------------------------------------------------------------- */

export async function getSettings(payload: SettingsGetRequest): Promise<Settings> {
  const response = await apiRequest<
    SettingsGetResponse,
    SettingsGetRequest & {
      action: "SETTINGS_GET";
    }
  >({
    action: "SETTINGS_GET",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to load settings");
  }

  if (!response.settings) {
    throw new Error("Settings were not returned.");
  }

  return response.settings;
}

/* -------------------------------------------------------------------------- */
/* UPDATE                                                                     */
/* -------------------------------------------------------------------------- */

export async function updateSettings(payload: SettingsUpdateRequest): Promise<Settings> {
  const response = await apiRequest<
    SettingsUpdateResponse,
    SettingsUpdateRequest & {
      action: "SETTINGS_UPDATE";
    }
  >({
    action: "SETTINGS_UPDATE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to update settings");
  }

  if (!response.settings) {
    throw new Error("Updated settings were not returned.");
  }

  return response.settings;
}
