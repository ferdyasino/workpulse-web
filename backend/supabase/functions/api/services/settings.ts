import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.ts";
import type { Json } from "../../../../shared/types/api.types.ts";

type SettingsUpdate = {
  timezone?: string;
  locale?: string;
  currency?: string;
  metadata?: Json;
};

export async function getSettings(
  supabaseAdmin: SupabaseClient<Database>,
  workspaceId: string,
) {
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

export async function updateSettings(
  supabaseAdmin: SupabaseClient<Database>,
  workspaceId: string,
  updates: SettingsUpdate,
) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("settings")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existing) {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .insert({
        workspace_id: workspaceId,
        ...updates,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabaseAdmin
    .from("settings")
    .update(updates)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
