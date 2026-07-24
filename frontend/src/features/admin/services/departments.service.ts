import { apiRequest } from "@/utils/api";

export type Department = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
};

export type DepartmentListRequest = {
  workspace_id: string;
};

export async function getDepartments(payload: DepartmentListRequest): Promise<Department[]> {
  return apiRequest<Department[]>({
    action: "DEPARTMENT_LIST",
    ...payload,
  });
}
