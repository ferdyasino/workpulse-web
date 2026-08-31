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

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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

/**
 * Validate an optional authentication password.
 *
 * Supabase Auth performs its own password validation as well, but validating
 * here gives the API a predictable error before making the Auth request.
 */
function validatePassword(password?: string | null): void {
  if (password === undefined || password === null) {
    return;
  }

  if (!password) {
    throw new Error("Password cannot be empty.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  if (password.length > 72) {
    throw new Error("Password must not exceed 72 characters.");
  }
}

/**
 * Determine whether a password is required for the selected login provider.
 */
function requiresPassword(loginProvider?: string | null): boolean {
  const provider = loginProvider?.trim().toUpperCase();

  return provider === "EMAIL" || provider === "BOTH";
}

/**
 * Never log a password or any authentication secret.
 */
function getSafeCreateLogPayload(
  payload: CreateUserPayload & {
    password?: string;
  },
) {
  return {
    workspace_id: payload.workspace_id,
    employee_no: payload.employee_no,
    first_name: payload.first_name,
    middle_name: payload.middle_name ?? null,
    last_name: payload.last_name,
    display_name: payload.display_name,
    email: payload.email,
    department_id: payload.department_id ?? null,
    position_id: payload.position_id ?? null,
    role: payload.role ?? "EMPLOYEE",
    employment_status: payload.employment_status ?? "ACTIVE",
    employment_type: payload.employment_type ?? "FULL_TIME",
    auth_enabled: payload.auth_enabled ?? false,
    login_provider: payload.login_provider ?? "EMAIL",
    has_password: Boolean(payload.password),
  };
}

/* -------------------------------------------------------------------------- */
/* Authentication / User Context                                              */
/* -------------------------------------------------------------------------- */

export async function getUserContext(
  supabaseAdmin: SupabaseClient<Database>,
  authUserId: string,
  authEmail: string | null,
  authProvider: string | null = null,
): Promise<UserContext> {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select(USER_SELECT)
    .eq("id", authUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  /*
   * The Auth account must already be linked to a WorkPulse employee.
   *
   * public.users.id = auth.users.id
   */
  if (!user) {
    throw new Error("User account is not registered in WorkPulse.");
  }

  /*
   * The email stored in public.users must correspond to the
   * authenticated Supabase Auth account.
   */
  if (
    authEmail &&
    user.email.trim().toLowerCase() !== authEmail.trim().toLowerCase()
  ) {
    throw new Error(
      "Authenticated email does not match the WorkPulse account.",
    );
  }

  /*
   * IMPORTANT:
   *
   * Do NOT reject Google users merely because auth_enabled is false.
   *
   * The authenticated Supabase Auth account has already passed
   * authentication. At this point we are linking that Auth account
   * to the existing public.users employee record.
   *
   * auth_enabled remains available as an application/user-management
   * field, but it is not used as the Google authentication gate.
   */

  /*
   * If authentication came from Google or email/password, synchronize
   * the provider information into public.users.
   */
  if (authProvider) {
    const normalizedProvider = authProvider.trim().toUpperCase();

    let loginProvider: string | null = null;

    if (normalizedProvider === "GOOGLE") {
      loginProvider = "GOOGLE";
    } else if (
      normalizedProvider === "EMAIL" ||
      normalizedProvider === "PASSWORD"
    ) {
      loginProvider = "EMAIL";
    }

    if (
      loginProvider &&
      user.login_provider !== loginProvider &&
      user.login_provider !== "BOTH"
    ) {
      const now = new Date().toISOString();

      const { error: providerUpdateError } = await supabaseAdmin
        .from("users")
        .update({
          login_provider: loginProvider,
          last_login_at: now,
          updated_at: now,
        })
        .eq("id", user.id);

      if (providerUpdateError) {
        throw providerUpdateError;
      }

      user.login_provider = loginProvider;
      user.last_login_at = now;
    } else {
      const now = new Date().toISOString();

      const { error: loginUpdateError } = await supabaseAdmin
        .from("users")
        .update({
          last_login_at: now,
          updated_at: now,
        })
        .eq("id", user.id);

      if (loginUpdateError) {
        throw loginUpdateError;
      }

      user.last_login_at = now;
    }
  } else {
    /*
     * Even when the provider is unavailable, record the successful
     * application login time.
     */
    const now = new Date().toISOString();

    const { error: loginUpdateError } = await supabaseAdmin
      .from("users")
      .update({
        last_login_at: now,
        updated_at: now,
      })
      .eq("id", user.id);

    if (loginUpdateError) {
      throw loginUpdateError;
    }

    user.last_login_at = now;
  }

  /*
   * Employment status remains an application authorization rule.
   *
   * Inactive/resigned/terminated users must not enter WorkPulse.
   */
  if (user.employment_status !== "ACTIVE") {
    throw new Error(
      `This user account is ${String(user.employment_status)
        .toLowerCase()
        .replace("_", " ")}.`,
    );
  }

  const assignment = await getCurrentUserShift(
    supabaseAdmin,
    user.workspace_id,
    user.id,
  );

  return {
    auth_user_id: user.id,
    user_id: user.id,

    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,

    employee_no: user.employee_no,

    first_name: user.first_name,
    middle_name: user.middle_name,
    last_name: user.last_name,

    hire_date: user.hire_date,

    role: user.role as UserRole,

    employment_status: user.employment_status as EmploymentStatus,

    employment_type: user.employment_type as EmploymentType,

    auth_enabled: user.auth_enabled,

    login_provider: user.login_provider,

    invited_at: user.invited_at,

    last_login_at: user.last_login_at,

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

/* -------------------------------------------------------------------------- */
/* User List                                                                  */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Get User                                                                   */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Create User                                                                */
/* -------------------------------------------------------------------------- */

export async function createUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: CreateUserPayload & {
    password?: string;
  },
) {
  const email = payload.email.trim().toLowerCase();

  const loginProvider = payload.login_provider?.trim().toUpperCase() ?? "EMAIL";

  validatePassword(payload.password);

  if (
    (payload.auth_enabled ?? false) &&
    requiresPassword(loginProvider) &&
    !payload.password
  ) {
    throw new Error(
      "A password is required when email/password authentication is enabled.",
    );
  }

  console.log(
    "CREATE USER PAYLOAD:",
    JSON.stringify(getSafeCreateLogPayload(payload)),
  );

  await ensureUniqueEmail(supabaseAdmin, payload.workspace_id, email);

  /*
   * public.users.id references auth.users.id.
   *
   * Therefore the Auth account MUST be created first and its UUID
   * must be used as public.users.id.
   */
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,

      ...(payload.password
        ? {
            password: payload.password,
          }
        : {}),

      email_confirm: true,

      user_metadata: {
        display_name: payload.display_name,
        first_name: payload.first_name,
        last_name: payload.last_name,
        workspace_id: payload.workspace_id,
        role: payload.role ?? "EMPLOYEE",
      },
    });

  if (authError) {
    console.error(
      "CREATE USER AUTH ERROR:",
      JSON.stringify({
        code: authError.status,
        message: authError.message,
      }),
    );

    throw authError;
  }

  const authUser = authData.user;

  if (!authUser) {
    throw new Error("Failed to create authentication user.");
  }

  const now = new Date().toISOString();

  const insertData: Database["public"]["Tables"]["users"]["Insert"] = {
    id: authUser.id,

    workspace_id: payload.workspace_id,

    employee_no: payload.employee_no,

    first_name: payload.first_name,

    middle_name: payload.middle_name ?? null,

    last_name: payload.last_name,

    display_name: payload.display_name,

    email,

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

  /*
   * IMPORTANT:
   *
   * Do NOT add password to insertData.
   *
   * Passwords are managed exclusively by Supabase Auth.
   */

  console.log(
    "CREATE USER INSERT:",
    JSON.stringify({
      ...insertData,
    }),
  );

  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert(insertData)
      .select(USER_SELECT)
      .single();

    if (error) {
      console.error(
        "CREATE USER INSERT FAILED:",
        JSON.stringify({
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        }),
      );

      const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(
        authUser.id,
      );

      if (cleanupError) {
        console.error(
          "CREATE USER AUTH CLEANUP FAILED:",
          JSON.stringify({
            user_id: authUser.id,
            message: cleanupError.message,
          }),
        );
      }

      throw error;
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "CREATE USER DATABASE ERROR:",
        JSON.stringify({
          message: error.message,
        }),
      );
    }

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Update User                                                                */
/* -------------------------------------------------------------------------- */

export async function updateUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UpdateUserPayload & {
    workspace_id: string;
    password?: string;
  },
) {
  if (payload.email !== undefined) {
    await ensureUniqueEmail(
      supabaseAdmin,
      payload.workspace_id,
      payload.email.trim().toLowerCase(),
      payload.id,
    );
  }

  /*
   * Password is an Auth-only field.
   *
   * It must never be included in public.users updateData.
   */
  if (payload.password !== undefined) {
    validatePassword(payload.password);

    if (!payload.password) {
      throw new Error("Password cannot be empty.");
    }

    const { error: passwordError } =
      await supabaseAdmin.auth.admin.updateUserById(payload.id, {
        password: payload.password,
      });

    if (passwordError) {
      console.error(
        "USER PASSWORD UPDATE ERROR:",
        JSON.stringify({
          code: passwordError.status,
          message: passwordError.message,
        }),
      );

      throw passwordError;
    }
  }

  const updateData: Database["public"]["Tables"]["users"]["Update"] = {
    employee_no: payload.employee_no,

    first_name: payload.first_name,

    middle_name: payload.middle_name ?? null,

    last_name: payload.last_name,

    display_name: payload.display_name,

    email:
      payload.email !== undefined
        ? payload.email.trim().toLowerCase()
        : undefined,

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
      password_changed: payload.password !== undefined,
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

/* -------------------------------------------------------------------------- */
/* Activate User                                                              */
/* -------------------------------------------------------------------------- */

export async function activateUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .update({
      employment_status: "ACTIVE",
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .select(USER_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/* Deactivate User                                                            */
/* -------------------------------------------------------------------------- */

export async function deactivateUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .update({
      employment_status: "INACTIVE",
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

/* -------------------------------------------------------------------------- */
/* Soft Delete User                                                           */
/* -------------------------------------------------------------------------- */

export async function deleteUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
) {
  const { error } = await supabaseAdmin
    .from("users")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Restore User                                                               */
/* -------------------------------------------------------------------------- */

export async function restoreUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .update({
      deleted_at: null,
      employment_status: "ACTIVE",
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("workspace_id", payload.workspace_id)
    .select(USER_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/* Hard Delete User                                                           */
/* -------------------------------------------------------------------------- */

export async function hardDeleteUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
) {
  /*
   * Because public.users.id references auth.users.id ON DELETE CASCADE,
   * deleting the Auth account also removes the public.users record.
   */
  const { error } = await supabaseAdmin.auth.admin.deleteUser(payload.id);

  if (error) {
    throw error;
  }
}
