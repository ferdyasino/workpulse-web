import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";

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
  const { user, isAuthenticated } = useAuth();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const isPlatformOwner = user?.role === "OWNER";

  const refreshWorkspaces = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setWorkspaces([]);
      setWorkspaceState(null);
      clearActiveWorkspace();
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      /*
       * OWNER is the platform-level workspace administrator.
       * OWNER can see and switch between all workspaces.
       */
      if (isPlatformOwner) {
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
        return;
      }

      /*
       * Normal users are restricted to their assigned workspace.
       *
       * Do not use the saved workspace ID here.
       * Do not choose the first active workspace.
       */
      const userWorkspace = await listWorkspaces();

      const assignedWorkspace = userWorkspace.find((item) => item.id === user.workspace_id);

      if (!assignedWorkspace) {
        setWorkspaces([]);
        setWorkspaceState(null);
        clearActiveWorkspace();

        throw new Error("Your assigned workspace could not be found.");
      }

      setWorkspaces([assignedWorkspace]);
      setWorkspaceState(assignedWorkspace);
      setActiveWorkspaceId(assignedWorkspace.id);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, isPlatformOwner]);

  useEffect(() => {
    void refreshWorkspaces();
  }, [refreshWorkspaces]);

  function setWorkspace(selectedWorkspace: Workspace) {
    /*
     * Platform OWNER may switch workspaces.
     */
    if (isPlatformOwner) {
      setWorkspaceState(selectedWorkspace);
      setActiveWorkspaceId(selectedWorkspace.id);
      return;
    }

    /*
     * Normal users can only select their assigned workspace.
     */
    if (selectedWorkspace.id !== user?.workspace_id) {
      return;
    }

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
