import type {
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  WorkspaceActionPayload,
} from "../models/workspace.types.ts";

export type WorkspaceApiRequest =
  | {
      action: "WORKSPACE_LIST";
      include_deleted?: boolean;
    }
  | {
      action: "WORKSPACE_GET";
      id: string;
    }
  | ({
      action: "WORKSPACE_CREATE";
    } & CreateWorkspacePayload)
  | ({
      action: "WORKSPACE_UPDATE";
    } & UpdateWorkspacePayload)
  | ({
      action: "WORKSPACE_ACTIVATE";
    } & WorkspaceActionPayload)
  | ({
      action: "WORKSPACE_DEACTIVATE";
    } & WorkspaceActionPayload)
  | ({
      action: "WORKSPACE_DELETE";
    } & WorkspaceActionPayload)
  | ({
      action: "WORKSPACE_RESTORE";
    } & WorkspaceActionPayload)
  | ({
      action: "WORKSPACE_HARD_DELETE";
    } & WorkspaceActionPayload);
