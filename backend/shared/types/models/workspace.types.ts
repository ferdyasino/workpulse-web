export type WorkspaceStatus = "ACTIVE" | "INACTIVE";

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
