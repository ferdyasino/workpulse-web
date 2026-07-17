export type UserRole = "OWNER" | "ADMIN" | "HR" | "USER";

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};
