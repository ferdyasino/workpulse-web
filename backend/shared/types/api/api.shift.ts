import type { Json } from "../database.ts";

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
      description?: string | null;
      start_time: string;
      end_time: string;
      timezone: string;
      break_minutes?: number;
      grace_minutes?: number;
      is_overnight?: boolean;
      metadata?: Json | null;
    }
  | {
      action: "SHIFT_UPDATE";
      id: string;
      workspace_id: string;
      name: string;
      description?: string | null;
      start_time: string;
      end_time: string;
      timezone: string;
      break_minutes?: number;
      grace_minutes?: number;
      is_overnight?: boolean;
      metadata?: Json | null;
    }
  | {
      action:
        | "SHIFT_ACTIVATE"
        | "SHIFT_DEACTIVATE"
        | "SHIFT_DELETE"
        | "SHIFT_RESTORE"
        | "SHIFT_HARD_DELETE";
      id: string;
      workspace_id: string;
    };
