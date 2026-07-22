import type { SupabaseClient } from "@supabase/supabase-js";

import { getUserContext } from "./users.ts";
import { getWorkspace } from "./workspace.ts";
import type { Database } from "../types/database.ts";

export async function getApplicationContext(
  supabaseAdmin: SupabaseClient<Database>,
  email: string,
) {
  const userContext = await getUserContext(supabaseAdmin, email);

  const workspaceResult = await getWorkspace(supabaseAdmin);

  return {
    user: {
      user_id: userContext.user_id,
      email: userContext.email,

      workspace_id: userContext.workspace_id,

      role: userContext.role,

      shift_id: userContext.shift_id ?? undefined,
    },

    workspace: workspaceResult.workspace,
  };
}
