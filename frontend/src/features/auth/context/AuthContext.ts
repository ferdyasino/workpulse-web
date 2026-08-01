import { createContext } from "react";

import type { AuthState } from "@/features/auth/types/auth.types";

export type AuthContextType = AuthState & {
  /**
   * Google login
   */
  login: (credential: string) => Promise<void>;

  /**
   * Email + password login
   */
  loginWithEmail: (email: string, password: string) => Promise<void>;

  /**
   * Logout
   */
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);
