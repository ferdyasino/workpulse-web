import { useCallback, useEffect, useState } from "react";

import {
  activatePosition,
  createPosition,
  deactivatePosition,
  deletePosition,
  getPositions,
  hardDeletePosition,
  restorePosition,
  updatePosition,
  type Position,
} from "../services/positions.service";

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

  const addPosition = useCallback(
    async (title: string, description?: string) => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required.");
      }

      await createPosition({
        workspace_id: workspaceId,
        title,
        description,
      });

      await refresh();
    },
    [workspaceId, refresh],
  );

  const editPosition = useCallback(
    async (id: string, title: string, description?: string) => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required.");
      }

      await updatePosition({
        id,
        workspace_id: workspaceId,
        title,
        description,
      });

      await refresh();
    },
    [workspaceId, refresh],
  );

  const activate = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required.");
      }

      await activatePosition({
        id,
        workspace_id: workspaceId,
      });

      await refresh();
    },
    [workspaceId, refresh],
  );

  const deactivate = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required.");
      }

      await deactivatePosition({
        id,
        workspace_id: workspaceId,
      });

      await refresh();
    },
    [workspaceId, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required.");
      }

      await deletePosition({
        id,
        workspace_id: workspaceId,
      });

      await refresh();
    },
    [workspaceId, refresh],
  );

  const restore = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required.");
      }

      await restorePosition({
        id,
        workspace_id: workspaceId,
      });

      await refresh();
    },
    [workspaceId, refresh],
  );

  const hardDelete = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required.");
      }

      await hardDeletePosition({
        id,
        workspace_id: workspaceId,
      });

      await refresh();
    },
    [workspaceId, refresh],
  );

  return {
    positions,
    loading,
    error,
    refresh,
    addPosition,
    editPosition,
    activate,
    deactivate,
    remove,
    restore,
    hardDelete,
  };
}
