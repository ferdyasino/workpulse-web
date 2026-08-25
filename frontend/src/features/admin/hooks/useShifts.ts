import { useCallback, useEffect, useState } from "react";

import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";

import {
  activateShift as activateShiftService,
  createShift as createShiftService,
  deactivateShift as deactivateShiftService,
  deleteShift as deleteShiftService,
  getShifts,
  hardDeleteShift as hardDeleteShiftService,
  restoreShift as restoreShiftService,
  updateShift as updateShiftService,
  type CreateShiftRequest,
  type Shift,
  type UpdateShiftRequest,
} from "../services/shifts.service";

export function useShifts() {
  const { workspace } = useWorkspace();

  const workspaceId = workspace?.id ?? null;

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [includeInactive, setIncludeInactive] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const loadShifts = useCallback(async () => {
    if (!workspaceId) {
      setShifts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getShifts({
        workspace_id: workspaceId,
        include_inactive: includeInactive,
        include_deleted: includeDeleted,
      });

      setShifts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shifts");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, includeInactive, includeDeleted]);

  useEffect(() => {
    void loadShifts();
  }, [loadShifts]);

  const createShift = useCallback(
    async (payload: Omit<CreateShiftRequest, "workspace_id">) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await createShiftService({
        workspace_id: workspaceId,
        ...payload,
      });

      await loadShifts();
    },
    [workspaceId, loadShifts],
  );

  const updateShift = useCallback(
    async (payload: Omit<UpdateShiftRequest, "workspace_id">) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await updateShiftService({
        workspace_id: workspaceId,
        ...payload,
      });

      await loadShifts();
    },
    [workspaceId, loadShifts],
  );

  const activateShift = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await activateShiftService({
        workspace_id: workspaceId,
        id,
      });

      await loadShifts();
    },
    [workspaceId, loadShifts],
  );

  const deactivateShift = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await deactivateShiftService({
        workspace_id: workspaceId,
        id,
      });

      await loadShifts();
    },
    [workspaceId, loadShifts],
  );

  const deleteShift = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await deleteShiftService({
        workspace_id: workspaceId,
        id,
      });

      await loadShifts();
    },
    [workspaceId, loadShifts],
  );

  const restoreShift = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await restoreShiftService({
        workspace_id: workspaceId,
        id,
      });

      await loadShifts();
    },
    [workspaceId, loadShifts],
  );

  const hardDeleteShift = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await hardDeleteShiftService({
        workspace_id: workspaceId,
        id,
      });

      await loadShifts();
    },
    [workspaceId, loadShifts],
  );

  return {
    shifts,
    loading,
    error,

    includeInactive,
    includeDeleted,

    setIncludeInactive,
    setIncludeDeleted,

    refresh: loadShifts,

    createShift,
    updateShift,

    activateShift,
    deactivateShift,

    deleteShift,
    restoreShift,
    hardDeleteShift,
  };
}
