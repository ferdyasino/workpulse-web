import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  getStoredUser,
  loginWithGoogle,
  loginWithEmail,
  logout,
} from "@/features/auth/services/auth.service";

import type { AuthState } from "@/features/auth/types/auth.types";

import { AuthContext } from "@/features/auth/context/AuthContext";

type Props = {
  children: ReactNode;
};

export default function AuthProvider({ children }: Props) {
  const storedUser = getStoredUser();

  const [state, setState] = useState<AuthState>({
    user: storedUser,
    isAuthenticated: Boolean(storedUser),
    isLoading: false,
  });

  /**
   * Google Login
   */
  async function login(credential: string) {
    setState((current) => ({
      ...current,
      isLoading: true,
    }));

    try {
      const user = await loginWithGoogle("", credential);

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      throw error;
    }
  }

  /**
   * Email + Password Login
   */
  async function loginEmail(email: string, password: string) {
    setState((current) => ({
      ...current,
      isLoading: true,
    }));

    try {
      const user = await loginWithEmail(email, password);

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      throw error;
    }
  }

  /**
   * Logout
   */
  async function signOut() {
    await logout();

    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }

  /**
   * Restore session
   */
  useEffect(() => {
    const user = getStoredUser();

    if (user) {
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,

        // Google login
        login,

        // Email/password login
        loginWithEmail: loginEmail,

        // Logout
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
