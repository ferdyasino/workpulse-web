import type { Json } from "../models/json.types.ts";

export type ShiftStatus = "ACTIVE" | "INACTIVE";

export type ShiftApiRequest =
  | {
      action: "SHIFT_LIST";
      workspace_id: string;
      include_inactive?: boolean;
      include_deleted?: boolean;
    }
  | {
      action: "SHIFT_CREATE";
      workspace_id: string;
      name: string;
      description?: string;
      start_time: string;
      end_time: string;
      timezone: string;
      break_minutes?: number;
      grace_minutes?: number;
      is_overnight?: boolean;
      metadata?: Json;
    }
  | {
      action: "SHIFT_UPDATE";
      id: string;
      workspace_id: string;
      name: string;
      description?: string;
      start_time: string;
      end_time: string;
      timezone: string;
      break_minutes?: number;
      grace_minutes?: number;
      is_overnight?: boolean;
      metadata?: Json;
    }
  | {
      action: "SHIFT_ACTIVATE";
      id: string;
      workspace_id: string;
    }
  | {
      action: "SHIFT_DEACTIVATE";
      id: string;
      workspace_id: string;
    }
  | {
      action: "SHIFT_DELETE";
      id: string;
      workspace_id: string;
    }
  | {
      action: "SHIFT_RESTORE";
      id: string;
      workspace_id: string;
    }
  | {
      action: "SHIFT_HARD_DELETE";
      id: string;
      workspace_id: string;
    };
