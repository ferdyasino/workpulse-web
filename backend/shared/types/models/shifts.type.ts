import type { Database } from "../database.ts";

export type ShiftPayload = {
  workspace_id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  timezone: string;
  break_minutes?: number;
  grace_minutes?: number;
  is_overnight?: boolean;
  metadata?: Database["public"]["Tables"]["shifts"]["Insert"]["metadata"];
};

export type UpdateShiftPayload = ShiftPayload & {
  id: string;
};

export type ShiftActionPayload = {
  id: string;
  workspace_id: string;
};
