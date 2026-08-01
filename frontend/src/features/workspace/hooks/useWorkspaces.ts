import { useCallback, useEffect, useState } from "react";

import type {
  Workspace,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
} from "../types/workspace.types";

import {
  listWorkspaces,
  createWorkspace,
  updateWorkspace,
  activateWorkspace,
  deactivateWorkspace,
  deleteWorkspace,
  restoreWorkspace,
  hardDeleteWorkspace,
  setActiveWorkspaceId,
} from "../services/workspace.service";

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (includeDeleted = false) => {
    setLoading(true);

    try {
      const data = await listWorkspaces({
        include_deleted: includeDeleted,
      });

      setWorkspaces(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function create(payload: CreateWorkspacePayload) {
    const workspace = await createWorkspace(payload);

    await refresh();

    return workspace;
  }

  async function update(payload: UpdateWorkspacePayload) {
    const workspace = await updateWorkspace(payload);

    await refresh();

    return workspace;
  }

  async function activate(id: string) {
    const workspace = await activateWorkspace({
      id,
    });

    setActiveWorkspaceId(workspace.id);

    await refresh();

    return workspace;
  }

  async function deactivate(id: string) {
    const workspace = await deactivateWorkspace({
      id,
    });

    await refresh();

    return workspace;
  }

  async function remove(id: string) {
    await deleteWorkspace({
      id,
    });

    await refresh();
  }

  async function restore(id: string) {
    const workspace = await restoreWorkspace({
      id,
    });

    await refresh(true);

    return workspace;
  }

  async function hardDelete(id: string) {
    await hardDeleteWorkspace({
      id,
    });

    await refresh(true);
  }

  return {
    loading,

    workspaces,

    refresh,

    create,

    update,

    activate,

    deactivate,

    remove,

    restore,

    hardDelete,
  };
}
