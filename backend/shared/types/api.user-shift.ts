import type { Json } from "./json.types.ts";

export type UserShiftBasePayload = {
  workspace_id: string;
};

export type UserShiftActionPayload =
  | {
      workspace_id: string;

      user_id?: string;

      id?: string;

      include_deleted?: boolean;
    }
  | {
      workspace_id: string;

      user_id: string;

      shift_id: string;

      attendance_policy_id?: string | null;

      effective_from: string;

      effective_to?: string | null;

      metadata?: Json;
    }
  | {
      workspace_id: string;

      id: string;

      shift_id?: string;

      attendance_policy_id?: string | null;

      effective_from?: string;

      effective_to?: string | null;

      metadata?: Json;
    };

export type UserShiftApiRequest =
  | {
      action: "USER_SHIFT_LIST";

      workspace_id: string;

      user_id: string;

      include_deleted?: boolean;
    }
  | {
      action: "USER_SHIFT_GET";

      workspace_id: string;

      id: string;
    }
  | {
      action: "USER_SHIFT_CREATE";

      workspace_id: string;

      user_id: string;

      shift_id: string;

      attendance_policy_id?: string | null;

      effective_from: string;

      effective_to?: string | null;

      metadata?: Json;
    }
  | {
      action: "USER_SHIFT_UPDATE";

      workspace_id: string;

      id: string;

      user_id: string;

      shift_id: string;

      attendance_policy_id?: string | null;

      effective_from: string;

      effective_to?: string | null;

      metadata?: Json;
    }
  | {
      action: "USER_SHIFT_DELETE";

      workspace_id: string;

      id: string;
    }
  | {
      action: "USER_SHIFT_RESTORE";

      workspace_id: string;

      id: string;
    }
  | {
      action: "USER_SHIFT_HARD_DELETE";

      workspace_id: string;

      id: string;
    }
  | {
      action: "USER_SHIFT_RESOLVE";

      workspace_id: string;

      user_id: string;

      date: string;
    };
