import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@shared/types/database.ts";

import type {
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  WorkspaceActionPayload,
} from "@shared/types/models/workspace.types.ts";

const WORKSPACE_SELECT = `
  id,
  name,
  code,
  owner_email,
  status,
  created_at,
  updated_at,
  deleted_at
`;

async function ensureUniqueCode(
  supabaseAdmin: SupabaseClient<Database>,
  code: string,
  excludeId?: string,
) {
  let query = supabaseAdmin.from("workspaces").select("id").eq("code", code);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    throw new Error("A workspace with this code already exists.");
  }
}

export async function listWorkspaces(
  supabaseAdmin: SupabaseClient<Database>,
  includeDeleted = false,
) {
  let query = supabaseAdmin
    .from("workspaces")
    .select(WORKSPACE_SELECT)
    .order("created_at", { ascending: false });

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getWorkspace(
  supabaseAdmin: SupabaseClient<Database>,
  id: string,
) {
  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .select(WORKSPACE_SELECT)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createWorkspace(
  supabaseAdmin: SupabaseClient<Database>,
  payload: CreateWorkspacePayload,
) {
  await ensureUniqueCode(supabaseAdmin, payload.code);

  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .insert({
      id: crypto.randomUUID(),
      name: payload.name,
      code: payload.code,
      owner_email: payload.owner_email ?? null,
      status: payload.status ?? "ACTIVE",
      created_at: now,
      updated_at: now,
    })
    .select(WORKSPACE_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateWorkspace(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UpdateWorkspacePayload,
) {
  if (payload.code) {
    await ensureUniqueCode(supabaseAdmin, payload.code, payload.id);
  }

  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .update({
      name: payload.name,
      code: payload.code,
      owner_email: payload.owner_email,
      status: payload.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .is("deleted_at", null)
    .select(WORKSPACE_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateWorkspaceStatus(
  supabaseAdmin: SupabaseClient<Database>,
  payload: WorkspaceActionPayload,
  status: "ACTIVE" | "INACTIVE",
) {
  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .is("deleted_at", null)
    .select(WORKSPACE_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function activateWorkspace(
  supabaseAdmin: SupabaseClient<Database>,
  payload: WorkspaceActionPayload,
) {
  return updateWorkspaceStatus(supabaseAdmin, payload, "ACTIVE");
}

export function deactivateWorkspace(
  supabaseAdmin: SupabaseClient<Database>,
  payload: WorkspaceActionPayload,
) {
  return updateWorkspaceStatus(supabaseAdmin, payload, "INACTIVE");
}

export async function deleteWorkspace(
  supabaseAdmin: SupabaseClient<Database>,
  payload: WorkspaceActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return {
    success: true,
    id: data.id,
  };
}

export async function restoreWorkspace(
  supabaseAdmin: SupabaseClient<Database>,
  payload: WorkspaceActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .update({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .not("deleted_at", "is", null)
    .select(WORKSPACE_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function hardDeleteWorkspace(
  supabaseAdmin: SupabaseClient<Database>,
  payload: WorkspaceActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .delete()
    .eq("id", payload.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Workspace not found.");
  }

  return {
    success: true,
    id: data.id,
  };
}
