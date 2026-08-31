import { supabase } from "@/lib/supabase";
import { invokeFunction } from "@/utils/api";

import type { User } from "@/features/auth/types/auth.types";

const STORAGE_KEY = "workpulse_user";

type ApplicationContext = {
  user: User;
  workspace: unknown;
};

/* -------------------------------------------------------------------------- */
/* Internal helpers                                                           */
/* -------------------------------------------------------------------------- */

async function getApplicationUser(): Promise<User> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Failed to establish a Supabase session.");
  }

  const context = await invokeFunction<
    ApplicationContext,
    {
      action: "AUTH_ME";
    }
  >("api", {
    action: "AUTH_ME",
  });

  const user = context.user;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

  return user;
}

/* -------------------------------------------------------------------------- */
/* Google Authentication                                                      */
/* -------------------------------------------------------------------------- */

export async function loginWithGoogle(_workspaceSlug: string, credential: string): Promise<User> {
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: credential,
  });

  if (error) {
    throw error;
  }

  return getApplicationUser();
}

/* -------------------------------------------------------------------------- */
/* Email / Password Authentication                                            */
/* -------------------------------------------------------------------------- */

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    throw error;
  }

  return getApplicationUser();
}

/* -------------------------------------------------------------------------- */
/* Password Reset                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Request a password-reset email.
 *
 * Supabase sends the recovery email. The user is redirected back to
 * WorkPulse's /reset-password page after opening the recovery link.
 *
 * We intentionally do not expose whether the email exists.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  const redirectTo = `${window.location.origin}/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo,
  });

  if (error) {
    throw error;
  }
}

/**
 * Update the currently authenticated user's password.
 *
 * This is intended to be called after Supabase establishes a recovery
 * session from the password-reset email.
 */
export async function updatePassword(password: string): Promise<void> {
  if (!password) {
    throw new Error("Password is required.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Session                                                                    */
/* -------------------------------------------------------------------------- */

export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
}

/**
 * Resolve the current Supabase session into the WorkPulse application user.
 *
 * Useful after:
 * - browser refresh
 * - password recovery
 * - authentication callback
 */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }

  try {
    return await getApplicationUser();
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Logout                                                                     */
/* -------------------------------------------------------------------------- */

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  localStorage.removeItem(STORAGE_KEY);

  if (error) {
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Stored Application User                                                    */
/* -------------------------------------------------------------------------- */

export function getStoredUser(): User | null {
  const value = localStorage.getItem(STORAGE_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as User;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Clear Local Authentication State                                           */
/* -------------------------------------------------------------------------- */

export function clearStoredUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}
