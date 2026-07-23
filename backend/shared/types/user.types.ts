export type UserRole = "OWNER" | "ADMIN" | "HR" | "SUPERVISOR" | "EMPLOYEE";

export type EmploymentStatus =
  "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";

export type UserContext = {
  auth_user_id: string;

  user_id: string;

  email: string;

  display_name: string;

  role: UserRole;

  employment_status: EmploymentStatus;

  workspace_id: string;

  shift_id: string | null;

  schedule: {
    shift_name: string;

    start_time: string;

    end_time: string;

    grace_minutes: number;
  } | null;
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
