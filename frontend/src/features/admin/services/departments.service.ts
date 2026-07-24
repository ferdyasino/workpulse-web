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

export type CreateDepartmentRequest = {
  workspace_id: string;
  name: string;
  description?: string;
};

type CreateDepartmentResponse = {
  success: boolean;
  message?: string;
  department?: Department;
};

export async function createDepartment(payload: CreateDepartmentRequest): Promise<Department> {
  const response = await apiRequest<CreateDepartmentResponse>({
    action: "DEPARTMENT_CREATE",
    ...payload,
  });

  if (!response.success || !response.department) {
    throw new Error(response.message ?? "Failed to create department");
  }

  return response.department;
}
