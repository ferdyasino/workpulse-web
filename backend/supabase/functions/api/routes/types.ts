import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

import type { ApiRequest } from "@shared/types/api/api.request.ts";

export type RouteContext = {
  req: Request;
  body: ApiRequest;
  supabaseAdmin: SupabaseClient<Database>;
  email: string;
};
