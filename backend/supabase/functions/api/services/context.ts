import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@shared/types/database.ts";

import { getUserContext } from "./users.ts";

export async function getApplicationContext(
  supabaseAdmin: SupabaseClient<Database>,
  email: string,
) {
  const userContext = await getUserContext(supabaseAdmin, email);

  if (!userContext.workspace_id) {
    throw new Error("User workspace_id is missing");
  }

  const { data: workspace, error } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .eq("id", userContext.workspace_id)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw error;
  }

  if (!workspace) {
    throw new Error("User workspace not found.");
  }

  return {
    user: {
      // Identity
      auth_user_id: userContext.auth_user_id,
      user_id: userContext.user_id,
      email: userContext.email,
      display_name: userContext.display_name,
      avatar_url: userContext.avatar_url,

      // Employee information
      employee_no: userContext.employee_no,
      first_name: userContext.first_name,
      middle_name: userContext.middle_name,
      last_name: userContext.last_name,
      hire_date: userContext.hire_date,

      // Employment
      role: userContext.role,
      employment_status: userContext.employment_status,
      employment_type: userContext.employment_type,

      // Authentication
      auth_enabled: userContext.auth_enabled,
      login_provider: userContext.login_provider,
      invited_at: userContext.invited_at,
      last_login_at: userContext.last_login_at,

      // Workspace
      workspace_id: userContext.workspace_id,
      department: userContext.department,
      position: userContext.position,

      // Current shift
      shift: userContext.shift,
      shift_id: userContext.shift?.id ?? undefined,

      // Metadata
      meta: userContext.meta,
    },

    workspace,
  };
}
