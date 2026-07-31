export type PositionApiRequest =
  | {
      action: "POSITION_LIST";
      workspace_id: string;
      include_inactive?: boolean;
      include_deleted?: boolean;
    }
  | {
      action: "POSITION_CREATE";
      workspace_id: string;
      title: string;
      description?: string;
    }
  | {
      action: "POSITION_UPDATE";
      id: string;
      workspace_id: string;
      title: string;
      description?: string;
    }
  | {
      action: "POSITION_ACTIVATE";
      id: string;
      workspace_id: string;
    }
  | {
      action: "POSITION_DEACTIVATE";
      id: string;
      workspace_id: string;
    }
  | {
      action: "POSITION_DELETE";
      id: string;
      workspace_id: string;
    }
  | {
      action: "POSITION_RESTORE";
      id: string;
      workspace_id: string;
    }
  | {
      action: "POSITION_HARD_DELETE";
      id: string;
      workspace_id: string;
    };
