import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

const USER_SHIFT_SELECT = `
  id,
  user_id,
  shift_id,
  attendance_policy_id,
  effective_from,
  effective_to,
  deleted_at,
  created_at,
  updated_at,
  metadata,

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

type UserShiftPayload = {
  workspace_id: string;

  user_id: string;

  shift_id: string;

  attendance_policy_id?: string | null;

  effective_from: string;

  effective_to?: string | null;

  metadata?: Database["public"]["Tables"]["user_shifts"]["Insert"]["metadata"];
};

type UpdateUserShiftPayload = UserShiftPayload & {
  id: string;
};

type UserShiftActionPayload = {
  id: string;
  workspace_id: string;
};

export type CurrentUserShift = {
  assignment_id: string;

  attendance_policy_id: string | null;

  effective_from: string;

  effective_to: string | null;

  shift: {
    id: string;

    name: string;

    description: string | null;

    start_time: string;

    end_time: string;

    timezone: string;

    grace_minutes: number;

    break_minutes: number;

    is_overnight: boolean;
  };
};

function normalizeShift(shift: any) {
  if (Array.isArray(shift)) {
    return shift[0] ?? null;
  }

  return shift ?? null;
}

function validateEffectiveDates(
  effective_from: string,
  effective_to?: string | null,
) {
  if (effective_to && effective_from > effective_to) {
    throw new Error("effective_from cannot be later than effective_to.");
  }
}

export async function getCurrentUserShift(
  supabaseAdmin: SupabaseClient<Database>,
  workspaceId: string,
  userId: string,
  date: string = new Date().toISOString().slice(0, 10),
): Promise<CurrentUserShift | null> {
  const { data, error } = await supabaseAdmin
    .from("user_shifts")
    .select(USER_SHIFT_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .lte("effective_from", date)
    .or(`effective_to.is.null,effective_to.gte.${date}`)
    .order("effective_from", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const shift = normalizeShift(data.shifts);

  if (!shift) {
    return null;
  }

  return {
    assignment_id: data.id,
    attendance_policy_id: data.attendance_policy_id,
    effective_from: data.effective_from,
    effective_to: data.effective_to,

    shift: {
      id: shift.id,

      name: shift.name,

      description: shift.description,

      start_time: shift.start_time,

      end_time: shift.end_time,

      timezone: shift.timezone,

      grace_minutes: shift.grace_minutes,

      break_minutes: shift.break_minutes,

      is_overnight: shift.is_overnight,
    },
  };
}

export async function listUserShifts(
  supabaseAdmin: SupabaseClient<Database>,
  workspaceId: string,
  userId: string,
  includeDeleted = false,
) {
  let query = supabaseAdmin
    .from("user_shifts")
    .select(USER_SHIFT_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .order("effective_from", {
      ascending: false,
    });

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((assignment) => ({
    ...assignment,
    shifts: normalizeShift(assignment.shifts),
  }));
}

export async function getUserShift(
  supabaseAdmin: SupabaseClient<Database>,
  workspaceId: string,
  assignmentId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("user_shifts")
    .select(USER_SHIFT_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    shifts: normalizeShift(data.shifts),
  };
}

async function ensureNoOverlap(
  supabaseAdmin: SupabaseClient<Database>,
  payload: {
    workspace_id: string;
    user_id: string;
    effective_from: string;
    effective_to?: string | null;
    excludeId?: string;
  },
) {
  let query = supabaseAdmin
    .from("user_shifts")
    .select("id")
    .eq("workspace_id", payload.workspace_id)
    .eq("user_id", payload.user_id)
    .is("deleted_at", null)
    .lte("effective_from", payload.effective_to ?? "9999-12-31")
    .or(`effective_to.is.null,effective_to.gte.${payload.effective_from}`);

  if (payload.excludeId) {
    query = query.neq("id", payload.excludeId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    throw error;
  }

  if ((data ?? []).length > 0) {
    throw new Error("The assignment overlaps an existing user shift.");
  }
}

export async function createUserShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserShiftPayload,
) {
  validateEffectiveDates(payload.effective_from, payload.effective_to);

  await ensureNoOverlap(supabaseAdmin, {
    workspace_id: payload.workspace_id,
    user_id: payload.user_id,
    effective_from: payload.effective_from,
    effective_to: payload.effective_to,
  });

  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("user_shifts")
    .insert({
      workspace_id: payload.workspace_id,
      user_id: payload.user_id,
      shift_id: payload.shift_id,

      attendance_policy_id: payload.attendance_policy_id ?? null,

      effective_from: payload.effective_from,
      effective_to: payload.effective_to ?? null,

      metadata: payload.metadata ?? {},

      created_at: now,
      updated_at: now,
    })
    .select(USER_SHIFT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    shifts: normalizeShift(data.shifts),
  };
}

export async function updateUserShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UpdateUserShiftPayload,
) {
  validateEffectiveDates(payload.effective_from, payload.effective_to);

  await ensureNoOverlap(supabaseAdmin, {
    workspace_id: payload.workspace_id,
    user_id: payload.user_id,
    effective_from: payload.effective_from,
    effective_to: payload.effective_to,
    excludeId: payload.id,
  });

  const { data, error } = await supabaseAdmin
    .from("user_shifts")
    .update({
      shift_id: payload.shift_id,

      attendance_policy_id: payload.attendance_policy_id ?? null,

      effective_from: payload.effective_from,
      effective_to: payload.effective_to ?? null,

      metadata: payload.metadata ?? {},

      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .is("deleted_at", null)
    .select(USER_SHIFT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    shifts: normalizeShift(data.shifts),
  };
}

export async function deleteUserShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserShiftActionPayload,
) {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("user_shifts")
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return {
    success: true,
    id: data.id,
  };
}

export async function restoreUserShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserShiftActionPayload,
) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("user_shifts")
    .select(
      `
          id,
          user_id,
          effective_from,
          effective_to
        `,
    )
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .not("deleted_at", "is", null)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existing) {
    throw new Error("User shift assignment not found.");
  }

  await ensureNoOverlap(supabaseAdmin, {
    workspace_id: payload.workspace_id,
    user_id: existing.user_id,
    effective_from: existing.effective_from,
    effective_to: existing.effective_to,
    excludeId: payload.id,
  });

  const { data, error } = await supabaseAdmin
    .from("user_shifts")
    .update({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .select(USER_SHIFT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    shifts: normalizeShift(data.shifts),
  };
}

export async function hardDeleteUserShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserShiftActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("user_shifts")
    .delete()
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("User shift assignment not found.");
  }

  return {
    success: true,
    id: data.id,
  };
}
