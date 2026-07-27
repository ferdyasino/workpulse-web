import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

type ShiftPayload = {
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

type ShiftActionPayload = {
  id: string;
  workspace_id: string;
};

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
  deleted_at,
  created_at
`;

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

  const { data, error } = await query.order("name");

  if (error) {
    throw error;
  }

  return data.map((shift) => ({
    ...shift,
    status: shift.deleted_at ? "DELETED" : shift.status,
  }));
}

export async function createShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: ShiftPayload,
) {
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
      is_overnight: payload.is_overnight ?? false,
      metadata: payload.metadata ?? {},
      status: "ACTIVE",
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
  payload: ShiftPayload & {
    id: string;
  },
) {
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
      is_overnight: payload.is_overnight ?? false,
      metadata: payload.metadata ?? {},
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

export async function activateShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: ShiftActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("shifts")
    .update({
      status: "ACTIVE",
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

export async function deactivateShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: ShiftActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("shifts")
    .update({
      status: "INACTIVE",
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

export async function deleteShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: ShiftActionPayload,
) {
  const { error } = await supabaseAdmin
    .from("shifts")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  return {
    success: true,
  };
}

export async function restoreShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: ShiftActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("shifts")
    .update({
      deleted_at: null,
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
  const { error } = await supabaseAdmin
    .from("shifts")
    .delete()
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id);

  if (error) {
    throw error;
  }

  return {
    success: true,
  };
}
