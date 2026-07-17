import { useState } from "react";
import type { ReactNode } from "react";

import { loginWithGoogle, logout } from "@/features/auth/services/auth.service";

import type { AuthState } from "@/features/auth/types/auth.types";

import { AuthContext } from "@/features/auth/context/AuthContext";

type Props = {
  children: ReactNode;
};

export default function AuthProvider({ children }: Props) {
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

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
