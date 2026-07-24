import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

export async function listPositions(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
) {
  const { data, error } = await supabaseAdmin
    .from("positions")
    .select(
      `
      id,
      title,
      description,
      status,
      created_at
    `,
    )
    .eq("workspace_id", workspace_id)
    .is("deleted_at", null)
    .order("title");

  if (error) {
    throw error;
  }

  return data;
}
