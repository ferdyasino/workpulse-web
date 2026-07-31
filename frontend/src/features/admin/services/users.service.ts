import { apiRequest } from "@/utils/api";

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

  role: string;

  employment_status: string;

  employment_type: string;

  department: string | null;

  position: string | null;

  shift: string | null;

  department_id: string | null;

  position_id: string | null;

  auth_enabled: boolean;

  login_provider: string;

  hire_date: string | null;

  invited_at: string | null;

  last_login_at: string | null;

  metadata?: Record<string, unknown>;

  created_at: string;

  updated_at: string;

  deleted_at: string | null;
};

export type UserListRequest = {
  workspace_id: string;

  include_inactive?: boolean;

  include_deleted?: boolean;
};

type UserListResponse = {
  success: boolean;

  message?: string;

  users?: User[];
};

export async function getUsers(payload: UserListRequest): Promise<User[]> {
  const response = await apiRequest<
    UserListResponse,
    UserListRequest & {
      action: "USER_LIST";
    }
  >({
    action: "USER_LIST",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to load users");
  }

  return response.users ?? [];
}

export type SaveUserRequest = {
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

  role?: string;

  employment_status?: string;

  employment_type?: string;

  auth_enabled?: boolean;

  login_provider?: string;

  metadata?: Record<string, unknown>;
};

export type UpdateUserRequest = SaveUserRequest & {
  id: string;
};

export type UserActionRequest = {
  workspace_id: string;

  id: string;
};

type UserResponse = {
  success: boolean;

  message?: string;

  user?: User;
};

type ActionResponse = {
  success: boolean;

  message?: string;
};

export async function createUser(payload: SaveUserRequest): Promise<User> {
  const response = await apiRequest<
    UserResponse,
    SaveUserRequest & {
      action: "USER_CREATE";
    }
  >({
    action: "USER_CREATE",
    ...payload,
  });

  if (!response.success || !response.user) {
    throw new Error(response.message ?? "Failed to create user");
  }

  return response.user;
}

export async function updateUser(payload: UpdateUserRequest): Promise<User> {
  const response = await apiRequest<
    UserResponse,
    UpdateUserRequest & {
      action: "USER_UPDATE";
    }
  >({
    action: "USER_UPDATE",
    ...payload,
  });

  if (!response.success || !response.user) {
    throw new Error(response.message ?? "Failed to update user");
  }

  return response.user;
}

export async function activateUser(payload: UserActionRequest): Promise<User> {
  const response = await apiRequest<
    UserResponse,
    UserActionRequest & {
      action: "USER_ACTIVATE";
    }
  >({
    action: "USER_ACTIVATE",
    ...payload,
  });

  if (!response.success || !response.user) {
    throw new Error(response.message ?? "Failed to activate user");
  }

  return response.user;
}

export async function deactivateUser(payload: UserActionRequest): Promise<User> {
  const response = await apiRequest<
    UserResponse,
    UserActionRequest & {
      action: "USER_DEACTIVATE";
    }
  >({
    action: "USER_DEACTIVATE",
    ...payload,
  });

  if (!response.success || !response.user) {
    throw new Error(response.message ?? "Failed to deactivate user");
  }

  return response.user;
}

export async function deleteUser(payload: UserActionRequest): Promise<void> {
  const response = await apiRequest<
    ActionResponse,
    UserActionRequest & {
      action: "USER_DELETE";
    }
  >({
    action: "USER_DELETE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to delete user");
  }
}

export async function restoreUser(payload: UserActionRequest): Promise<User> {
  const response = await apiRequest<
    UserResponse,
    UserActionRequest & {
      action: "USER_RESTORE";
    }
  >({
    action: "USER_RESTORE",
    ...payload,
  });

  if (!response.success || !response.user) {
    throw new Error(response.message ?? "Failed to restore user");
  }

  return response.user;
}

export async function hardDeleteUser(payload: UserActionRequest): Promise<void> {
  const response = await apiRequest<
    ActionResponse,
    UserActionRequest & {
      action: "USER_HARD_DELETE";
    }
  >({
    action: "USER_HARD_DELETE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to permanently delete user");
  }
}
