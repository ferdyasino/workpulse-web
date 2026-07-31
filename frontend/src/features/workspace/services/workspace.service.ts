import { apiRequest } from "@/utils/api";

import type {
  Workspace,
  WorkspaceActionPayload,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
} from "../types/workspace.types";

export async function listWorkspaces(include_deleted = false) {
  const response = await apiRequest<{
    success: boolean;
    workspaces: Workspace[];
  }>({
    action: "WORKSPACE_LIST",
    include_deleted,
  });

  return response.workspaces;
}

export async function getWorkspace(id: string) {
  const response = await apiRequest<{
    success: boolean;
    workspace: Workspace;
  }>({
    action: "WORKSPACE_GET",
    id,
  });

  return response.workspace;
}

export async function createWorkspace(payload: CreateWorkspacePayload) {
  const response = await apiRequest<{
    success: boolean;
    message: string;
    workspace: Workspace;
  }>({
    action: "WORKSPACE_CREATE",
    ...payload,
  });

  return response.workspace;
}

export async function updateWorkspace(payload: UpdateWorkspacePayload) {
  const response = await apiRequest<{
    success: boolean;
    message: string;
    workspace: Workspace;
  }>({
    action: "WORKSPACE_UPDATE",
    ...payload,
  });

  return response.workspace;
}

export async function activateWorkspace(payload: WorkspaceActionPayload) {
  const response = await apiRequest<{
    success: boolean;
    message: string;
    workspace: Workspace;
  }>({
    action: "WORKSPACE_ACTIVATE",
    ...payload,
  });

  return response.workspace;
}

export async function deactivateWorkspace(payload: WorkspaceActionPayload) {
  const response = await apiRequest<{
    success: boolean;
    message: string;
    workspace: Workspace;
  }>({
    action: "WORKSPACE_DEACTIVATE",
    ...payload,
  });

  return response.workspace;
}

export async function deleteWorkspace(payload: WorkspaceActionPayload) {
  return apiRequest<{
    success: boolean;
    message: string;
  }>({
    action: "WORKSPACE_DELETE",
    ...payload,
  });
}

export async function restoreWorkspace(payload: WorkspaceActionPayload) {
  const response = await apiRequest<{
    success: boolean;
    message: string;
    workspace: Workspace;
  }>({
    action: "WORKSPACE_RESTORE",
    ...payload,
  });

  return response.workspace;
}

export async function hardDeleteWorkspace(payload: WorkspaceActionPayload) {
  return apiRequest<{
    success: boolean;
    message: string;
  }>({
    action: "WORKSPACE_HARD_DELETE",
    ...payload,
  });
}
