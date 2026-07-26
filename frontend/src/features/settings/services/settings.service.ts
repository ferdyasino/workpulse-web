import { apiRequest } from "@/utils/api";

import type { Settings, UpdateSettingsRequest } from "@/features/settings/types/settings.types";

export async function getSettings() {
  console.log("SETTINGS_GET REQUEST");

  const result = await apiRequest<Settings>({
    action: "SETTINGS_GET",
  });

  console.log("SETTINGS RESULT", result);

  return result;
}

export async function updateSettings(settings: UpdateSettingsRequest) {
  return apiRequest<Settings>({
    action: "SETTINGS_UPDATE",
    ...settings,
  });
}
