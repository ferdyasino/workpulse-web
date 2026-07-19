import type { SupabaseClient } from "@supabase/supabase-js";

export async function getWorkspace(
  supabaseAdmin: SupabaseClient,
) {
  const { data: workspaces, error } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .limit(1);

  if (error) {
    throw error;
  }

  return {
    workspace: workspaces?.[0] ?? null,
  };
}
