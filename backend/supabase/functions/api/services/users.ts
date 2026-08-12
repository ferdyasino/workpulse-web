import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@shared/types/database.ts";

import type {
  UserListItem,
  UserContext,
  UserRole,
  EmploymentStatus,
  EmploymentType,
  CreateUserPayload,
  UpdateUserPayload,
  UserActionPayload,
} from "@shared/types/models/user.types.ts";

import { getCurrentUserShift } from "./user_shifts.ts";

const USER_SELECT = `
  id,
  workspace_id,
  employee_no,

  first_name,
  middle_name,
  last_name,
  display_name,

  email,
  avatar_url,

  department_id,
  position_id,

  role,
  employment_status,
  employment_type,

  auth_enabled,
  login_provider,

  hire_date,
  invited_at,
  last_login_at,

  metadata,

  created_at,
  updated_at,
  deleted_at,

  department:departments (
    id,
    name
  ),

  position:positions (
    id,
    title
  )
`;

const today = new Date().toISOString().slice(0, 10);

function isActiveShift(item: {
  effective_from: string;
  effective_to: string | null;
  deleted_at: string | null;
}) {
  return (
    !item.deleted_at &&
    item.effective_from <= today &&
    (!item.effective_to || item.effective_to >= today)
  );
}

async function ensureUniqueEmail(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  email: string,
  excludeId?: string,
): Promise<void> {
  let query = supabaseAdmin
    .from("users")
    .select("id")
    .eq("workspace_id", workspace_id)
    .eq("email", email)
    .is("deleted_at", null);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    const duplicateError = new Error("A user with this email already exists.");

    Object.assign(duplicateError, {
      code: "23505",
    });

    throw duplicateError;
  }
}

export async function getUserContext(
  supabaseAdmin: SupabaseClient<Database>,
  email: string,
): Promise<UserContext> {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select(USER_SELECT)
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("User not found.");
  }

  const assignment = await getCurrentUserShift(
    supabaseAdmin,
    user.workspace_id,
    user.id,
  );

  return {
    // Identity
    auth_user_id: user.id,
    user_id: user.id,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,

    // Employee information
    employee_no: user.employee_no,
    first_name: user.first_name,
    middle_name: user.middle_name,
    last_name: user.last_name,
    hire_date: user.hire_date,

    // Employment
    role: user.role as UserRole,
    employment_status: user.employment_status as EmploymentStatus,
    employment_type: user.employment_type as EmploymentType,

    // Authentication
    auth_enabled: user.auth_enabled,
    login_provider: user.login_provider,
    invited_at: user.invited_at,
    last_login_at: user.last_login_at,

    // Workspace
    workspace_id: user.workspace_id,

    department: user.department
      ? {
          id: user.department.id,
          name: user.department.name,
        }
      : null,

    position: user.position
      ? {
          id: user.position.id,
          name: user.position.title,
        }
      : null,

    // Current shift
    shift: assignment
      ? {
          id: assignment.shift.id,
          name: assignment.shift.name,
          description: assignment.shift.description,
          start_time: assignment.shift.start_time,
          end_time: assignment.shift.end_time,
          timezone: assignment.shift.timezone,
          grace_minutes: assignment.shift.grace_minutes,
          break_minutes: assignment.shift.break_minutes,
          is_overnight: assignment.shift.is_overnight,
          effective_from: assignment.effective_from,
        }
      : null,

    meta: user.metadata,
  };
}

