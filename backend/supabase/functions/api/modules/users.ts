import type { SupabaseClient } from "@supabase/supabase-js";

export async function getUserContext(
  supabaseAdmin: SupabaseClient,
  email: string,
) {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select(
      `
      *,
      departments (
        id,
        name
      ),
      positions (
        id,
        title
      )
    `,
    )
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    user,
  };
}
