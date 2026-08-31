import type { Json } from "../database.ts";

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

export type UserRole = "OWNER" | "ADMIN" | "HR" | "SUPERVISOR" | "EMPLOYEE";

export type EmploymentStatus =
  "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";

/* -------------------------------------------------------------------------- */
/* Relations                                                                  */
/* -------------------------------------------------------------------------- */

export type UserDepartment = {
  id: string;
  name: string;
};

export type UserPosition = {
  id: string;
  name: string;
};

export type UserShift = {
  id: string;
  name: string;
  description: string | null;
  start_time: string;
  end_time: string;
  timezone: string;
  grace_minutes: number;
  break_minutes: number;
  is_overnight: boolean;
  effective_from: string;
};

/* -------------------------------------------------------------------------- */
/* Full User Database Model                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Full WorkPulse user database model.
 *
 * IMPORTANT:
 * - Password is NEVER part of this type.
 * - Passwords are managed exclusively by Supabase Auth.
 */
export type User = {
  id: string;
  workspace_id: string;

  employee_no: string;

  first_name: string;
  middle_name: string | null;
  last_name: string;
  display_name: string;

  email: string;
  avatar_url: string | null;

  department_id: string | null;
  position_id: string | null;

  role: UserRole;

  employment_status: EmploymentStatus;
  employment_type: EmploymentType;

  auth_enabled: boolean;
  login_provider: string;

  hire_date: string | null;
  invited_at: string | null;
  last_login_at: string | null;

  metadata: Json;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  /* Relations */
  department?: UserDepartment | null;
  position?: UserPosition | null;
  shift?: UserShift | null;
};

/* -------------------------------------------------------------------------- */
/* Create User Payload                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Payload used when creating a WorkPulse employee.
 *
 * `password` is an authentication credential and is passed directly
 * to Supabase Auth by the backend.
 *
 * IMPORTANT:
 * - password is never stored in public.users.
 * - password is never returned as part of User.
 * - password must never be logged.
 */
export type CreateUserPayload = {
  workspace_id: string;

  employee_no: string;

  first_name: string;
  middle_name?: string | null;
  last_name: string;
  display_name: string;

  email: string;

  /**
   * Initial password for email/password authentication.
   *
   * Required when creating an EMAIL authentication account.
   */
  password?: string;

  avatar_url?: string | null;

  department_id?: string | null;
  position_id?: string | null;

  role?: UserRole;

  employment_status?: EmploymentStatus;

  employment_type?: EmploymentType;

  auth_enabled?: boolean;

  login_provider?: string;

  hire_date?: string | null;

  metadata?: Json;
};

/* -------------------------------------------------------------------------- */
/* Update User Payload                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Payload used when updating a WorkPulse employee.
 *
 * Password is intentionally NOT included here.
 *
 * Password changes should use a dedicated authentication operation
 * through Supabase Auth rather than the normal user profile update.
 */
export type UpdateUserPayload = {
  id: string;

  employee_no?: string;

  first_name?: string;
  middle_name?: string | null;
  last_name?: string;

  display_name?: string;

  email?: string;

  avatar_url?: string | null;

  department_id?: string | null;
  position_id?: string | null;

  role?: UserRole;

  employment_status?: EmploymentStatus;

  employment_type?: EmploymentType;

  auth_enabled?: boolean;

  login_provider?: string;

  hire_date?: string | null;

  metadata?: Json;
};

/* -------------------------------------------------------------------------- */
/* Authentication User Context                                               */
/* -------------------------------------------------------------------------- */

/**
 * Authentication user context.
 *
 * This represents the application-level identity returned after
 * authentication.
 *
 * IMPORTANT:
 *
 * A normal workspace user has workspace/employee information populated.
 *
 * The Platform Owner exists only in Supabase Auth and therefore
 * intentionally has:
 *
 * - user_id = null
 * - workspace_id = null
 * - employee_no = null
 * - first_name = null
 * - middle_name = null
 * - last_name = null
 * - hire_date = null
 * - department = null
 * - position = null
 * - shift = null
 *
 * The Platform Owner is identified through `meta.platform_owner`.
 *
 * Password is NEVER included in UserContext.
 */
export type UserContext = {
  /* Identity */
  auth_user_id: string;

  user_id: string | null;

  email: string;

  display_name: string;

  avatar_url: string | null;

  /* Employee information */
  employee_no: string | null;

  first_name: string | null;

  middle_name: string | null;

  last_name: string | null;

  hire_date: string | null;

  /* Employment */
  role: UserRole;

  employment_status: EmploymentStatus;

  employment_type: EmploymentType;

  /* Authentication */
  auth_enabled: boolean;

  login_provider: string;

  invited_at: string | null;

  last_login_at: string | null;

  /* Workspace */
  workspace_id: string | null;

  department: UserDepartment | null;

  position: UserPosition | null;

  /* Current shift */
  shift: UserShift | null;

  /* Metadata */
  meta: Json;
};

/* -------------------------------------------------------------------------- */
/* Admin Users Table List                                                     */
/* -------------------------------------------------------------------------- */

export type UserListItem = {
  id: string;

  employee_no: string;

  display_name: string;

  email: string;

  avatar_url: string | null;

  role: UserRole;

  employment_status: EmploymentStatus;

  employment_type: EmploymentType;

  department: string | null;

  position: string | null;

  shift: string | null;
};

/* -------------------------------------------------------------------------- */
/* User Action Payload                                                        */
/* -------------------------------------------------------------------------- */

export type UserActionPayload = {
  id: string;

  workspace_id: string;
};
