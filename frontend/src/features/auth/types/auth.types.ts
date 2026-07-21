export type UserRole = "OWNER" | "ADMIN" | "HR" | "USER" | "SUPERADMIN";

export type Shift = {
  shift_name: string;
  start_time: string;
  end_time: string;
  grace_minutes: string;
};

export type User = {
  auth_user_id: string;
  user_id: string;

  email: string;
  fullname: string;

  role: UserRole | string;
  status: string;

  dept_name: string;

  shift_id?: string | null;
  sched?: Shift | null;

  workspace_id: string;
  workspace_url: string;
  timelog_spreadsheet_id: string;

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
