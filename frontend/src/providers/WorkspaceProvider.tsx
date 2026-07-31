import { useCallback, useEffect, useState } from "react";

import type { ReactNode } from "react";

import { WorkspaceContext } from "@/features/workspace/context/WorkspaceContext";
import { listWorkspaces } from "@/features/workspace/services/workspace.service";
import type { Workspace } from "@/features/workspace/types/workspace.types";

const STORAGE_KEY = "workpulse.active_workspace";

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

      const savedId = localStorage.getItem(STORAGE_KEY);

      const savedWorkspace = data.find((item) => item.id === savedId);

      if (savedWorkspace) {
        setWorkspaceState(savedWorkspace);
        return;
      }

      const activeWorkspace = data.find((item) => item.status === "ACTIVE");

      if (activeWorkspace) {
        setWorkspaceState(activeWorkspace);

        localStorage.setItem(STORAGE_KEY, activeWorkspace.id);

        return;
      }

      setWorkspaceState(null);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshWorkspaces();
  }, [refreshWorkspaces]);

  function setWorkspace(selectedWorkspace: Workspace) {
    setWorkspaceState(selectedWorkspace);

    localStorage.setItem(STORAGE_KEY, selectedWorkspace.id);
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
