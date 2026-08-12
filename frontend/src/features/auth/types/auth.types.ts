export type UserRole = "OWNER" | "ADMIN" | "HR" | "SUPERVISOR" | "EMPLOYEE";

export type EmploymentStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";

export type LoginProvider = "EMAIL" | "GOOGLE" | "BOTH";

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
  /*
   * Identity
   */
  auth_user_id: string;

  user_id: string;

  email: string;

  display_name: string;

  avatar_url: string | null;

  /*
   * Employee information
   */
  employee_no: string;

  first_name: string;

  middle_name: string | null;

  last_name: string;

  hire_date: string | null;

  /*
   * Employment
   */
  role: UserRole;

  employment_status: EmploymentStatus;

  employment_type: EmploymentType;

  /*
   * Authentication
   */
  auth_enabled: boolean;

  login_provider: LoginProvider;

  invited_at: string | null;

  last_login_at: string | null;

  /*
   * Workspace
   */
  workspace_id: string;

  department: UserDepartment | null;

  position: UserPosition | null;

  /*
   * Current shift
   */
  shift: Shift | null;

  /*
   * Optional context metadata
   */
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
