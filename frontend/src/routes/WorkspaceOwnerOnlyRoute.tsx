import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";

import { canManageWorkspace } from "@/features/auth/utils/permissions";

interface Props {
  children: ReactNode;
}

export default function WorkspaceOwnerOnlyRoute({ children }: Props) {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  /**
   * Wait until auth and workspace context are available.
   */
  if (!user || !workspace) {
    return null;
  }

  /**
   * Permission hierarchy:
   *
   * 1. Platform Owner (env email override)
   * 2. Workspace Owner
   * 3. Workspace ADMIN
   */
  if (!canManageWorkspace(user, workspace)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
