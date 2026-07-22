import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

export async function getUserContext(
  supabaseAdmin: SupabaseClient<Database>,
  email: string,
) {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select(
      `
        id,
        email,
        display_name,
        role,
        employment_status,
        workspace_id,
        department_id,
        user_shifts (
          shift_id,
          is_primary,
          shifts (
            name,
            start_time,
            end_time,
            grace_minutes
          )
        )
      `,
    )
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("User not found.");
  }

  const primaryShift = user.user_shifts?.find((item) => item.is_primary);

  return {
    auth_user_id: user.id,

    user_id: user.id,

    email: user.email,

    fullname: user.display_name,

    role: user.role,

    status: user.employment_status,

    dept_name: "",

    shift_id: primaryShift?.shift_id ?? "",

    sched: primaryShift?.shifts
      ? {
          shift_name: primaryShift.shifts.name,

          start_time: primaryShift.shifts.start_time,

          end_time: primaryShift.shifts.end_time,

          grace_minutes: String(primaryShift.shifts.grace_minutes),
        }
      : {
          shift_name: "",
          start_time: "",
          end_time: "",
          grace_minutes: "0",
        },

    workspace_id: user.workspace_id,

    workspace_url: "",

    timelog_spreadsheet_id: "",
  };
}
