import { apiRequest } from "@/utils/api";

import type { User } from "@/features/auth/types/auth.types";

const STORAGE_KEY = "workpulse_user";

export async function loginWithGoogle(token: string): Promise<User> {
  return apiRequest<User>("/auth/google", {
    method: "POST",
    body: JSON.stringify({
      token,
    }),
  });
}

export async function logout(): Promise<void> {
  localStorage.removeItem("workpulse_user");
}
export function getStoredUser(): User | null {
  const value = localStorage.getItem(STORAGE_KEY);

  if (!value) {
    return null;
  }

  return JSON.parse(value);
}
