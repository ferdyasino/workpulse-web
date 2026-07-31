import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { env } from "@/config/env";

export default function OwnerOnlyRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (env.workspaceOwnerEmail && user.email !== env.workspaceOwnerEmail) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
