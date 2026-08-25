import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@shared/types/database.ts";

const POSITION_SELECT = `;
(id,
  workspace_id,
  title,
  description,
  status,
  created_at,
  updated_at,
  deleted_at`;

/* -------------------------------------------------------------------------- */
/* List                                                                       */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Create                                                                     */
/* -------------------------------------------------------------------------- */

export async function createPosition(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  title: string,
  description?: string | null,
) {
  const insertData: Database["public"]["Tables"]["positions"]["Insert"] = {
    workspace_id,
    title,
    description: description ?? null,
  };

  console.log("POSITION CREATE:", JSON.stringify(insertData));

  const { data, error } = await supabaseAdmin
    .from("positions")
    .insert(insertData)
    .select(POSITION_SELECT)
    .single();

  if (error) {
    console.error(
      "POSITION CREATE DATABASE ERROR:",
      JSON.stringify({
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }),
    );

    throw error;
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/* Update                                                                     */
/* -------------------------------------------------------------------------- */

export async function updatePosition(
  supabaseAdmin: SupabaseClient<Database>,
  id: string,
  workspace_id: string,
  updates: Database["public"]["Tables"]["positions"]["Update"],
) {
  const updateData: Database["public"]["Tables"]["positions"]["Update"] = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  console.log(
    "POSITION UPDATE:",
    JSON.stringify({
      id,
      workspace_id,
      updateData,
    }),
  );

  const { data, error } = await supabaseAdmin
    .from("positions")
    .update(updateData)
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .is("deleted_at", null)
    .select(POSITION_SELECT)
    .single();

  if (error) {
    console.error(
      "POSITION UPDATE DATABASE ERROR:",
      JSON.stringify({
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }),
    );

    throw error;
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/* Activate                                                                   */
/* -------------------------------------------------------------------------- */

export function activatePosition(
  supabaseAdmin: SupabaseClient<Database>,
  id: string,
  workspace_id: string,
) {
  return updatePosition(supabaseAdmin, id, workspace_id, {
    status: "ACTIVE",
  });
}

/* -------------------------------------------------------------------------- */
/* Deactivate                                                                 */
/* -------------------------------------------------------------------------- */

export function deactivatePosition(
  supabaseAdmin: SupabaseClient<Database>,
  id: string,
  workspace_id: string,
) {
  return updatePosition(supabaseAdmin, id, workspace_id, {
    status: "INACTIVE",
  });
}

/* -------------------------------------------------------------------------- */
/* Soft Delete                                                                */
/* -------------------------------------------------------------------------- */

export async function deletePosition(
  supabaseAdmin: SupabaseClient<Database>,
  id: string,
  workspace_id: string,
) {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("positions")
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    console.error(
      "POSITION DELETE DATABASE ERROR:",
      JSON.stringify({
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }),
    );

    throw error;
  }

  return {
    success: true,
    id: data.id,
  };
}

/* -------------------------------------------------------------------------- */
/* Restore                                                                    */
/* -------------------------------------------------------------------------- */

export async function restorePosition(
  supabaseAdmin: SupabaseClient<Database>,
  id: string,
  workspace_id: string,
) {
  const { data, error } = await supabaseAdmin
    .from("positions")
    .update({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .not("deleted_at", "is", null)
    .select(POSITION_SELECT)
    .single();

  if (error) {
    console.error(
      "POSITION RESTORE DATABASE ERROR:",
      JSON.stringify({
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }),
    );

    throw error;
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/* Hard Delete                                                                */
/* -------------------------------------------------------------------------- */

export async function hardDeletePosition(
  supabaseAdmin: SupabaseClient<Database>,
  id: string,
  workspace_id: string,
) {
  const { data, error } = await supabaseAdmin
    .from("positions")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "POSITION HARD DELETE DATABASE ERROR:",
      JSON.stringify({
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }),
    );

    throw error;
  }

  if (!data) {
    throw new Error("Position not found.");
  }

  return {
    success: true,
    id: data.id,
  };
}
