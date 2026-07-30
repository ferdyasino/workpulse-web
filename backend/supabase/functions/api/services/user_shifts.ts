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

  shifts!inner (
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

type UserShiftPayload = {
  workspace_id: string;

  user_id: string;

  shift_id: string;

  attendance_policy_id?: string | null;

  effective_from: string;

  effective_to?: string | null;
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

  const shift = Array.isArray(data.shifts) ? data.shifts[0] : data.shifts;

  if (!shift) {
    return null;
  }

  return {
    assignment_id: data.id,

    attendance_policy_id: data.attendance_policy_id,

    effective_from: data.effective_from,

    effective_to: data.effective_to,

    shift,
  };
}

export async function listUserShifts(
  supabaseAdmin: SupabaseClient<Database>,
  workspaceId: string,
  userId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("user_shifts")
    .select(USER_SHIFT_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("effective_from", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []).map((assignment) => ({
    ...assignment,
    shifts: Array.isArray(assignment.shifts)
      ? assignment.shifts[0]
      : assignment.shifts,
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
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    shifts: Array.isArray(data.shifts) ? data.shifts[0] : data.shifts,
  };
}

export async function createUserShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserShiftPayload,
) {
  if (payload.effective_to && payload.effective_from > payload.effective_to) {
    throw new Error("effective_from cannot be later than effective_to.");
  }

  const { data: overlap, error: overlapError } = await supabaseAdmin
    .from("user_shifts")
    .select("id")
    .eq("workspace_id", payload.workspace_id)
    .eq("user_id", payload.user_id)
    .is("deleted_at", null)
    .lte("effective_from", payload.effective_to ?? "9999-12-31")
    .or(`effective_to.is.null,effective_to.gte.${payload.effective_from}`)
    .limit(1);

  if (overlapError) {
    throw overlapError;
  }

  if ((overlap ?? []).length > 0) {
    throw new Error("The assignment overlaps an existing user shift.");
  }

  const { data, error } = await supabaseAdmin
    .from("user_shifts")
    .insert({
      workspace_id: payload.workspace_id,
      user_id: payload.user_id,
      shift_id: payload.shift_id,
      attendance_policy_id: payload.attendance_policy_id ?? null,
      effective_from: payload.effective_from,
      effective_to: payload.effective_to ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select(USER_SHIFT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    shifts: Array.isArray(data.shifts) ? data.shifts[0] : data.shifts,
  };
}

export async function updateUserShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UpdateUserShiftPayload,
) {
  if (payload.effective_to && payload.effective_from > payload.effective_to) {
    throw new Error("effective_from cannot be later than effective_to.");
  }

  const { data: overlap, error: overlapError } = await supabaseAdmin
    .from("user_shifts")
    .select("id")
    .eq("workspace_id", payload.workspace_id)
    .eq("user_id", payload.user_id)
    .neq("id", payload.id)
    .is("deleted_at", null)
    .lte("effective_from", payload.effective_to ?? "9999-12-31")
    .or(`effective_to.is.null,effective_to.gte.${payload.effective_from}`)
    .limit(1);

  if (overlapError) {
    throw overlapError;
  }

  if ((overlap ?? []).length > 0) {
    throw new Error("The assignment overlaps an existing user shift.");
  }

  const { data, error } = await supabaseAdmin
    .from("user_shifts")
    .update({
      shift_id: payload.shift_id,
      attendance_policy_id: payload.attendance_policy_id ?? null,
      effective_from: payload.effective_from,
      effective_to: payload.effective_to ?? null,
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
    shifts: Array.isArray(data.shifts) ? data.shifts[0] : data.shifts,
  };
}

export async function deleteUserShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserShiftActionPayload,
) {
  const { error } = await supabaseAdmin
    .from("user_shifts")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

export async function restoreUserShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserShiftActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("user_shifts")
    .update({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .not("deleted_at", "is", null)
    .select(USER_SHIFT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    shifts: Array.isArray(data.shifts) ? data.shifts[0] : data.shifts,
  };
}

export async function hardDeleteUserShift(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserShiftActionPayload,
) {
  const { error } = await supabaseAdmin
    .from("user_shifts")
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
