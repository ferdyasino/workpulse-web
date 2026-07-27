import type { Json } from "./json.types.ts";

export type DepartmentApiRequest =
  | {
      action: "DEPARTMENT_LIST";
      workspace_id: string;
      include_inactive?: boolean;
      include_deleted?: boolean;
    }
  | {
      action: "DEPARTMENT_CREATE";
      workspace_id: string;
      name: string;
      description?: string;
    }
  | {
      action: "DEPARTMENT_UPDATE";
      id: string;
      workspace_id: string;
      name: string;
      description?: string;
    }
  | {
      action: "DEPARTMENT_ACTIVATE";
      id: string;
      workspace_id: string;
    }
  | {
      action: "DEPARTMENT_DEACTIVATE";
      id: string;
      workspace_id: string;
    }
  | {
      action: "DEPARTMENT_DELETE";
      id: string;
      workspace_id: string;
    }
  | {
      action: "DEPARTMENT_RESTORE";
      id: string;
      workspace_id: string;
    }
  | {
      action: "DEPARTMENT_HARD_DELETE";
      id: string;
      workspace_id: string;
    };
