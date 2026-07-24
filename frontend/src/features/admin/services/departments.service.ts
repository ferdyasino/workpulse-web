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

export type SaveDepartmentRequest = {
  workspace_id: string;
  name: string;
  description?: string;
};

type DepartmentResponse = {
  success: boolean;
  message?: string;
  department?: Department;
};

export async function createDepartment(payload: SaveDepartmentRequest): Promise<Department> {
  const response = await apiRequest<DepartmentResponse>({
    action: "DEPARTMENT_CREATE",
    ...payload,
  });

  if (!response.success || !response.department) {
    throw new Error(response.message ?? "Failed to create department");
  }

  return response.department;
}

export type UpdateDepartmentRequest = SaveDepartmentRequest & {
  id: string;
};

export async function updateDepartment(payload: UpdateDepartmentRequest): Promise<Department> {
  const response = await apiRequest<DepartmentResponse>({
    action: "DEPARTMENT_UPDATE",
    ...payload,
  });

  if (!response.success || !response.department) {
    throw new Error(response.message ?? "Failed to update department");
  }

  return response.department;
}

export type DeleteDepartmentRequest = {
  workspace_id: string;
  id: string;
};

type DeleteDepartmentResponse = {
  success: boolean;
  message?: string;
};

export async function deleteDepartment(payload: DeleteDepartmentRequest): Promise<void> {
  const response = await apiRequest<DeleteDepartmentResponse>({
    action: "DEPARTMENT_DELETE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to delete department");
  }
}
