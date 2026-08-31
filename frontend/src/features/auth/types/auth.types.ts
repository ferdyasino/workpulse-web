export type UserRole = "OWNER" | "ADMIN" | "HR" | "SUPERVISOR" | "EMPLOYEE";

export type EmploymentStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";

/**
 * Authentication methods available to a WorkPulse user.
 *
 * EMAIL:
 *   User authenticates using Supabase email/password authentication.
 *
 * GOOGLE:
 *   User authenticates using Google OAuth.
 *
 * BOTH:
 *   User may authenticate using either Google OAuth or email/password.
 */
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

/**
 * Application-level authenticated user.
 *
 * Normal workspace users:
 * - have a public.users record
 * - have a workspace
 * - have employee information
 *
 * Platform Owner:
 * - exists only in Supabase Auth
 * - does NOT have a public.users record
 * - does NOT belong to a workspace
 * - is identified by meta.platform_owner
 */
export type User = {
  /* ------------------------------------------------------------------------ */
  /* Identity                                                                 */
  /* ------------------------------------------------------------------------ */

  auth_user_id: string;
  user_id: string | null;
  email: string;
  display_name: string;
  avatar_url: string | null;

  /* ------------------------------------------------------------------------ */
  /* Employee information                                                     */
  /* ------------------------------------------------------------------------ */

  employee_no: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  hire_date: string | null;

  /* ------------------------------------------------------------------------ */
  /* Employment                                                               */
  /* ------------------------------------------------------------------------ */

  role: UserRole;
  employment_status: EmploymentStatus;
  employment_type: EmploymentType;

  /* ------------------------------------------------------------------------ */
  /* Authentication                                                           */
  /* ------------------------------------------------------------------------ */

  auth_enabled: boolean;
  login_provider: LoginProvider;
  invited_at: string | null;
  last_login_at: string | null;

  /* ------------------------------------------------------------------------ */
  /* Workspace                                                                */
  /* ------------------------------------------------------------------------ */

  workspace_id: string | null;
  department: UserDepartment | null;
  position: UserPosition | null;

  /* ------------------------------------------------------------------------ */
  /* Current shift                                                            */
  /* ------------------------------------------------------------------------ */

  shift: Shift | null;

  /* ------------------------------------------------------------------------ */
  /* Application context metadata                                             */
  /* ------------------------------------------------------------------------ */

  meta?: {
    platform_owner?: boolean;
    resolved_by?: string;
    bootstrap?: boolean;
    workspace_source?: string;
  };
};

/**
 * Authentication state maintained by the application.
 */
export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

/* -------------------------------------------------------------------------- */
/* Password Recovery                                                          */
/* -------------------------------------------------------------------------- */

/**
 * State used by the forgot-password screen.
 */
export type PasswordResetRequest = {
  email: string;
};

/**
 * State used by the reset-password screen.
 *
 * The password is only sent to Supabase Auth through updateUser().
 * It must never be stored in public.users or WorkPulse application storage.
 */
export type PasswordResetValues = {
  password: string;
  confirmPassword: string;
};
