import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";

import {
  activateDepartment as activateDepartmentService,
  createDepartment as createDepartmentService,
  deactivateDepartment as deactivateDepartmentService,
  deleteDepartment as deleteDepartmentService,
  getDepartments,
  hardDeleteDepartment as hardDeleteDepartmentService,
  restoreDepartment as restoreDepartmentService,
  updateDepartment as updateDepartmentService,
  type Department,
  type SaveDepartmentRequest,
  type UpdateDepartmentRequest,
} from "../services/departments.service";

export function useDepartments() {
  const { user } = useAuth();

  const workspaceId = user?.workspace_id;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [includeInactive, setIncludeInactive] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const loadDepartments = useCallback(async () => {
    if (!workspaceId) {
      setDepartments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getDepartments({
        workspace_id: workspaceId,
        include_inactive: includeInactive,
        include_deleted: includeDeleted,
      });

      setDepartments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, includeInactive, includeDeleted]);

  useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  const createDepartment = useCallback(
    async (payload: Omit<SaveDepartmentRequest, "workspace_id">) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await createDepartmentService({
        workspace_id: workspaceId,
        ...payload,
      });

      await loadDepartments();
    },
    [workspaceId, loadDepartments],
  );

  const updateDepartment = useCallback(
    async (payload: Omit<UpdateDepartmentRequest, "workspace_id">) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await updateDepartmentService({
        workspace_id: workspaceId,
        ...payload,
      });

      await loadDepartments();
    },
    [workspaceId, loadDepartments],
  );

  const activateDepartment = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await activateDepartmentService({
        workspace_id: workspaceId,
        id,
      });

      await loadDepartments();
    },
    [workspaceId, loadDepartments],
  );

  const deactivateDepartment = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await deactivateDepartmentService({
        workspace_id: workspaceId,
        id,
      });

      await loadDepartments();
    },
    [workspaceId, loadDepartments],
  );

  const deleteDepartment = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await deleteDepartmentService({
        workspace_id: workspaceId,
        id,
      });

      await loadDepartments();
    },
    [workspaceId, loadDepartments],
  );

  const restoreDepartment = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await restoreDepartmentService({
        workspace_id: workspaceId,
        id,
      });

      await loadDepartments();
    },
    [workspaceId, loadDepartments],
  );

  const hardDeleteDepartment = useCallback(
    async (id: string) => {
      if (!workspaceId) {
        throw new Error("Workspace not found");
      }

      await hardDeleteDepartmentService({
        workspace_id: workspaceId,
        id,
      });

      await loadDepartments();
    },
    [workspaceId, loadDepartments],
  );

  return {
    departments,
    loading,
    error,

    includeInactive,
    includeDeleted,

    setIncludeInactive,
    setIncludeDeleted,

    refresh: loadDepartments,

    createDepartment,
    updateDepartment,

    activateDepartment,
    deactivateDepartment,

    deleteDepartment,
    restoreDepartment,
    hardDeleteDepartment,
  };
}
