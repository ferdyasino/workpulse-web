import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

export async function listShifts(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
) {
  const { data, error } = await supabaseAdmin
    .from("shifts")
    .select(
      `
      id,
      name,
      description,
      start_time,
      end_time,
      timezone,
      grace_minutes,
      break_minutes,
      status,
      created_at
    `,
    )
    .eq("workspace_id", workspace_id)
    .is("deleted_at", null)
    .order("name");

  if (error) {
    throw error;
  }

  return data;
}
