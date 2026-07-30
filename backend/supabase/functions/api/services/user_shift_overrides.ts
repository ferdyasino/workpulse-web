import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

import type { Json } from "@shared/types/json.types.ts";

const USER_SHIFT_OVERRIDE_SELECT = `
  id,
  workspace_id,
  user_id,
  shift_id,
  effective_from,
  effective_to,
  reason,
  metadata,
  created_at,
  deleted_at,

  shifts (
    id,
    name,
    description,
    start_time,
    end_time,
    timezone,
    grace_minutes,
    break_minutes,
    is_overnight
  )
`;

export type CreateUserShiftOverridePayload = {
  workspace_id: string;
  user_id: string;
  shift_id: string;
  effective_from: string;
  effective_to?: string | null;
  reason?: string | null;
  metadata?: Json;
};

export type UpdateUserShiftOverridePayload = {
  workspace_id: string;
  id: string;
  shift_id?: string;
  effective_from?: string;
  effective_to?: string | null;
  reason?: string | null;
  metadata?: Json;
};

export type UserShiftOverrideActionPayload = {
  id: string;
  workspace_id: string;
};

function normalizeUserShiftOverride(data: any) {
  if (!data) {
    return null;
  }

  return {
    ...data,
    shifts: Array.isArray(data.shifts) ? data.shifts[0] : data.shifts,
  };
}

async function ensureNoOverlappingOverrides(
  supabaseAdmin: SupabaseClient<Database>,
  params: {
    workspace_id: string;
    user_id: string;
    effective_from: string;
    effective_to: string;
    exclude_id?: string;
  },
): Promise<void> {
  const { workspace_id, user_id, effective_from, effective_to, exclude_id } =
    params;

  let query = supabaseAdmin
    .from("user_shift_overrides")
    .select("id")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user_id)
    .is("deleted_at", null)
    .lte("effective_from", effective_to)
    .gte("effective_to", effective_from);

  if (exclude_id) {
    query = query.neq("id", exclude_id);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    throw error;
  }

  if ((data ?? []).length > 0) {
    throw new Error("Shift override overlaps an existing override.");
  }
}

export async function listUserShiftOverrides(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  user_id?: string,
) {
  let query = supabaseAdmin
    .from("user_shift_overrides")
    .select(USER_SHIFT_OVERRIDE_SELECT)
    .eq("workspace_id", workspace_id)
    .is("deleted_at", null)
    .order("effective_from", {
      ascending: false,
    });

  if (user_id) {
    query = query.eq("user_id", user_id);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map(normalizeUserShiftOverride);
}

export async function getUserShiftOverride(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  id: string,
) {
  const { data, error } = await supabaseAdmin
    .from("user_shift_overrides")
    .select(USER_SHIFT_OVERRIDE_SELECT)
    .eq("workspace_id", workspace_id)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeUserShiftOverride(data);
}

export async function createUserShiftOverride(
  supabaseAdmin: SupabaseClient<Database>,
  payload: CreateUserShiftOverridePayload,
) {
  const {
    workspace_id,
    user_id,
    shift_id,
    effective_from,
    effective_to,
    reason,
    metadata,
  } = payload;

  if (effective_to && effective_from > effective_to) {
    throw new Error("effective_from cannot be later than effective_to.");
  }

  await ensureNoOverlappingOverrides(supabaseAdmin, {
    workspace_id,
    user_id,
    effective_from,
    effective_to: effective_to ?? "9999-12-31",
  });

  const { data, error } = await supabaseAdmin
    .from("user_shift_overrides")
    .insert({
      workspace_id,
      user_id,
      shift_id,
      effective_from,
      effective_to: effective_to ?? null,
      reason: reason ?? null,
      metadata: metadata ?? null,
    })
    .select(USER_SHIFT_OVERRIDE_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return normalizeUserShiftOverride(data);
}

export async function updateUserShiftOverride(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UpdateUserShiftOverridePayload,
) {
  const {
    id,
    workspace_id,
    shift_id,
    effective_from,
    effective_to,
    reason,
    metadata,
  } = payload;

  const updateData = {
    ...(shift_id !== undefined && { shift_id }),
    ...(effective_from !== undefined && {
      effective_from,
    }),
    ...(effective_to !== undefined && {
      effective_to,
    }),
    ...(reason !== undefined && { reason }),
    ...(metadata !== undefined && {
      metadata,
    }),
  };

  const { data, error } = await supabaseAdmin
    .from("user_shift_overrides")
    .update(updateData)
    .eq("workspace_id", workspace_id)
    .eq("id", id)
    .is("deleted_at", null)
    .select(USER_SHIFT_OVERRIDE_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return normalizeUserShiftOverride(data);
}

export async function deleteUserShiftOverride(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserShiftOverrideActionPayload,
) {
  const { error } = await supabaseAdmin
    .from("user_shift_overrides")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("workspace_id", payload.workspace_id)
    .eq("id", payload.id);

  if (error) {
    throw error;
  }

  return {
    success: true,
  };
}

export async function restoreUserShiftOverride(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserShiftOverrideActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("user_shift_overrides")
    .update({
      deleted_at: null,
    })
    .eq("workspace_id", payload.workspace_id)
    .eq("id", payload.id)
    .select(USER_SHIFT_OVERRIDE_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return normalizeUserShiftOverride(data);
}

export async function hardDeleteUserShiftOverride(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserShiftOverrideActionPayload,
) {
  const { error } = await supabaseAdmin
    .from("user_shift_overrides")
    .delete()
    .eq("workspace_id", payload.workspace_id)
    .eq("id", payload.id);

  if (error) {
    throw error;
  }

  return {
    success: true,
  };
}
