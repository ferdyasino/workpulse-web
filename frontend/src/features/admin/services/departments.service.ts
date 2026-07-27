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

export type UpdateDepartmentRequest = SaveDepartmentRequest & {
  id: string;
};

export type DepartmentActionRequest = {
  workspace_id: string;
  id: string;
};

type DepartmentResponse = {
  success: boolean;
  message?: string;
  department?: Department;
};

type ActionResponse = {
  success: boolean;
  message?: string;
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

export async function activateDepartment(payload: DepartmentActionRequest): Promise<Department> {
  const response = await apiRequest<DepartmentResponse>({
    action: "DEPARTMENT_ACTIVATE",
    ...payload,
  });

  if (!response.success || !response.department) {
    throw new Error(response.message ?? "Failed to activate department");
  }

  return response.department;
}

export async function deactivateDepartment(payload: DepartmentActionRequest): Promise<Department> {
  const response = await apiRequest<DepartmentResponse>({
    action: "DEPARTMENT_DEACTIVATE",
    ...payload,
  });

  if (!response.success || !response.department) {
    throw new Error(response.message ?? "Failed to deactivate department");
  }

  return response.department;
}

export async function deleteDepartment(payload: DepartmentActionRequest): Promise<void> {
  const response = await apiRequest<ActionResponse>({
    action: "DEPARTMENT_DELETE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to delete department");
  }
}

export async function restoreDepartment(payload: DepartmentActionRequest): Promise<Department> {
  const response = await apiRequest<DepartmentResponse>({
    action: "DEPARTMENT_RESTORE",
    ...payload,
  });

  if (!response.success || !response.department) {
    throw new Error(response.message ?? "Failed to restore department");
  }

  return response.department;
}

export async function hardDeleteDepartment(payload: DepartmentActionRequest): Promise<void> {
  const response = await apiRequest<ActionResponse>({
    action: "DEPARTMENT_HARD_DELETE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to permanently delete department");
  }
}
