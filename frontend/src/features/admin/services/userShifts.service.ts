import { apiRequest } from "@/utils/api";

export type UserShift = {
  id: string;
  user_id: string;
  shift_id: string;
  attendance_policy_id: string | null;
  effective_from: string;
  effective_to: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;

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
  };
};

export type GetUserShiftsRequest = {
  workspace_id: string;
  user_id: string;
};

export type GetUserShiftRequest = {
  workspace_id: string;
  id: string;
};

export type CreateUserShiftRequest = {
  workspace_id: string;
  user_id: string;
  shift_id: string;
  attendance_policy_id?: string | null;
  effective_from: string;
  effective_to?: string | null;
  metadata?: Record<string, unknown>;
};

export type UpdateUserShiftRequest = {
  id: string;
  workspace_id: string;
  user_id: string;
  shift_id: string;
  attendance_policy_id?: string | null;
  effective_from: string;
  effective_to?: string | null;
  metadata?: Record<string, unknown>;
};

export type UserShiftActionRequest = {
  id: string;
  workspace_id: string;
};

type UserShiftResponse = {
  success: boolean;
  message?: string;
  user_shift?: UserShift;
};

type UserShiftListResponse = {
  success: boolean;
  message?: string;
  user_shifts?: UserShift[];
};

export async function getUserShifts(payload: GetUserShiftsRequest): Promise<UserShift[]> {
  const response = await apiRequest<
    UserShiftListResponse,
    GetUserShiftsRequest & {
      action: "USER_SHIFT_LIST";
    }
  >({
    action: "USER_SHIFT_LIST",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to load user shifts");
  }

  return response.user_shifts ?? [];
}

export async function getUserShift(payload: GetUserShiftRequest): Promise<UserShift | null> {
  const response = await apiRequest<
    UserShiftResponse,
    GetUserShiftRequest & {
      action: "USER_SHIFT_GET";
    }
  >({
    action: "USER_SHIFT_GET",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to load user shift");
  }

  return response.user_shift ?? null;
}

export async function createUserShift(payload: CreateUserShiftRequest): Promise<UserShift> {
  const response = await apiRequest<
    UserShiftResponse,
    CreateUserShiftRequest & {
      action: "USER_SHIFT_CREATE";
    }
  >({
    action: "USER_SHIFT_CREATE",
    ...payload,
  });

  if (!response.success || !response.user_shift) {
    throw new Error(response.message ?? "Failed to create user shift");
  }

  return response.user_shift;
}

export async function updateUserShift(payload: UpdateUserShiftRequest): Promise<UserShift> {
  const response = await apiRequest<
    UserShiftResponse,
    UpdateUserShiftRequest & {
      action: "USER_SHIFT_UPDATE";
    }
  >({
    action: "USER_SHIFT_UPDATE",
    ...payload,
  });

  if (!response.success || !response.user_shift) {
    throw new Error(response.message ?? "Failed to update user shift");
  }

  return response.user_shift;
}

export async function deleteUserShift(payload: UserShiftActionRequest): Promise<void> {
  const response = await apiRequest<
    {
      success: boolean;
      message?: string;
    },
    UserShiftActionRequest & {
      action: "USER_SHIFT_DELETE";
    }
  >({
    action: "USER_SHIFT_DELETE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to delete user shift");
  }
}

export async function restoreUserShift(payload: UserShiftActionRequest): Promise<UserShift> {
  const response = await apiRequest<
    UserShiftResponse,
    UserShiftActionRequest & {
      action: "USER_SHIFT_RESTORE";
    }
  >({
    action: "USER_SHIFT_RESTORE",
    ...payload,
  });

  if (!response.success || !response.user_shift) {
    throw new Error(response.message ?? "Failed to restore user shift");
  }

  return response.user_shift;
}

export async function hardDeleteUserShift(payload: UserShiftActionRequest): Promise<void> {
  const response = await apiRequest<
    {
      success: boolean;
      message?: string;
    },
    UserShiftActionRequest & {
      action: "USER_SHIFT_HARD_DELETE";
    }
  >({
    action: "USER_SHIFT_HARD_DELETE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to permanently delete user shift");
  }
}
