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
    isAuthenticated: storedUser !== null,
    isLoading: false,
  });

  /**
   * Google Login
   */
  async function login(credential: string): Promise<void> {
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
  async function loginEmail(email: string, password: string): Promise<void> {
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
  async function signOut(): Promise<void> {
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

    if (user !== null) {
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
        login,
        loginWithEmail: loginEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
