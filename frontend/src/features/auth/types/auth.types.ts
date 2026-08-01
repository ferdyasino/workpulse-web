export type UserRole = "OWNER" | "ADMIN" | "HR" | "SUPERVISOR" | "EMPLOYEE";

export type EmploymentStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";

export type UserDepartment = {
  id: string;

  name: string;
};

export type UserPosition = {
  id: string;

  name: string;
};

export type Shift = {
  id: string;

  name: string;

  description: string | null;

  status: "ACTIVE" | "INACTIVE";

  start_time: string;

  end_time: string;

  timezone: string;

  grace_minutes: number;

  break_minutes: number;

  is_overnight: boolean;

  effective_from?: string | null;
};

export type User = {
  auth_user_id: string;

  user_id: string;

  email: string;

  display_name: string;

  avatar_url: string | null;

  role: UserRole;

  employment_status: EmploymentStatus;

  workspace_id: string;

  department: UserDepartment | null;

  position: UserPosition | null;

  shift: Shift | null;

  meta?: {
    resolved_by?: string;

    bootstrap?: boolean;

    workspace_source?: string;
  };
};

export type AuthState = {
  user: User | null;

  isAuthenticated: boolean;

  isLoading: boolean;
};
