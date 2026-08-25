import type { Database } from "../database.ts";

type ShiftRow = Database["public"]["Tables"]["shifts"]["Row"];

type ShiftMetadata = ShiftRow["metadata"];

export type ShiftPayload = {
  workspace_id: string;

  name: string;

  description?: string | null;

  start_time: string;

  end_time: string;

  timezone: string;

  grace_minutes?: number;

  break_minutes?: number;

  is_overnight?: boolean;

  metadata?: ShiftMetadata;
};

export type UpdateShiftPayload = {
  id: string;

  workspace_id: string;

  name: string;

  description?: string | null;

  start_time: string;

  end_time: string;

  timezone: string;

  grace_minutes?: number;

  break_minutes?: number;

  is_overnight?: boolean;

  metadata?: ShiftMetadata;
};

export type ShiftActionPayload = {
  id: string;

  workspace_id: string;
};
