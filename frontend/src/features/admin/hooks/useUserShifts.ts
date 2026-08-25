import { useCallback, useEffect, useState } from "react";

import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";

import {
  createUserShift as createUserShiftService,
  deleteUserShift as deleteUserShiftService,
  getUserShift as getUserShiftService,
  getUserShifts,
  hardDeleteUserShift as hardDeleteUserShiftService,
  restoreUserShift as restoreUserShiftService,
  updateUserShift as updateUserShiftService,
  type CreateUserShiftRequest,
  type UpdateUserShiftRequest,
  type UserShift,
} from "../services/userShifts.service";

export function useUserShifts(userId?: string) {
  const { workspace } = useWorkspace();

  const workspaceId = workspace?.id ?? null;
  const [userShifts, setUserShifts] = useState<UserShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserShifts = useCallback(async () => {
    if (!workspaceId || !userId) {
      setUserShifts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getUserShifts({
        workspace_id: workspaceId,
        user_id: userId,
      });

      setUserShifts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user shifts");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, userId]);

  useEffect(() => {
    void loadUserShifts();
  }, [loadUserShifts]);

  const getUserShift = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      return getUserShiftService({
        workspace_id: workspaceId,
        id,
      });
    },
    [workspaceId],
  );

  const createUserShift = useCallback(
    async (payload: Omit<CreateUserShiftRequest, "workspace_id" | "user_id">) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      if (!userId) {
        throw new Error("User not selected");
      }

      await createUserShiftService({
        workspace_id: workspaceId,
        user_id: userId,
        ...payload,
      });

      await loadUserShifts();
    },
    [workspaceId, userId, loadUserShifts],
  );

  const updateUserShift = useCallback(
    async (payload: Omit<UpdateUserShiftRequest, "workspace_id" | "user_id">) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      if (!userId) {
        throw new Error("User not selected");
      }

      await updateUserShiftService({
        workspace_id: workspaceId,
        user_id: userId,
        ...payload,
      });

      await loadUserShifts();
    },
    [workspaceId, userId, loadUserShifts],
  );

  const deleteUserShift = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await deleteUserShiftService({
        workspace_id: workspaceId,
        id,
      });

      await loadUserShifts();
    },
    [workspaceId, loadUserShifts],
  );

  const restoreUserShift = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await restoreUserShiftService({
        workspace_id: workspaceId,
        id,
      });

      await loadUserShifts();
    },
    [workspaceId, loadUserShifts],
  );

  const hardDeleteUserShift = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await hardDeleteUserShiftService({
        workspace_id: workspaceId,
        id,
      });

      await loadUserShifts();
    },
    [workspaceId, loadUserShifts],
  );

  return {
    userShifts,
    loading,
    error,

    refresh: loadUserShifts,

    getUserShift,

    createUserShift,
    updateUserShift,

    deleteUserShift,
    restoreUserShift,
    hardDeleteUserShift,
  };
}
