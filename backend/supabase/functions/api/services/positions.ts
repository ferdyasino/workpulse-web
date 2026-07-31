import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@shared/types/database.ts";

const POSITION_SELECT = `
  id,
  title,
  description,
  status,
  created_at,
  deleted_at
`;

export async function listPositions(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  include_inactive = false,
  include_deleted = false,
) {
  let query = supabaseAdmin
    .from("positions")
    .select(POSITION_SELECT)
    .eq("workspace_id", workspace_id);

  if (!include_deleted) {
    query = query.is("deleted_at", null);
  }

  if (!include_inactive) {
    query = query.eq("status", "ACTIVE");
  }

  const { data, error } = await query.order("title");

  if (error) {
    throw error;
  }

  return data;
}

export async function createPosition(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  title: string,
  description?: string | null,
) {
  const { data, error } = await supabaseAdmin
    .from("positions")
    .insert({
      workspace_id,
      title,
      description: description ?? null,
    })
    .select(POSITION_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updatePosition(
  supabaseAdmin: SupabaseClient<Database>,
  id: string,
  updates: Database["public"]["Tables"]["positions"]["Update"],
) {
  const { data, error } = await supabaseAdmin
    .from("positions")
    .update(updates)
    .eq("id", id)
    .is("deleted_at", null)
    .select(POSITION_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function activatePosition(
  supabaseAdmin: SupabaseClient<Database>,
  id: string,
) {
  return updatePosition(supabaseAdmin, id, {
    status: "ACTIVE",
  });
}

export async function deactivatePosition(
  supabaseAdmin: SupabaseClient<Database>,
  id: string,
) {
  return updatePosition(supabaseAdmin, id, {
    status: "INACTIVE",
  });
}

export async function deletePosition(
  supabaseAdmin: SupabaseClient<Database>,
  id: string,
) {
  const { error } = await supabaseAdmin
    .from("positions")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  return {
    success: true,
  };
}

export async function restorePosition(
  supabaseAdmin: SupabaseClient<Database>,
  id: string,
) {
  const { data, error } = await supabaseAdmin
    .from("positions")
    .update({
      deleted_at: null,
    })
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select(POSITION_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function hardDeletePosition(
  supabaseAdmin: SupabaseClient<Database>,
  id: string,
) {
  const { error } = await supabaseAdmin.from("positions").delete().eq("id", id);

  if (error) {
    throw error;
  }

  return {
    success: true,
  };
}
