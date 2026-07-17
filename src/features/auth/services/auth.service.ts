import type { User } from "@/features/auth/types/auth.types";

export async function loginWithGoogle(): Promise<User> {
  // Placeholder
  // Later this will call Google OAuth

  return {
    id: "demo-user",
    email: "demo@workpulse.com",
    name: "Demo User",
    role: "USER",
  };
}

export async function logout(): Promise<void> {
  return;
}
