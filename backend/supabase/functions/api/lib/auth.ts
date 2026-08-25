import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

import type { Database } from "@shared/types/database.ts";

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

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Unauthorized");
  }

  console.log(
    "AUTHENTICATED USER:",
    JSON.stringify({
      id: user.id,
      email: user.email,
      provider: user.app_metadata?.provider ?? null,
      providers: user.app_metadata?.providers ?? null,
    }),
  );

  return user;
}

export function getAuthProvider(user: User): string | null {
  const provider = user.app_metadata?.provider;

  if (typeof provider === "string" && provider.trim()) {
    return provider.trim().toLowerCase();
  }

  const providers = user.app_metadata?.providers;

  if (Array.isArray(providers)) {
    const latestProvider = providers.find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );

    if (latestProvider) {
      return latestProvider.trim().toLowerCase();
    }
  }

  return null;
}
