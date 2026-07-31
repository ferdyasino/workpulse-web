import type { Json } from "../database.ts";

export type UserRole = "OWNER" | "ADMIN" | "HR" | "SUPERVISOR" | "EMPLOYEE";

export type EmploymentStatus =
  "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";

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

/**
 * Full User database model
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

  // Relations

  department?: UserDepartment | null;

  position?: UserPosition | null;

  shift?: UserShift | null;
};

/**
 * Create User payload
 *
 * Matches users Insert logic
 */
export type CreateUserPayload = {
  workspace_id: string;

  employee_no: string;

  first_name: string;

  middle_name?: string | null;

  last_name: string;

  display_name: string;

  email: string;

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

/**
 * Update User payload
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

/**
 * Authentication user context
 */
export type UserContext = {
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

  shift: UserShift | null;
};

/**
 * Admin Users table list
 */
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

/**
 * User action payload
 */
export type UserActionPayload = {
  id: string;

  workspace_id: string;
};
