import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

export type CurrentUserShift = {
  assignment_id: string;

  attendance_policy_id: string | null;

  effective_from: string;

  effective_to: string | null;

  shift: {
    id: string;
    name: string;
    description: string | null;
    status: string;

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
    .select(
      `
      id,
      attendance_policy_id,
      effective_from,
      effective_to,

      shifts!inner (
        id,
        name,
        description,
        status,
        start_time,
        end_time,
        timezone,
        grace_minutes,
        break_minutes,
        is_overnight
      )
      `,
    )
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
