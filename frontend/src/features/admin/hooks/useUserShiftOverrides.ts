import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";

import { getUsers } from "@/features/admin/services/users.service";
import { getShifts, type Shift } from "@/features/admin/services/shifts.service";

import {
  createUserShiftOverride as createUserShiftOverrideService,
  deleteUserShiftOverride as deleteUserShiftOverrideService,
  getUserShiftOverrides,
  hardDeleteUserShiftOverride as hardDeleteUserShiftOverrideService,
  restoreUserShiftOverride as restoreUserShiftOverrideService,
  updateUserShiftOverride as updateUserShiftOverrideService,
  type CreateUserShiftOverrideRequest,
  type UpdateUserShiftOverrideRequest,
  type UserShiftOverride,
} from "../services/userShiftOverrides.service";

type UserOption = {
  id: string;
  display_name: string | null;
  email: string;
};

export function useUserShiftOverrides(userId?: string) {
  const { user } = useAuth();

  const workspaceId = user?.workspace_id;

  const [userShiftOverrides, setUserShiftOverrides] = useState<UserShiftOverride[]>([]);

  const [users, setUsers] = useState<UserOption[]>([]);

  const [shifts, setShifts] = useState<Shift[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [includeDeleted, setIncludeDeleted] = useState(false);

  const loadData = useCallback(async () => {
    if (!workspaceId) {
      setUserShiftOverrides([]);
      setUsers([]);
      setShifts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [overridesResponse, usersResponse, shiftsResponse] = await Promise.all([
        getUserShiftOverrides({
          workspace_id: workspaceId,
          user_id: userId,
          include_deleted: includeDeleted,
        }),

        getUsers({
          workspace_id: workspaceId,
        }),

        getShifts({
          workspace_id: workspaceId,
        }),
      ]);

      console.log("USER_SHIFT_OVERRIDE_LIST RESPONSE:", overridesResponse);

      console.log("USERS RESPONSE:", usersResponse);

      console.log("SHIFTS RESPONSE:", shiftsResponse);

      setUserShiftOverrides(
        Array.isArray(overridesResponse)
          ? overridesResponse
          : (overridesResponse?.user_shift_overrides ?? []),
      );

      setUsers(Array.isArray(usersResponse) ? usersResponse : (usersResponse?.users ?? []));

      setShifts(Array.isArray(shiftsResponse) ? shiftsResponse : (shiftsResponse?.shifts ?? []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user shift overrides");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, userId, includeDeleted]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const createUserShiftOverride = useCallback(
    async (payload: Omit<CreateUserShiftOverrideRequest, "workspace_id">) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await createUserShiftOverrideService({
        workspace_id: workspaceId,
        ...payload,
      });

      await loadData();
    },
    [workspaceId, loadData],
  );

  const updateUserShiftOverride = useCallback(
    async (payload: Omit<UpdateUserShiftOverrideRequest, "workspace_id">) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await updateUserShiftOverrideService({
        workspace_id: workspaceId,
        ...payload,
      });

      await loadData();
    },
    [workspaceId, loadData],
  );

  const deleteUserShiftOverride = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await deleteUserShiftOverrideService({
        workspace_id: workspaceId,
        id,
      });

      await loadData();
    },
    [workspaceId, loadData],
  );

  const restoreUserShiftOverride = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await restoreUserShiftOverrideService({
        workspace_id: workspaceId,
        id,
      });

      await loadData();
    },
    [workspaceId, loadData],
  );

  const hardDeleteUserShiftOverride = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await hardDeleteUserShiftOverrideService({
        workspace_id: workspaceId,
        id,
      });

      await loadData();
    },
    [workspaceId, loadData],
  );

  return {
    userShiftOverrides,

    users,

    shifts,

    loading,

    error,

    includeDeleted,

    setIncludeDeleted,

    refresh: loadData,

    createUserShiftOverride,

    updateUserShiftOverride,

    deleteUserShiftOverride,

    restoreUserShiftOverride,

    hardDeleteUserShiftOverride,
  };
}
