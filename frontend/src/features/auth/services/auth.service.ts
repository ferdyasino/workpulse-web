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

/**
 * Resolve the authenticated Supabase session into the WorkPulse user.
 *
 * Supabase Auth authentication and WorkPulse authorization are separate:
 *
 *   auth.users.id
 *        ↓
 *   public.users.id
 *
 * A valid Google/Supabase authentication does not automatically mean that
 * the account is registered in WorkPulse.
 */
async function getApplicationUser(): Promise<User> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Invalid credentials.");
  }

  /*
   * Supabase Auth UUID is authoritative.
   *
   * Do not use email as a fallback identity.
   */
  const authUserId = session.user?.id;

  if (!authUserId) {
    await supabase.auth.signOut();
    localStorage.removeItem(STORAGE_KEY);

    throw new Error("Invalid credentials.");
  }

  const context = await invokeFunction<
    ApplicationContext,
    {
      action: "AUTH_ME";
    }
  >("api", {
    action: "AUTH_ME",
  });

  /*
   * AUTH_ME has already verified that the authenticated Supabase UUID
   * corresponds to a valid WorkPulse user, except for the Platform Owner.
   */
  const user = context.user;

  if (!user) {
    await supabase.auth.signOut();
    localStorage.removeItem(STORAGE_KEY);

    throw new Error("Invalid credentials.");
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

  return user;
}

/**
 * Reject the authenticated Supabase account and clear the local session.
 *
 * Used when authentication succeeded at Supabase level but the account
 * is not authorized to use WorkPulse.
 */
async function rejectApplicationAuthentication(): Promise<never> {
  localStorage.removeItem(STORAGE_KEY);

  /*
   * Do not leave an authenticated Supabase session behind when the account
   * is not registered in WorkPulse.
   */
  await supabase.auth.signOut();

  throw new Error("Invalid credentials.");
}

/* -------------------------------------------------------------------------- */
/* Google Authentication                                                      */
/* -------------------------------------------------------------------------- */

export async function loginWithGoogle(_workspaceSlug: string, credential: string): Promise<User> {
  if (!credential?.trim()) {
    throw new Error("Invalid Google credentials.");
  }

  /*
   * Authenticate with Supabase first.
   *
   * This establishes the Supabase Auth UUID.
   */
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: credential,
  });

  if (error) {
    throw error;
  }

  /*
   * A successful signInWithIdToken() must produce a Supabase user.
   */
  const authUserId = data.user?.id;

  if (!authUserId) {
    return rejectApplicationAuthentication();
  }

  /*
   * Now ask the backend to resolve the authenticated account.
   *
   * Backend authorization rules:
   *
   *   Platform Owner:
   *     public.users record optional
   *
   *   Normal user:
   *     public.users.id MUST equal authUserId
   */
  try {
    return await getApplicationUser();
  } catch {
    /*
     * Google authentication succeeded, but the account is not authorized
     * for WorkPulse.
     *
     * Immediately terminate the Supabase session.
     */
    return rejectApplicationAuthentication();
  }
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

  try {
    return await getApplicationUser();
  } catch {
    return rejectApplicationAuthentication();
  }
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
    await supabase.auth.signOut();

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
