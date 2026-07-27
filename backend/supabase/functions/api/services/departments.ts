import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

export type DepartmentListItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  deleted_at: string | null;
};

export async function listDepartments(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  include_inactive = false,
  include_deleted = false,
): Promise<DepartmentListItem[]> {
  let query = supabaseAdmin
    .from("departments")
    .select(
      `
      id,
      name,
      description,
      status,
      created_at,
      deleted_at
    `,
    )
    .eq("workspace_id", workspace_id);

  if (!include_deleted) {
    query = query.is("deleted_at", null);
  }

  if (!include_inactive) {
    query = query.eq("status", "ACTIVE");
  }

  const { data, error } = await query.order("name");

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

export async function updateDepartment(
  supabaseAdmin: SupabaseClient<Database>,
  payload: {
    id: string;
    workspace_id: string;
    name: string;
    description?: string;
  },
) {
  const { data, error } = await supabaseAdmin
    .from("departments")
    .update({
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteDepartment(
  supabaseAdmin: SupabaseClient<Database>,
  payload: {
    id: string;
    workspace_id: string;
  },
) {
  const { error } = await supabaseAdmin
    .from("departments")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id);

  if (error) {
    throw error;
  }

  return {
    success: true,
  };
}

export async function activateDepartment(
  supabaseAdmin: SupabaseClient<Database>,
  payload: {
    id: string;
    workspace_id: string;
  },
) {
  const { data, error } = await supabaseAdmin
    .from("departments")
    .update({
      status: "ACTIVE",
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deactivateDepartment(
  supabaseAdmin: SupabaseClient<Database>,
  payload: {
    id: string;
    workspace_id: string;
  },
) {
  const { data, error } = await supabaseAdmin
    .from("departments")
    .update({
      status: "INACTIVE",
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function restoreDepartment(
  supabaseAdmin: SupabaseClient<Database>,
  payload: {
    id: string;
    workspace_id: string;
  },
) {
  const { data, error } = await supabaseAdmin
    .from("departments")
    .update({
      deleted_at: null,
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .not("deleted_at", "is", null)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function hardDeleteDepartment(
  supabaseAdmin: SupabaseClient<Database>,
  payload: {
    id: string;
    workspace_id: string;
  },
) {
  const { error } = await supabaseAdmin
    .from("departments")
    .delete()
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id);

  if (error) {
    throw error;
  }

  return {
    success: true,
  };
}
