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

  /*
   * IMPORTANT:
   *
   * A platform owner is NOT simply any user whose role is OWNER.
   *
   * According to auth.types.ts, the platform owner:
   * - exists only in Supabase Auth
   * - does not have a public.users record
   * - does not belong to a workspace
   * - is identified by meta.platform_owner
   *
   * Therefore use the explicit platform_owner flag.
   */
  const isPlatformOwner = user?.meta?.platform_owner === true;

  const refreshWorkspaces = useCallback(async () => {
    /*
     * No authenticated user:
     * completely reset workspace state.
     */
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
       * ================================================================
       * PLATFORM OWNER
       * ================================================================
       *
       * Platform owner can see every workspace and switch between them.
       *
       * The saved workspace ID is only used for platform owners because
       * they are allowed to select any workspace.
       */
      if (isPlatformOwner) {
        const data = await listWorkspaces();

        setWorkspaces(data);

        /*
         * First preference:
         * restore the previously selected workspace.
         */
        const savedId = getActiveWorkspaceId();

        const savedWorkspace = data.find((item) => item.id === savedId && item.deleted_at == null);

        if (savedWorkspace) {
          setWorkspaceState(savedWorkspace);
          return;
        }

        /*
         * Second preference:
         * select the first active workspace.
         */
        const activeWorkspace = data.find(
          (item) => item.status === "ACTIVE" && item.deleted_at == null,
        );

        if (activeWorkspace) {
          setWorkspaceState(activeWorkspace);
          setActiveWorkspaceId(activeWorkspace.id);
          return;
        }

        /*
         * Third preference:
         * if no active workspace exists, use the first available
         * non-deleted workspace.
         */
        const availableWorkspace = data.find((item) => item.deleted_at == null);

        if (availableWorkspace) {
          setWorkspaceState(availableWorkspace);
          setActiveWorkspaceId(availableWorkspace.id);
          return;
        }

        /*
         * No workspaces exist.
         */
        setWorkspaceState(null);
        clearActiveWorkspace();
        return;
      }

      /*
       * ================================================================
       * NORMAL WORKSPACE USER
       * ================================================================
       *
       * Normal users must NEVER use:
       *
       * - the saved workspace ID
       * - the first active workspace
       * - another workspace selected by a previous platform owner session
       *
       * They are restricted to user.workspace_id.
       */
      if (!user.workspace_id) {
        setWorkspaces([]);
        setWorkspaceState(null);
        clearActiveWorkspace();

        throw new Error("Your account is not assigned to a workspace.");
      }

      /*
       * The current workspace service returns the workspace list.
       *
       * We still enforce the user's workspace_id locally here so the
       * frontend never selects another workspace for a normal user.
       *
       * Server-side authorization should also enforce this restriction.
       */
      const data = await listWorkspaces();

      const assignedWorkspace = data.find(
        (item) => item.id === user.workspace_id && item.deleted_at == null,
      );

      if (!assignedWorkspace) {
        setWorkspaces([]);
        setWorkspaceState(null);
        clearActiveWorkspace();

        throw new Error("Your assigned workspace could not be found.");
      }

      /*
       * Normal users only receive their assigned workspace in context.
       */
      setWorkspaces([assignedWorkspace]);
      setWorkspaceState(assignedWorkspace);
      setActiveWorkspaceId(assignedWorkspace.id);
    } catch (error) {
      /*
       * Make sure stale workspace state is never retained after
       * workspace loading fails.
       */
      setWorkspaces([]);
      setWorkspaceState(null);
      clearActiveWorkspace();

      throw error;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, isPlatformOwner]);

  useEffect(() => {
    /*
     * Do not allow an async provider refresh to create an unhandled
     * promise rejection.
     *
     * The application can still react to the cleared workspace state.
     */
    void refreshWorkspaces().catch((error) => {
      console.error("WORKSPACE_PROVIDER_REFRESH_ERROR:", error);
    });
  }, [refreshWorkspaces]);

  const setWorkspace = useCallback(
    (selectedWorkspace: Workspace) => {
      /*
       * ================================================================
       * PLATFORM OWNER
       * ================================================================
       *
       * Platform owner can switch to any available workspace.
       */
      if (isPlatformOwner) {
        if (selectedWorkspace.deleted_at != null) {
          return;
        }

        setWorkspaceState(selectedWorkspace);
        setActiveWorkspaceId(selectedWorkspace.id);
        return;
      }

      /*
       * ================================================================
       * NORMAL USER
       * ================================================================
       *
       * A normal user can ONLY select their assigned workspace.
       */
      if (!user?.workspace_id || selectedWorkspace.id !== user.workspace_id) {
        return;
      }

      /*
       * Do not allow a deleted workspace to become active.
       */
      if (selectedWorkspace.deleted_at != null) {
        return;
      }

      setWorkspaceState(selectedWorkspace);
      setActiveWorkspaceId(selectedWorkspace.id);
    },
    [isPlatformOwner, user?.workspace_id],
  );

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
