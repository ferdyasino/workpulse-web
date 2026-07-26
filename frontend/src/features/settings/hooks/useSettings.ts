import { useCallback, useEffect, useState } from "react";

import { getSettings, updateSettings } from "@/features/settings/services/settings.service";

import type { Settings, UpdateSettingsRequest } from "@/features/settings/types/settings.types";

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getSettings();

      setSettings(result);

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load settings";

      setError(message);

      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (values: UpdateSettingsRequest) => {
    try {
      setSaving(true);
      setError(null);

      const result = await updateSettings(values);

      setSettings(result);

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update settings";

      setError(message);

      throw error;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    settings,
    loading,
    saving,
    error,
    refresh,
    save,
  };
}
