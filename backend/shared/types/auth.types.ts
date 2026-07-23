import type { UserRole } from "./user.types.ts";

export type AuthUser = {
  user_id: string;

  email: string;

  workspace_id: string;

  role: UserRole;

  shift_id?: string;
};

export type ApplicationContext = {
  user: AuthUser;

  workspace: unknown;
};