export async function listUsers(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  includeDeleted = false,
): Promise<UserListItem[]> {
  let query = supabaseAdmin
    .from("users")
    .select(
      `
      id,
      employee_no,
      email,
      display_name,
      avatar_url,
      role,
      employment_status,
      employment_type,
      deleted_at,

      department:departments (
        name
      ),

      position:positions (
        title
      ),

      user_shifts (
        effective_from,
        effective_to,
        deleted_at,

        shifts (
          name
        )
      )
    `,
    )
    .eq("workspace_id", workspace_id)
    .order("created_at", {
      ascending: false,
    });

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((user) => {
    const activeShift = user.user_shifts?.find(isActiveShift);

    return {
      id: user.id,
      employee_no: user.employee_no,
      display_name: user.display_name,
      email: user.email,
      avatar_url: user.avatar_url,

      role: user.role as UserRole,

      employment_status: user.employment_status as EmploymentStatus,

      employment_type: user.employment_type as EmploymentType,

      deleted_at: user.deleted_at,

      department: user.department?.name ?? null,

      position: user.position?.title ?? null,

      shift: activeShift?.shifts?.name ?? null,
    };
  });
}

export async function getUser(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  id: string,
) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select(USER_SELECT)
    .eq("workspace_id", workspace_id)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: CreateUserPayload,
) {
  await ensureUniqueEmail(supabaseAdmin, payload.workspace_id, payload.email);

  const now = new Date().toISOString();

  const insertData: Database["public"]["Tables"]["users"]["Insert"] = {
    id: crypto.randomUUID(),

    workspace_id: payload.workspace_id,

    employee_no: payload.employee_no,

    first_name: payload.first_name,

    middle_name: payload.middle_name ?? null,

    last_name: payload.last_name,

    display_name: payload.display_name,

    email: payload.email,

    avatar_url: payload.avatar_url ?? null,

    department_id: payload.department_id ?? null,

    position_id: payload.position_id ?? null,

    role: payload.role ?? "EMPLOYEE",

    employment_status: payload.employment_status ?? "ACTIVE",

    employment_type: payload.employment_type ?? "FULL_TIME",

    auth_enabled: payload.auth_enabled ?? false,

    login_provider: payload.login_provider ?? "EMAIL",

    metadata: payload.metadata ?? {},

    created_at: now,

    updated_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert(insertData)
    .select(USER_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UpdateUserPayload & {
    workspace_id: string;
  },
) {
  if (payload.email !== undefined) {
    await ensureUniqueEmail(
      supabaseAdmin,
      payload.workspace_id,
      payload.email,
      payload.id,
    );
  }

  const updateData: Database["public"]["Tables"]["users"]["Update"] = {
    employee_no: payload.employee_no,

    first_name: payload.first_name,

    middle_name: payload.middle_name ?? null,

    last_name: payload.last_name,

    display_name: payload.display_name,

    email: payload.email,

    avatar_url: payload.avatar_url ?? null,

    department_id: payload.department_id ?? null,

    position_id: payload.position_id ?? null,

    role: payload.role ?? "EMPLOYEE",

    employment_status: payload.employment_status ?? "ACTIVE",

    employment_type: payload.employment_type ?? "FULL_TIME",

    auth_enabled: payload.auth_enabled ?? false,

    login_provider: payload.login_provider ?? "EMAIL",

    hire_date: payload.hire_date ?? null,

    metadata: payload.metadata ?? {},

    updated_at: new Date().toISOString(),
  };

  console.log(
    "USER_UPDATE:",
    JSON.stringify({
      id: payload.id,
      workspace_id: payload.workspace_id,
      updateData,
    }),
  );

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(updateData)
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .is("deleted_at", null)
    .select(USER_SELECT)
    .single();

  if (error) {
    console.error(
      "USER_UPDATE DATABASE ERROR:",
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

async function updateUserStatus(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
  status: EmploymentStatus,
) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .update({
      employment_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .is("deleted_at", null)
    .select(USER_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function activateUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
) {
  return updateUserStatus(supabaseAdmin, payload, "ACTIVE");
}

export function deactivateUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
) {
  return updateUserStatus(supabaseAdmin, payload, "INACTIVE");
}

export async function deleteUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
) {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("users")
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
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

export async function restoreUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .update({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .not("deleted_at", "is", null)
    .select(USER_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function hardDeleteUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("User not found.");
  }

  return {
    success: true,
    id: data.id,
  };
}
