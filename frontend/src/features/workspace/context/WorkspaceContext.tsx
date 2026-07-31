import { createContext } from "react";

import type { Workspace } from "../types/workspace.types";

export interface WorkspaceContextValue {
  workspace: Workspace | null;

  workspaces: Workspace[];

  loading: boolean;

  setWorkspace: (workspace: Workspace) => void;

  refreshWorkspaces: () => Promise<void>;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);
