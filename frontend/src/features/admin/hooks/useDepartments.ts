import { useCallback, useEffect, useState } from "react";

import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";

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
  const { workspace } = useWorkspace();

  const workspaceId = workspace?.id;

  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [includeInactive, setIncludeInactive] = useState(false);

  const [includeDeleted, setIncludeDeleted] = useState(false);

  const loadDepartments = useCallback(async () => {
    if (!workspaceId) {
      setDepartments([]);
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

  const requireWorkspace = () => {
    if (!workspaceId) {
      throw new Error("Active workspace not selected");
    }

    return workspaceId;
  };

  const createDepartment = useCallback(
    async (payload: Omit<SaveDepartmentRequest, "workspace_id">) => {
      const id = requireWorkspace();

      await createDepartmentService({
        workspace_id: id,
        ...payload,
      });

      await loadDepartments();
    },
    [workspaceId, loadDepartments],
  );

  const updateDepartment = useCallback(
    async (payload: Omit<UpdateDepartmentRequest, "workspace_id">) => {
      const id = requireWorkspace();

      await updateDepartmentService({
        workspace_id: id,
        ...payload,
      });

      await loadDepartments();
    },
    [workspaceId, loadDepartments],
  );

  const activateDepartment = useCallback(
    async (id: string) => {
      await activateDepartmentService({
        workspace_id: requireWorkspace(),
        id,
      });

      await loadDepartments();
    },
    [workspaceId, loadDepartments],
  );

  const deactivateDepartment = useCallback(
    async (id: string) => {
      await deactivateDepartmentService({
        workspace_id: requireWorkspace(),
        id,
      });

      await loadDepartments();
    },
    [workspaceId, loadDepartments],
  );

  const deleteDepartment = useCallback(
    async (id: string) => {
      await deleteDepartmentService({
        workspace_id: requireWorkspace(),
        id,
      });

      await loadDepartments();
    },
    [workspaceId, loadDepartments],
  );

  const restoreDepartment = useCallback(
    async (id: string) => {
      await restoreDepartmentService({
        workspace_id: requireWorkspace(),
        id,
      });

      await loadDepartments();
    },
    [workspaceId, loadDepartments],
  );

  const hardDeleteDepartment = useCallback(
    async (id: string) => {
      await hardDeleteDepartmentService({
        workspace_id: requireWorkspace(),
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
