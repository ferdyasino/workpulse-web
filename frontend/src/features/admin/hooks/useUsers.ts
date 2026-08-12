import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";

import {
  activateUser as activateUserService,
  createUser as createUserService,
  deactivateUser as deactivateUserService,
  deleteUser as deleteUserService,
  getUser as getUserService,
  getUsers,
  hardDeleteUser as hardDeleteUserService,
  restoreUser as restoreUserService,
  updateUser as updateUserService,
  type SaveUserRequest,
  type UpdateUserRequest,
  type User,
  type UserListItem,
} from "../services/users.service";

export function useUsers() {
  const { user } = useAuth();

  const workspaceId = user?.workspace_id;

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [includeInactive, setIncludeInactive] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!workspaceId) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getUsers({
        workspace_id: workspaceId,
        include_inactive: includeInactive,
        include_deleted: includeDeleted,
      });

      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, includeInactive, includeDeleted]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const getUser = useCallback(
    async (id: string): Promise<User> => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      return await getUserService({
        workspace_id: workspaceId,
        id,
      });
    },
    [workspaceId],
  );

  const createUser = useCallback(
    async (payload: Omit<SaveUserRequest, "workspace_id">) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await createUserService({
        workspace_id: workspaceId,
        ...payload,
      });

      await loadUsers();
    },
    [workspaceId, loadUsers],
  );

  const updateUser = useCallback(
    async (payload: Omit<UpdateUserRequest, "workspace_id">) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await updateUserService({
        workspace_id: workspaceId,
        ...payload,
      });

      await loadUsers();
    },
    [workspaceId, loadUsers],
  );

  const activateUser = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await activateUserService({
        workspace_id: workspaceId,
        id,
      });

      await loadUsers();
    },
    [workspaceId, loadUsers],
  );

  const deactivateUser = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await deactivateUserService({
        workspace_id: workspaceId,
        id,
      });

      await loadUsers();
    },
    [workspaceId, loadUsers],
  );

  const deleteUser = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await deleteUserService({
        workspace_id: workspaceId,
        id,
      });

      await loadUsers();
    },
    [workspaceId, loadUsers],
  );

  const restoreUser = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await restoreUserService({
        workspace_id: workspaceId,
        id,
      });

      await loadUsers();
    },
    [workspaceId, loadUsers],
  );

  const hardDeleteUser = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await hardDeleteUserService({
        workspace_id: workspaceId,
        id,
      });

      await loadUsers();
    },
    [workspaceId, loadUsers],
  );

  return {
    users,
    loading,
    error,

    includeInactive,
    includeDeleted,

    setIncludeInactive,
    setIncludeDeleted,

    refresh: loadUsers,

    getUser,

    createUser,
    updateUser,

    activateUser,
    deactivateUser,

    deleteUser,
    restoreUser,
    hardDeleteUser,
  };
}
