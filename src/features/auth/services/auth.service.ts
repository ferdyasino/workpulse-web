import type { User } from "@/features/auth/types/auth.types";

const STORAGE_KEY = "workpulse_user";

export async function loginWithGoogle(): Promise<User> {
  const user: User = {
    id: "demo-user",
    email: "demo@workpulse.com",
    name: "Demo User",
    role: "USER",
  };

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
