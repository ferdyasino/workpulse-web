import type { Workspace, WorkspaceFilters, WorkspaceFormValues } from "../types/workspace.types";

/* -------------------------------------------------------------------------- */
/* Filtering                                                                   */
/* -------------------------------------------------------------------------- */

export function filterWorkspaces(workspaces: Workspace[], filters: WorkspaceFilters): Workspace[] {
  const search = filters.search.trim().toLowerCase();

  return workspaces.filter((workspace) => {
    if (!filters.includeDeleted && workspace.deleted_at !== null) {
      return false;
    }

    if (filters.status !== "ALL" && workspace.status !== filters.status) {
      return false;
    }

    if (!search) {
      return true;
    }

    return (
      workspace.name.toLowerCase().includes(search) ||
      workspace.code.toLowerCase().includes(search) ||
      (workspace.owner_email ?? "").toLowerCase().includes(search)
    );
  });
}

/* -------------------------------------------------------------------------- */
/* Sorting                                                                     */
/* -------------------------------------------------------------------------- */

export function sortWorkspaces(workspaces: Workspace[]): Workspace[] {
  return [...workspaces].sort((a, b) => a.name.localeCompare(b.name));
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

export function validateWorkspace(values: WorkspaceFormValues): string | null {
  if (!values.name.trim()) {
    return "Workspace name is required.";
  }

  if (!values.code.trim()) {
    return "Workspace code is required.";
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Form Helpers                                                                */
/* -------------------------------------------------------------------------- */

export function workspaceToForm(workspace: Workspace): WorkspaceFormValues {
  return {
    name: workspace.name,
    code: workspace.code,
    owner_email: workspace.owner_email ?? "",
    status: workspace.status,
  };
}

/* -------------------------------------------------------------------------- */
/* Active Workspace Storage                                                    */
/* -------------------------------------------------------------------------- */

const ACTIVE_WORKSPACE_KEY = "workpulse.active_workspace";

export function getActiveWorkspaceId(): string | null {
  return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
}

export function setActiveWorkspaceId(id: string): void {
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
}

export function clearActiveWorkspaceId(): void {
  localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
}
