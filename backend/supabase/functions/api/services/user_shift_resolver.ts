import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@shared/types/database.ts";

const SHIFT_SELECT = `
  id,
  shift_id,
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
`;

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
   * ------------------------------------------------------------------------
   * 1. Temporary override
   * ------------------------------------------------------------------------
   */
  const { data: override, error: overrideError } = await supabaseAdmin
    .from("user_shift_overrides")
    .select(
      `
      id,
      shift_id,

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

  if (overrideError) {
    throw overrideError;
  }

  if (override) {
    /*
     * The override changes the effective shift.
     *
     * Attendance logs still reference the permanent user_shifts row.
     */
    const { data: baseAssignments, error: baseError } = await supabaseAdmin
      .from("user_shifts")
      .select("id, effective_from, effective_to")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user_id)
      .is("deleted_at", null)
      .lte("effective_from", date)
      .or(`effective_to.is.null,effective_to.gte.${date}`)
      .order("effective_from", {
        ascending: false,
      })
      .limit(1);

    if (baseError) {
      throw baseError;
    }

    const baseAssignment = baseAssignments?.[0] ?? null;

    if (!baseAssignment) {
      throw new Error(
        "User shift override exists but no permanent user shift assignment was found.",
      );
    }

    return {
      source: "OVERRIDE",

      /*
       * The actual effective assignment.
       */
      assignment_id: override.id,

      /*
       * Permanent FK used by time_logs.
       */
      user_shift_id: baseAssignment.id,

      shift: Array.isArray(override.shifts)
        ? override.shifts[0]
        : override.shifts,
    };
  }

  /*
   * ------------------------------------------------------------------------
   * 2. Permanent user shift assignment
   * ------------------------------------------------------------------------
   */
  const { data: assignments, error } = await supabaseAdmin
    .from("user_shifts")
    .select(SHIFT_SELECT)
    .eq("workspace_id", workspace_id)
    .eq("user_id", user_id)
    .is("deleted_at", null)
    .lte("effective_from", date)
    .order("effective_from", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  /*
   * The latest assignment covering the requested date wins.
   */
  const assignment = (assignments ?? []).find((item) => {
    return item.effective_to === null || item.effective_to >= date;
  });

  if (!assignment) {
    return null;
  }

  return {
    source: "ASSIGNMENT",

    /*
     * For a permanent assignment, both IDs are the same.
     */
    assignment_id: assignment.id,
    user_shift_id: assignment.id,

    shift: Array.isArray(assignment.shifts)
      ? assignment.shifts[0]
      : assignment.shifts,
  };
}
