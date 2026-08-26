import { useCallback, useEffect, useState } from "react";

import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";

import { getSettings, updateSettings } from "@/features/settings/services/settings.service";

import type { Settings, UpdateSettingsRequest } from "@/features/settings/types/settings.types";

export function useSettings() {
  const { workspace } = useWorkspace();

  const workspaceId = workspace?.id ?? null;

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Load                                                                      */
  /* ------------------------------------------------------------------------ */

  const loadSettings = useCallback(async () => {
    if (!workspaceId) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getSettings({
        workspace_id: workspaceId,
      });

      setSettings(data);

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load settings";

      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  /* ------------------------------------------------------------------------ */
  /* Save                                                                      */
  /* ------------------------------------------------------------------------ */

  const saveSettings = useCallback(
    async (values: UpdateSettingsRequest) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      try {
        setSaving(true);
        setError(null);

        const data = await updateSettings({
          workspace_id: workspaceId,
          ...values,
        });

        setSettings(data);

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update settings";

        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [workspaceId],
  );

  /* ------------------------------------------------------------------------ */
  /* Auto load when workspace changes                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    saving,
    error,
    refresh: loadSettings,
    save: saveSettings,
  };
}
