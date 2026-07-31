import type { SupabaseClient } from "@supabase/supabase-js";

import type { Json, Database } from "@shared/types/database.ts";

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
  updated_at,
  deleted_at,

  users (
    id,
    display_name,
    email
  ),

  shifts (
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
    deleted_at
  )
`;

export type CreateUserShiftOverridePayload = {
  workspace_id: string;
  user_id: string;
  shift_id: string;

  effective_from: string;
  effective_to?: string | null;

  reason?: string | null;

  metadata?: Json | null;
};

export type UpdateUserShiftOverridePayload = {
  workspace_id: string;
  id: string;

  shift_id?: string;

  effective_from?: string;
  effective_to?: string | null;

  reason?: string | null;

  metadata?: Json | null;
};

export type UserShiftOverrideActionPayload = {
  workspace_id: string;
  id: string;
};

export type ListUserShiftOverridesOptions = {
  include_deleted?: boolean;
};

function normalizeRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

type UserShiftOverrideRelation = {
  users:
    | {
        id: string;
        display_name: string;
        email: string;
      }
    | {
        id: string;
        display_name: string;
        email: string;
      }[]
    | null;

  shifts:
    | {
        id: string;
        name: string;
        description: string | null;
        start_time: string;
        end_time: string;
        timezone: string;
        grace_minutes: number;
        break_minutes: number;
        is_overnight: boolean;
        status: string;
        deleted_at: string | null;
      }
    | {
        id: string;
        name: string;
        description: string | null;
        start_time: string;
        end_time: string;
        timezone: string;
        grace_minutes: number;
        break_minutes: number;
        is_overnight: boolean;
        status: string;
        deleted_at: string | null;
      }[]
    | null;
};

function normalizeUserShiftOverride(data: UserShiftOverrideRelation | null) {
  if (!data) {
    return null;
  }

  return {
    ...data,

    users: normalizeRelation(data.users),

    shifts: normalizeRelation(data.shifts),
  };
}

function validateEffectiveDates(
  effective_from: string,
  effective_to?: string | null,
) {
  if (effective_to && effective_from > effective_to) {
    throw new Error("effective_from cannot be later than effective_to.");
  }
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
) {
  const { workspace_id, user_id, effective_from, effective_to, exclude_id } =
    params;

  let query = supabaseAdmin
    .from("user_shift_overrides")
    .select(
      `
      id,
      effective_from,
      effective_to
      `,
    )
    .eq("workspace_id", workspace_id)
    .eq("user_id", user_id)
    .is("deleted_at", null)
    .lte("effective_from", effective_to);

  if (exclude_id) {
    query = query.neq("id", exclude_id);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const overlap = (data ?? []).some((item) => {
    const existingEnd = item.effective_to ?? "9999-12-31";

    return item.effective_from <= effective_to && existingEnd >= effective_from;
  });

  if (overlap) {
    throw new Error("Shift override overlaps an existing override.");
  }
}

export async function listUserShiftOverrides(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  user_id?: string,
  options?: ListUserShiftOverridesOptions,
) {
  const { include_deleted = false } = options ?? {};

  let query = supabaseAdmin
    .from("user_shift_overrides")
    .select(USER_SHIFT_OVERRIDE_SELECT)
    .eq("workspace_id", workspace_id)
    .order("effective_from", {
      ascending: false,
    });

  if (!include_deleted) {
    query = query.is("deleted_at", null);
  }

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
  validateEffectiveDates(payload.effective_from, payload.effective_to);

  await ensureNoOverlappingOverrides(supabaseAdmin, {
    workspace_id: payload.workspace_id,
    user_id: payload.user_id,
    effective_from: payload.effective_from,
    effective_to: payload.effective_to ?? "9999-12-31",
  });

  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("user_shift_overrides")
    .insert({
      workspace_id: payload.workspace_id,
      user_id: payload.user_id,
      shift_id: payload.shift_id,
      effective_from: payload.effective_from,
      effective_to: payload.effective_to ?? null,
      reason: payload.reason ?? null,
      metadata: payload.metadata ?? null,
      created_at: now,
      updated_at: now,
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
    workspace_id,
    id,
    shift_id,
    effective_from,
    effective_to,
    reason,
    metadata,
  } = payload;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("user_shift_overrides")
    .select(
      `
      user_id,
      effective_from,
      effective_to
      `,
    )
    .eq("workspace_id", workspace_id)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (existingError) {
    throw existingError;
  }

  const nextFrom = effective_from ?? existing.effective_from;

  const nextTo =
    effective_to !== undefined ? effective_to : existing.effective_to;

  validateEffectiveDates(nextFrom, nextTo);

  await ensureNoOverlappingOverrides(supabaseAdmin, {
    workspace_id,
    user_id: existing.user_id,
    effective_from: nextFrom,
    effective_to: nextTo ?? "9999-12-31",
    exclude_id: id,
  });

  const updateData = {
    ...(shift_id !== undefined && {
      shift_id,
    }),

    ...(effective_from !== undefined && {
      effective_from,
    }),

    ...(effective_to !== undefined && {
      effective_to,
    }),

    ...(reason !== undefined && {
      reason,
    }),

    ...(metadata !== undefined && {
      metadata,
    }),

    updated_at: new Date().toISOString(),
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
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("user_shift_overrides")
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq("workspace_id", payload.workspace_id)
    .eq("id", payload.id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("User shift override not found.");
  }

  return {
    success: true,
    id: data.id,
  };
}

export async function restoreUserShiftOverride(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserShiftOverrideActionPayload,
) {
  const { workspace_id, id } = payload;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("user_shift_overrides")
    .select(
      `
      user_id,
      effective_from,
      effective_to
      `,
    )
    .eq("workspace_id", workspace_id)
    .eq("id", id)
    .not("deleted_at", "is", null)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existing) {
    throw new Error("User shift override not found.");
  }

  await ensureNoOverlappingOverrides(supabaseAdmin, {
    workspace_id,
    user_id: existing.user_id,
    effective_from: existing.effective_from,
    effective_to: existing.effective_to ?? "9999-12-31",
    exclude_id: id,
  });

  const { data, error } = await supabaseAdmin
    .from("user_shift_overrides")
    .update({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspace_id)
    .eq("id", id)
    .not("deleted_at", "is", null)
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
  const { data, error } = await supabaseAdmin
    .from("user_shift_overrides")
    .delete()
    .eq("workspace_id", payload.workspace_id)
    .eq("id", payload.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("User shift override not found.");
  }

  return {
    success: true,
    id: data.id,
  };
}
