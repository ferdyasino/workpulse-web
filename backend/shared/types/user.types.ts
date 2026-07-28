import type { ShiftStatus } from "./api.shift.ts";

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

  status: ShiftStatus;

  start_time: string;

  end_time: string;

  timezone: string;

  grace_minutes: number;

  break_minutes: number;

  is_overnight: boolean;

  effective_from: string;
};

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

export type EmployeeListItem = {
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
