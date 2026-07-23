import { apiRequest } from "@/utils/api";

export type AdminUser = {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  department_id: string | null;
  position_id: string | null;
  shift_id: string | null;
  status: string;
};

export type GetUsersRequest = {
  workspace_id: string;
};

type GetUsersResponse = {
  success: boolean;
  message?: string;
  users?: AdminUser[];
};

export async function getUsers(payload: GetUsersRequest): Promise<AdminUser[]> {
  const response = await apiRequest<GetUsersResponse>({
    action: "GET_USERS",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to load users");
  }

  return response.users ?? [];
}
