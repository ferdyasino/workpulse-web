import { useCallback, useEffect, useState } from "react";

import { getPositions, type Position } from "../services/positions.service";

export function usePositions(workspaceId?: string) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setPositions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const positions = await getPositions({
        workspace_id: workspaceId,
      });

      setPositions(positions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load positions");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    positions,
    loading,
    error,
    refresh,
  };
}
