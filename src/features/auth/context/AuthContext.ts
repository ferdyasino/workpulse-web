import { createContext } from "react";

import type { AuthState } from "@/features/auth/types/auth.types";

export type AuthContextType = AuthState & {
  login: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);
