import { useCallback, useEffect, useState } from "react";

import { getShifts, type Shift } from "../services/shifts.service";

export function useShifts(workspaceId?: string) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setShifts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const shifts = await getShifts({
        workspace_id: workspaceId,
      });

      setShifts(shifts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shifts");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    shifts,
    loading,
    error,
    refresh,
  };
}
