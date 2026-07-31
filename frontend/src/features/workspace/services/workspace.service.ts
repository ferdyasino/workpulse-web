import { apiRequest } from "@/utils/api";

import type {
  Workspace,
  WorkspaceActionPayload,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
} from "../types/workspace.types";

const STORAGE_KEY = "active_workspace_id";

/* -------------------------------------------------------------------------- */
/* Active Workspace                                                            */
/* -------------------------------------------------------------------------- */

export function getActiveWorkspaceId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setActiveWorkspaceId(id: string): void {
  localStorage.setItem(STORAGE_KEY, id);
}

export function clearActiveWorkspace(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type WorkspaceListResponse = {
  success: boolean;
  message?: string;
  workspaces?: Workspace[];
};

type WorkspaceResponse = {
  success: boolean;
  message?: string;
  workspace?: Workspace;
};

type ActionResponse = {
  success: boolean;
  message?: string;
};

/* -------------------------------------------------------------------------- */
/* Workspace CRUD                                                              */
/* -------------------------------------------------------------------------- */

export type WorkspaceListRequest = {
  include_deleted?: boolean;
};

export async function listWorkspaces(payload: WorkspaceListRequest = {}): Promise<Workspace[]> {
  const response = await apiRequest<
    WorkspaceListResponse,
    WorkspaceListRequest & {
      action: "WORKSPACE_LIST";
    }
  >({
    action: "WORKSPACE_LIST",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to load workspaces");
  }

  return response.workspaces ?? [];
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const response = await apiRequest<
    WorkspaceResponse,
    {
      action: "WORKSPACE_GET";
      id: string;
    }
  >({
    action: "WORKSPACE_GET",
    id,
  });

  if (!response.success || !response.workspace) {
    throw new Error(response.message ?? "Failed to get workspace");
  }

  return response.workspace;
}

export async function createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
  const response = await apiRequest<
    WorkspaceResponse,
    CreateWorkspacePayload & {
      action: "WORKSPACE_CREATE";
    }
  >({
    action: "WORKSPACE_CREATE",
    ...payload,
  });

  if (!response.success || !response.workspace) {
    throw new Error(response.message ?? "Failed to create workspace");
  }

  return response.workspace;
}

export async function updateWorkspace(payload: UpdateWorkspacePayload): Promise<Workspace> {
  const response = await apiRequest<
    WorkspaceResponse,
    UpdateWorkspacePayload & {
      action: "WORKSPACE_UPDATE";
    }
  >({
    action: "WORKSPACE_UPDATE",
    ...payload,
  });

  if (!response.success || !response.workspace) {
    throw new Error(response.message ?? "Failed to update workspace");
  }

  return response.workspace;
}

export async function activateWorkspace(payload: WorkspaceActionPayload): Promise<Workspace> {
  const response = await apiRequest<
    WorkspaceResponse,
    WorkspaceActionPayload & {
      action: "WORKSPACE_ACTIVATE";
    }
  >({
    action: "WORKSPACE_ACTIVATE",
    ...payload,
  });

  if (!response.success || !response.workspace) {
    throw new Error(response.message ?? "Failed to activate workspace");
  }

  return response.workspace;
}

export async function deactivateWorkspace(payload: WorkspaceActionPayload): Promise<Workspace> {
  const response = await apiRequest<
    WorkspaceResponse,
    WorkspaceActionPayload & {
      action: "WORKSPACE_DEACTIVATE";
    }
  >({
    action: "WORKSPACE_DEACTIVATE",
    ...payload,
  });

  if (!response.success || !response.workspace) {
    throw new Error(response.message ?? "Failed to deactivate workspace");
  }

  return response.workspace;
}

export async function deleteWorkspace(payload: WorkspaceActionPayload): Promise<void> {
  const response = await apiRequest<
    ActionResponse,
    WorkspaceActionPayload & {
      action: "WORKSPACE_DELETE";
    }
  >({
    action: "WORKSPACE_DELETE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to delete workspace");
  }
}

export async function restoreWorkspace(payload: WorkspaceActionPayload): Promise<Workspace> {
  const response = await apiRequest<
    WorkspaceResponse,
    WorkspaceActionPayload & {
      action: "WORKSPACE_RESTORE";
    }
  >({
    action: "WORKSPACE_RESTORE",
    ...payload,
  });

  if (!response.success || !response.workspace) {
    throw new Error(response.message ?? "Failed to restore workspace");
  }

  return response.workspace;
}

export async function hardDeleteWorkspace(payload: WorkspaceActionPayload): Promise<void> {
  const response = await apiRequest<
    ActionResponse,
    WorkspaceActionPayload & {
      action: "WORKSPACE_HARD_DELETE";
    }
  >({
    action: "WORKSPACE_HARD_DELETE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to permanently delete workspace");
  }
}
