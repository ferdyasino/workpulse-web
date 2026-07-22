import { supabase } from "@/lib/supabase";
import { invokeFunction } from "@/utils/api";

import type { User } from "@/features/auth/types/auth.types";

const STORAGE_KEY = "workpulse_user";

type ApplicationContext = {
  user: User;

  workspace: unknown;
};

export async function loginWithGoogle(_workspaceSlug: string, credential: string): Promise<User> {
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: credential,
  });

  if (error) {
    throw error;
  }

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

  console.log("AUTH USER:", user);

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
