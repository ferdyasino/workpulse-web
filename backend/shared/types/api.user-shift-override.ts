import type { Json } from "./json.types.ts";

export type UserShiftOverrideActionPayload =
  | {
      workspace_id: string;
      user_id?: string;
      id?: string;
    }
  | {
      workspace_id: string;
      user_id: string;
      shift_id: string;
      effective_from: string;
      effective_to?: string | null;
      reason?: string | null;
      metadata?: Json;
    }
  | {
      workspace_id: string;
      id: string;
      shift_id?: string;
      effective_from?: string;
      effective_to?: string | null;
      reason?: string | null;
      metadata?: Json;
    };

export type UserShiftOverrideApiRequest =
  | {
      action: "USER_SHIFT_OVERRIDE_LIST";
      workspace_id: string;
      user_id?: string;
    }
  | {
      action: "USER_SHIFT_OVERRIDE_GET";
      workspace_id: string;
      id: string;
    }
  | ({
      action: "USER_SHIFT_OVERRIDE_CREATE";
    } & {
      workspace_id: string;
      user_id: string;
      shift_id: string;
      effective_from: string;
      effective_to?: string | null;
      reason?: string | null;
      metadata?: Json;
    })
  | ({
      action: "USER_SHIFT_OVERRIDE_UPDATE";
    } & {
      workspace_id: string;
      id: string;
      shift_id?: string;
      effective_from?: string;
      effective_to?: string | null;
      reason?: string | null;
      metadata?: Json;
    })
  | {
      action: "USER_SHIFT_OVERRIDE_DELETE";
      workspace_id: string;
      id: string;
    }
  | {
      action: "USER_SHIFT_OVERRIDE_RESTORE";
      workspace_id: string;
      id: string;
    }
  | {
      action: "USER_SHIFT_OVERRIDE_HARD_DELETE";
      workspace_id: string;
      id: string;
    };
