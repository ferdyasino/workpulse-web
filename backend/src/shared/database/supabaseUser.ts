import { createClient } from "@supabase/supabase-js";

import { env } from "../config/env.js";
import type { Database } from "./types.js";

export function createSupabaseUserClient(accessToken: string) {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
