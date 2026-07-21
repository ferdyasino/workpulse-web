import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.ts";

export const supabaseAdmin = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
