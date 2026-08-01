import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { isPlatformOwner } from "@/features/auth/utils/permissions";

interface Props {
  children: ReactNode;
}

export default function PlatformOwnerOnlyRoute({ children }: Props) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (!isPlatformOwner(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
