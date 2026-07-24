import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

export type DepartmentListItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
};

export async function listDepartments(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
): Promise<DepartmentListItem[]> {
  const { data, error } = await supabaseAdmin
    .from("departments")
    .select(
      `
      id,
      name,
      description,
      status,
      created_at
    `,
    )
    .eq("workspace_id", workspace_id)
    .is("deleted_at", null)
    .order("name");

  if (error) {
    throw error;
  }

  return data;
}

export async function createDepartment(
  supabaseAdmin: SupabaseClient<Database>,
  payload: {
    workspace_id: string;
    name: string;
    description?: string;
  },
) {
  const { data, error } = await supabaseAdmin
    .from("departments")
    .insert({
      workspace_id: payload.workspace_id,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
