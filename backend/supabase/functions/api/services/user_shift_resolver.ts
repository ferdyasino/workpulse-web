import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.ts";

export async function resolveUserShift(
  supabaseAdmin: SupabaseClient<Database>,
  params: {
    workspace_id: string;
    user_id: string;
    date: string;
  },
) {
  const { workspace_id, user_id, date } = params;

  /*
   * 1. Check temporary override first
   */
  const { data: override, error: overrideError } = await supabaseAdmin
    .from("user_shift_overrides")
    .select(
      `
        id,
        shift_id,
        shifts (
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
    .eq("workspace_id", workspace_id)
    .eq("user_id", user_id)
    .lte("effective_from", date)
    .gte("effective_to", date)
    .is("deleted_at", null)
    .maybeSingle();

  if (overrideError) {
    throw overrideError;
  }

  if (override?.shifts) {
    return {
      source: "OVERRIDE",
      assignment_id: override.id,
      shift: override.shifts,
    };
  }

  /*
   * 2. Fall back to permanent assignment
   */
  const { data: assignment, error } = await supabaseAdmin
    .from("user_shifts")
    .select(
      `
        id,
        shift_id,
        shifts (
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
    .eq("workspace_id", workspace_id)
    .eq("user_id", user_id)
    .lte("effective_from", date)
    .or(`effective_to.is.null,effective_to.gte.${date}`)
    .is("deleted_at", null)
    .order("effective_from", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!assignment?.shifts) {
    return null;
  }

  return {
    source: "ASSIGNMENT",
    assignment_id: assignment.id,
    shift: assignment.shifts,
  };
}
