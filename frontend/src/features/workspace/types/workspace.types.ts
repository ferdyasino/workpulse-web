export type WorkspaceStatus = "ACTIVE" | "INACTIVE";

/* -------------------------------------------------------------------------- */
/* Models                                                                      */
/* -------------------------------------------------------------------------- */

export interface Workspace {
  id: string;
  name: string;
  code: string;
  owner_email: string | null;
  status: WorkspaceStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/* -------------------------------------------------------------------------- */
/* Payloads                                                                    */
/* -------------------------------------------------------------------------- */

export interface CreateWorkspacePayload {
  name: string;
  code: string;
  owner_email?: string | null;
  status?: WorkspaceStatus;
}

export interface UpdateWorkspacePayload {
  id: string;
  name?: string;
  code?: string;
  owner_email?: string | null;
  status?: WorkspaceStatus;
}

export interface WorkspaceActionPayload {
  id: string;
}

/* -------------------------------------------------------------------------- */
/* Requests                                                                    */
/* -------------------------------------------------------------------------- */

export interface ListWorkspacesRequest {
  search?: string;
  status?: WorkspaceStatus;
  include_deleted?: boolean;
}

export interface CreateWorkspaceRequest {
  payload: CreateWorkspacePayload;
}

export interface UpdateWorkspaceRequest {
  payload: UpdateWorkspacePayload;
}

export interface WorkspaceActionRequest {
  payload: WorkspaceActionPayload;
}

/* -------------------------------------------------------------------------- */
/* Responses                                                                   */
/* -------------------------------------------------------------------------- */

export interface WorkspaceResponse {
  workspace: Workspace;
}

export interface WorkspaceListResponse {
  workspaces: Workspace[];
}

export interface WorkspaceActionResponse {
  success: boolean;
  id: string;
}

/* -------------------------------------------------------------------------- */
/* UI Types                                                                    */
/* -------------------------------------------------------------------------- */

export interface WorkspaceFilters {
  search: string;
  status: WorkspaceStatus | "ALL";
  includeDeleted: boolean;
}

export interface WorkspaceDialogState {
  open: boolean;
  mode: "create" | "edit";
  workspace: Workspace | null;
}

export interface WorkspaceFormValues {
  name: string;
  code: string;
  owner_email: string;
  status: WorkspaceStatus;
}
