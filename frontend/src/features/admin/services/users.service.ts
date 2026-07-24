import { apiRequest } from "@/utils/api";

export type User = {
  id: string;
  employee_no: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  employment_status: string;
  employment_type: string;
  department: string | null;
  position: string | null;
  shift: string | null;
};

export type EmployeeListRequest = {
  workspace_id: string;
};

export async function getUsers(payload: EmployeeListRequest): Promise<User[]> {
  return apiRequest<User[]>({
    action: "EMPLOYEE_LIST",
    ...payload,
  });
}
