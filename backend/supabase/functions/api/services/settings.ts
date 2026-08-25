import type { SupabaseClient } from "@supabase/supabase-js";

import type { Json, Database } from "@shared/types/database.ts";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SettingsUpdate = {
  timezone?: string;
  locale?: string;
  currency?: string;
  metadata?: Json;
};

type SettingsRow = Database["public"]["Tables"]["settings"]["Row"];

type SettingsInsert = Database["public"]["Tables"]["settings"]["Insert"];

type SettingsUpdateRow = Database["public"]["Tables"]["settings"]["Update"];

/* -------------------------------------------------------------------------- */
/* GET SETTINGS                                                               */
/* -------------------------------------------------------------------------- */

export async function getSettings(
  supabaseAdmin: SupabaseClient<Database>,
  workspaceId: string,
): Promise<SettingsRow | null> {
  if (!workspaceId) {
    throw new Error("Workspace ID is required.");
  }

  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/* UPDATE SETTINGS                                                            */
/* -------------------------------------------------------------------------- */

export async function updateSettings(
  supabaseAdmin: SupabaseClient<Database>,
  workspaceId: string,
  updates: SettingsUpdate,
): Promise<SettingsRow> {
  if (!workspaceId) {
    throw new Error("Workspace ID is required.");
  }

  /* ------------------------------------------------------------------------ */
  /* Check existing settings                                                  */
  /* ------------------------------------------------------------------------ */

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("settings")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  /* ------------------------------------------------------------------------ */
  /* Create settings if missing                                               */
  /* ------------------------------------------------------------------------ */

  if (!existing) {
    const insertPayload: SettingsInsert = {
      workspace_id: workspaceId,
      ...updates,
    };

    const { data, error } = await supabaseAdmin
      .from("settings")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Settings were not created.");
    }

    return data;
  }

  /* ------------------------------------------------------------------------ */
  /* Update existing settings                                                 */
  /* ------------------------------------------------------------------------ */

  const updatePayload: SettingsUpdateRow = {
    ...updates,
  };

  const { data, error } = await supabaseAdmin
    .from("settings")
    .update(updatePayload)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Settings were not updated.");
  }

  return data;
}
