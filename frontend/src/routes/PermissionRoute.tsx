import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";

type PermissionCheck = (
  user: NonNullable<ReturnType<typeof useAuth>["user"]>,
  workspace: ReturnType<typeof useWorkspace>["workspace"],
) => boolean;

type Props = {
  children: ReactNode;
  permission: PermissionCheck;
  redirectTo?: string;
};

export default function PermissionRoute({
  children,
  permission,
  redirectTo = "/dashboard",
}: Props) {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  if (!user) {
    return null;
  }

  if (!permission(user, workspace)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
