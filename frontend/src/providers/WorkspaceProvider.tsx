import { useCallback, useEffect, useState } from "react";

import type { ReactNode } from "react";

import { WorkspaceContext } from "@/features/workspace/context/WorkspaceContext";

import {
  listWorkspaces,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  clearActiveWorkspace,
} from "@/features/workspace/services/workspace.service";

import type { Workspace } from "@/features/workspace/types/workspace.types";

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  const [workspace, setWorkspaceState] = useState<Workspace | null>(null);

  const [loading, setLoading] = useState(true);

  const refreshWorkspaces = useCallback(async () => {
    setLoading(true);

    try {
      const data = await listWorkspaces();

      setWorkspaces(data);

      const savedId = getActiveWorkspaceId();

      const savedWorkspace = data.find((item) => item.id === savedId);

      if (savedWorkspace) {
        setWorkspaceState(savedWorkspace);
        return;
      }

      const activeWorkspace = data.find((item) => item.status === "ACTIVE");

      if (activeWorkspace) {
        setWorkspaceState(activeWorkspace);

        setActiveWorkspaceId(activeWorkspace.id);

        return;
      }

      if (data.length > 0) {
        setWorkspaceState(data[0]);

        setActiveWorkspaceId(data[0].id);

        return;
      }

      setWorkspaceState(null);

      clearActiveWorkspace();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshWorkspaces();
  }, [refreshWorkspaces]);

  function setWorkspace(selectedWorkspace: Workspace) {
    setWorkspaceState(selectedWorkspace);

    setActiveWorkspaceId(selectedWorkspace.id);
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,

        workspaces,

        loading,

        setWorkspace,

        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceProvider;
