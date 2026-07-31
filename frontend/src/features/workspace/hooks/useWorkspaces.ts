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
} from "../services/workspace.service";

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (includeDeleted = false) => {
    setLoading(true);

    try {
      const data = await listWorkspaces(includeDeleted);
      setWorkspaces(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function create(payload: CreateWorkspacePayload) {
    await createWorkspace(payload);
    await refresh();
  }

  async function update(payload: UpdateWorkspacePayload) {
    await updateWorkspace(payload);
    await refresh();
  }

  async function activate(id: string) {
    await activateWorkspace({ id });
    await refresh();
  }

  async function deactivate(id: string) {
    await deactivateWorkspace({ id });
    await refresh();
  }

  async function remove(id: string) {
    await deleteWorkspace({ id });
    await refresh();
  }

  async function restore(id: string) {
    await restoreWorkspace({ id });
    await refresh(true);
  }

  async function hardDelete(id: string) {
    await hardDeleteWorkspace({ id });
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
