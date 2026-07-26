import { apiRequest } from "@/utils/api";

import type { Settings, UpdateSettingsRequest } from "@/features/settings/types/settings.types";

export async function getSettings() {
  return apiRequest<Settings>({
    action: "SETTINGS_GET",
  });
}

export async function updateSettings(settings: UpdateSettingsRequest) {
  return apiRequest<Settings>({
    action: "SETTINGS_UPDATE",
    ...settings,
  });
}
