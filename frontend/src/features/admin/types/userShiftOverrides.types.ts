export type UserShiftOverride = {
  id: string;

  workspace_id: string;

  user_id: string;
  shift_id: string;

  effective_from: string;
  effective_to: string | null;

  reason: string | null;

  metadata: Record<string, unknown> | null;

  created_at: string;
  deleted_at: string | null;

  users: {
    id: string;
    email: string;
    display_name: string | null;
  } | null;

  shifts: {
    id: string;

    name: string;
    description: string | null;

    start_time: string;
    end_time: string;

    timezone: string;

    grace_minutes: number;
    break_minutes: number;

    is_overnight: boolean;
  } | null;
};

export type GetUserShiftOverridesRequest = {
  workspace_id: string;

  user_id?: string;

  include_deleted?: boolean;
};

export type CreateUserShiftOverrideRequest = {
  workspace_id: string;

  user_id: string;

  shift_id: string;

  effective_from: string;

  effective_to?: string | null;

  reason?: string | null;

  metadata?: Record<string, unknown> | null;
};

export type UpdateUserShiftOverrideRequest = {
  workspace_id: string;

  id: string;

  shift_id?: string;

  effective_from?: string;

  effective_to?: string | null;

  reason?: string | null;

  metadata?: Record<string, unknown> | null;
};

export type UserShiftOverrideActionRequest = {
  workspace_id: string;

  id: string;
};

export type UserShiftOverrideResponse = {
  success: boolean;

  message?: string;

  user_shift_override?: UserShiftOverride;
};

export type UserShiftOverrideListResponse = {
  success: boolean;

  message?: string;

  user_shift_overrides?: UserShiftOverride[];
};
