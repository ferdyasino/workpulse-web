import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@shared/types/database.ts";

import type {
  ShiftPayload,
  UpdateShiftPayload,
  ShiftActionPayload,
} from "@shared/types/models/shifts.type.ts";

const SHIFT_SELECT = `
  id,
  name,
  description,
  start_time,
  end_time,
  timezone,
  grace_minutes,
  break_minutes,
  is_overnight,
  status,
  metadata,
  deleted_at,
  created_at,
  updated_at
`;

function resolveOvernight(
  start_time: string,
  end_time: string,
  provided?: boolean,
) {
  if (provided !== undefined) {
    return provided;
  }

  return end_time <= start_time;
}

function validateTime(start_time: string, end_time: string) {
  if (!start_time || !end_time) {
    throw new Error("Shift start_time and end_time are required.");
  }
}

async function ensureUniqueShiftName(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  name: string,
  excludeId?: string,
) {
  let query = supabaseAdmin
    .from("shifts")
    .select("id")
    .eq("workspace_id", workspace_id)
    .eq("name", name)
    .is("deleted_at", null);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    throw new Error("A shift with this name already exists.");
  }
}

export async function listShifts(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  options?: {
    include_inactive?: boolean;
    include_deleted?: boolean;
  },
) {
  const { include_inactive = false, include_deleted = false } = options ?? {};

  let query = supabaseAdmin
    .from("shifts")
    .select(SHIFT_SELECT)
    .eq("workspace_id", workspace_id);

  if (!include_deleted) {
    query = query.is("deleted_at", null);
  }

  if (!include_inactive) {
    query = query.eq("status", "ACTIVE");
  }

  const { data, error } = await query.order("name", {
    ascending: true,
  });

  if (error) {
    throw error;
  }

  return (data ?? []).map((shift) => ({
    ...shift,
    status: shift.deleted_at ? "DELETED" : shift.status,
  }));
}

export async function getShift(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  id: string,
) {
  const { data, error } = await supabaseAdmin
    .from("shifts")
    .select(SHIFT_SELECT)
    .eq("workspace_id", workspace_id)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: ShiftPayload,
) {
  validateTime(payload.start_time, payload.end_time);

  await ensureUniqueShiftName(
    supabaseAdmin,
    payload.workspace_id,
    payload.name,
  );

  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("shifts")
    .insert({
      workspace_id: payload.workspace_id,
      name: payload.name,
      description: payload.description ?? null,
      start_time: payload.start_time,
      end_time: payload.end_time,
      timezone: payload.timezone,
      break_minutes: payload.break_minutes ?? 60,
      grace_minutes: payload.grace_minutes ?? 10,
      is_overnight: resolveOvernight(
        payload.start_time,
        payload.end_time,
        payload.is_overnight,
      ),
      metadata: payload.metadata ?? {},
      status: "ACTIVE",
      created_at: now,
      updated_at: now,
    })
    .select(SHIFT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UpdateShiftPayload,
) {
  validateTime(payload.start_time, payload.end_time);

  await ensureUniqueShiftName(
    supabaseAdmin,
    payload.workspace_id,
    payload.name,
    payload.id,
  );

  const { data, error } = await supabaseAdmin
    .from("shifts")
    .update({
      name: payload.name,
      description: payload.description ?? null,
      start_time: payload.start_time,
      end_time: payload.end_time,
      timezone: payload.timezone,
      break_minutes: payload.break_minutes ?? 60,
      grace_minutes: payload.grace_minutes ?? 10,
      is_overnight: resolveOvernight(
        payload.start_time,
        payload.end_time,
        payload.is_overnight,
      ),
      metadata: payload.metadata ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .is("deleted_at", null)
    .select(SHIFT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateShiftStatus(
  supabaseAdmin: SupabaseClient<Database>,
  payload: ShiftActionPayload,
  status: "ACTIVE" | "INACTIVE",
) {
  const { data, error } = await supabaseAdmin
    .from("shifts")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .is("deleted_at", null)
    .select(SHIFT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function activateShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: ShiftActionPayload,
) {
  return updateShiftStatus(supabaseAdmin, payload, "ACTIVE");
}

export function deactivateShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: ShiftActionPayload,
) {
  return updateShiftStatus(supabaseAdmin, payload, "INACTIVE");
}

export async function deleteShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: ShiftActionPayload,
) {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("shifts")
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .is("deleted_at", null)
    .select(SHIFT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function restoreShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: ShiftActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("shifts")
    .update({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .not("deleted_at", "is", null)
    .select(SHIFT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function hardDeleteShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: ShiftActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("shifts")
    .delete()
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Shift not found.");
  }

  return {
    success: true,
    id: data.id,
  };
}
