import { apiRequest } from "@/utils/api";

import type { Settings, UpdateSettingsRequest } from "@/features/settings/types/settings.types";

/* -------------------------------------------------------------------------- */
/* GET SETTINGS                                                               */
/* -------------------------------------------------------------------------- */

export type SettingsGetRequest = {
  workspace_id: string;
};

type SettingsGetResponse = Settings;

/* -------------------------------------------------------------------------- */
/* UPDATE SETTINGS                                                            */
/* -------------------------------------------------------------------------- */

export type SettingsUpdateRequest = UpdateSettingsRequest & {
  workspace_id: string;
};

type SettingsUpdateResponse = Settings;

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

  return response;
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

  return response;
}
