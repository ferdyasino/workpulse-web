import { supabase } from "@/lib/supabase";
import { invokeFunction } from "@/utils/api";

import type { User } from "@/features/auth/types/auth.types";

const STORAGE_KEY = "workpulse_user";

export async function loginWithGoogle(_workspaceSlug: string, credential: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: credential,
  });

  console.groupCollapsed("[AUTH]");
  console.log("signInWithIdToken", { data, error });

  if (error) {
    console.groupEnd();
    throw error;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("session", session);

  if (!session) {
    console.groupEnd();
    throw new Error("Failed to establish a Supabase session.");
  }

  const user = await invokeFunction<
    User,
    {
      action: "ME";
    }
  >("api", {
    action: "ME",
  });

  console.log("user", user);
  console.groupEnd();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

  return user;
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();

  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredUser(): User | null {
  const value = localStorage.getItem(STORAGE_KEY);

  if (!value) {
    return null;
  }

  return JSON.parse(value) as User;
}
