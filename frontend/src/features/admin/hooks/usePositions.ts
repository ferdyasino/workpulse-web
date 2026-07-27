import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";

import {
  activatePosition as activatePositionService,
  createPosition as createPositionService,
  deactivatePosition as deactivatePositionService,
  deletePosition as deletePositionService,
  getPositions,
  hardDeletePosition as hardDeletePositionService,
  restorePosition as restorePositionService,
  updatePosition as updatePositionService,
  type CreatePositionRequest,
  type Position,
  type UpdatePositionRequest,
} from "../services/positions.service";

export function usePositions() {
  const { user } = useAuth();

  const workspaceId = user?.workspace_id;

  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [includeInactive, setIncludeInactive] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const loadPositions = useCallback(async () => {
    if (!workspaceId) {
      setPositions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getPositions({
        workspace_id: workspaceId,
        include_inactive: includeInactive,
        include_deleted: includeDeleted,
      });

      setPositions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load positions");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, includeInactive, includeDeleted]);

  useEffect(() => {
    void loadPositions();
  }, [loadPositions]);

  const createPosition = useCallback(
    async (payload: Omit<CreatePositionRequest, "workspace_id">) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await createPositionService({
        workspace_id: workspaceId,
        ...payload,
      });

      await loadPositions();
    },
    [workspaceId, loadPositions],
  );

  const updatePosition = useCallback(
    async (payload: Omit<UpdatePositionRequest, "workspace_id">) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await updatePositionService({
        workspace_id: workspaceId,
        ...payload,
      });

      await loadPositions();
    },
    [workspaceId, loadPositions],
  );

  const activatePosition = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await activatePositionService({
        workspace_id: workspaceId,
        id,
      });

      await loadPositions();
    },
    [workspaceId, loadPositions],
  );

  const deactivatePosition = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await deactivatePositionService({
        workspace_id: workspaceId,
        id,
      });

      await loadPositions();
    },
    [workspaceId, loadPositions],
  );

  const deletePosition = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await deletePositionService({
        workspace_id: workspaceId,
        id,
      });

      await loadPositions();
    },
    [workspaceId, loadPositions],
  );

  const restorePosition = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await restorePositionService({
        workspace_id: workspaceId,
        id,
      });

      await loadPositions();
    },
    [workspaceId, loadPositions],
  );

  const hardDeletePosition = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await hardDeletePositionService({
        workspace_id: workspaceId,
        id,
      });

      await loadPositions();
    },
    [workspaceId, loadPositions],
  );

  return {
    positions,
    loading,
    error,

    includeInactive,
    includeDeleted,

    setIncludeInactive,
    setIncludeDeleted,

    refresh: loadPositions,

    createPosition,
    updatePosition,

    activatePosition,
    deactivatePosition,

    deletePosition,
    restorePosition,
    hardDeletePosition,
  };
}
