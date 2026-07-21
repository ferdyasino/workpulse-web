import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

export async function getUserContext(
  supabaseAdmin: SupabaseClient<Database>,
  email: string,
) {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  console.log("USER:", user);
  console.log("ERROR:", error);

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  return user;
}
