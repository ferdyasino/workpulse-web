import type { SupabaseClient } from "@supabase/supabase-js";

import { getUserContext } from "./users.ts";
import { getWorkspace } from "./workspace.ts";
import type { Database } from "@shared/types/database.ts";

export async function getApplicationContext(
  supabaseAdmin: SupabaseClient<Database>,
  email: string,
) {
  const userContext = await getUserContext(supabaseAdmin, email);

  const workspaceResult = await getWorkspace(supabaseAdmin);

  return {
    user: {
      auth_user_id: userContext.auth_user_id,

      user_id: userContext.user_id,

      email: userContext.email,

      display_name: userContext.display_name,

      avatar_url: userContext.avatar_url,

      role: userContext.role,

      employment_status: userContext.employment_status,

      workspace_id: userContext.workspace_id,

      department: userContext.department,

      position: userContext.position,

      shift: userContext.shift,

      shift_id: userContext.shift?.id ?? undefined,
    },

    workspace: workspaceResult.workspace,
  };
}
