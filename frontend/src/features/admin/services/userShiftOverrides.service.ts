import { apiRequest } from "@/utils/api";

export type {
  UserShiftOverride,
  GetUserShiftOverridesRequest,
  CreateUserShiftOverrideRequest,
  UpdateUserShiftOverrideRequest,
  UserShiftOverrideActionRequest,
  UserShiftOverrideResponse,
  UserShiftOverrideListResponse,
} from "../types/userShiftOverrides.types";

import type {
  UserShiftOverride,
  GetUserShiftOverridesRequest,
  CreateUserShiftOverrideRequest,
  UpdateUserShiftOverrideRequest,
  UserShiftOverrideActionRequest,
  UserShiftOverrideResponse,
  UserShiftOverrideListResponse,
} from "../types/userShiftOverrides.types";

export async function getUserShiftOverrides(
  payload: GetUserShiftOverridesRequest,
): Promise<UserShiftOverride[]> {
  const response = await apiRequest<
    UserShiftOverrideListResponse,
    GetUserShiftOverridesRequest & {
      action: "USER_SHIFT_OVERRIDE_LIST";
    }
  >({
    action: "USER_SHIFT_OVERRIDE_LIST",
    ...payload,
  });

  console.log("USER_SHIFT_OVERRIDE_LIST RESPONSE:", response);

  if (!response?.success) {
    throw new Error(response?.message ?? "Failed to load user shift overrides");
  }

  return response.user_shift_overrides ?? [];
}

export async function getUserShiftOverride(
  payload: UserShiftOverrideActionRequest,
): Promise<UserShiftOverride> {
  const response = await apiRequest<
    UserShiftOverrideResponse,
    UserShiftOverrideActionRequest & {
      action: "USER_SHIFT_OVERRIDE_GET";
    }
  >({
    action: "USER_SHIFT_OVERRIDE_GET",
    ...payload,
  });

  if (!response.success || !response.user_shift_override) {
    throw new Error(response.message ?? "Failed to load user shift override");
  }

  return response.user_shift_override;
}

export async function createUserShiftOverride(
  payload: CreateUserShiftOverrideRequest,
): Promise<UserShiftOverride> {
  const response = await apiRequest<
    UserShiftOverrideResponse,
    CreateUserShiftOverrideRequest & {
      action: "USER_SHIFT_OVERRIDE_CREATE";
    }
  >({
    action: "USER_SHIFT_OVERRIDE_CREATE",
    ...payload,
  });

  if (!response.success || !response.user_shift_override) {
    throw new Error(response.message ?? "Failed to create user shift override");
  }

  return response.user_shift_override;
}

export async function updateUserShiftOverride(
  payload: UpdateUserShiftOverrideRequest,
): Promise<UserShiftOverride> {
  const response = await apiRequest<
    UserShiftOverrideResponse,
    UpdateUserShiftOverrideRequest & {
      action: "USER_SHIFT_OVERRIDE_UPDATE";
    }
  >({
    action: "USER_SHIFT_OVERRIDE_UPDATE",
    ...payload,
  });

  if (!response.success || !response.user_shift_override) {
    throw new Error(response.message ?? "Failed to update user shift override");
  }

  return response.user_shift_override;
}

export async function deleteUserShiftOverride(
  payload: UserShiftOverrideActionRequest,
): Promise<void> {
  const response = await apiRequest<
    {
      success: boolean;
      message?: string;
    },
    UserShiftOverrideActionRequest & {
      action: "USER_SHIFT_OVERRIDE_DELETE";
    }
  >({
    action: "USER_SHIFT_OVERRIDE_DELETE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to delete user shift override");
  }
}

export async function restoreUserShiftOverride(
  payload: UserShiftOverrideActionRequest,
): Promise<UserShiftOverride> {
  const response = await apiRequest<
    UserShiftOverrideResponse,
    UserShiftOverrideActionRequest & {
      action: "USER_SHIFT_OVERRIDE_RESTORE";
    }
  >({
    action: "USER_SHIFT_OVERRIDE_RESTORE",
    ...payload,
  });

  console.log("USER_SHIFT_OVERRIDE_RESTORE RESPONSE:", response);

  if (!response?.success) {
    throw new Error(response?.message ?? "Failed to restore user shift override");
  }

  if (!response.user_shift_override) {
    throw new Error("Restore succeeded but no user shift override was returned.");
  }

  return response.user_shift_override;
}

export async function hardDeleteUserShiftOverride(
  payload: UserShiftOverrideActionRequest,
): Promise<void> {
  const response = await apiRequest<
    {
      success: boolean;
      message?: string;
    },
    UserShiftOverrideActionRequest & {
      action: "USER_SHIFT_OVERRIDE_HARD_DELETE";
    }
  >({
    action: "USER_SHIFT_OVERRIDE_HARD_DELETE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to permanently delete user shift override");
  }
}
