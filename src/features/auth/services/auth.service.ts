import { apiRequest } from "@/utils/api";

import type { User } from "@/features/auth/types/auth.types";

const STORAGE_KEY = "workpulse_user";

export async function loginWithGoogle(workspaceSlug: string, credential: string): Promise<User> {
  const body = new URLSearchParams();

  body.append("action", "logingoogle");
  body.append("workspaceSlug", workspaceSlug || "");
  body.append("credential", credential);

  const user = await apiRequest<User>("", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: body.toString(),
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

  return user;
}

export async function logout(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredUser(): User | null {
  const value = localStorage.getItem(STORAGE_KEY);

  if (!value) {
    return null;
  }

  return JSON.parse(value);
}
