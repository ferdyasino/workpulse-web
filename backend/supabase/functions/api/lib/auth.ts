import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

export async function getAuthenticatedUser(req: Request): Promise<User> {
  const authorization = req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing Authorization header");
  }

  const accessToken = authorization.substring(7);

  const client: SupabaseClient<Database> = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) throw error;

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
