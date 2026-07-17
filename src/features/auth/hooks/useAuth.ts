import { useState } from "react";

import type { AuthState } from "@/features/auth/types/auth.types";

import { loginWithGoogle, logout } from "@/features/auth/services/auth.service";

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  async function login() {
    setState((current) => ({
      ...current,
      isLoading: true,
    }));

    const user = await loginWithGoogle();

    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }

  async function signOut() {
    await logout();

    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }

  return {
    ...state,
    login,
    signOut,
  };
}
