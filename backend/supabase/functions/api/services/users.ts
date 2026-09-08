import type { SupabaseClient } from "@supabase/supabase-js";

import type { Json, Database } from "@shared/types/database.ts";

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

const platformOwnerEmail = Deno.env
  .get("PLATFORM_OWNER_EMAIL")
  ?.trim()
  .toLowerCase();

function isPlatformOwnerEmail(email: string | null | undefined): boolean {
  if (!platformOwnerEmail || !email) {
    return false;
  }

  return email.trim().toLowerCase() === platformOwnerEmail;
}

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

/**
 * Check whether the user is already a member of the target workspace.
 *
 * Email is NOT globally unique.
 *
 * public.users is the global identity.
 * workspace_members is the workspace relationship.
 */
async function ensureUniqueEmail(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  email: string,
  excludeId?: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: users, error: userError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .is("deleted_at", null);

  if (userError) {
    throw userError;
  }

  if (!users || users.length === 0) {
    return;
  }

  const userIds = users.map((user) => user.id).filter((id) => id !== excludeId);

  if (userIds.length === 0) {
    return;
  }

  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from("workspace_members")
    .select("id, user_id, status, deleted_at")
    .eq("workspace_id", workspace_id)
    .in("user_id", userIds);

  if (membershipError) {
    throw membershipError;
  }

  const existingMembership = memberships?.find(
    (membership) => membership.deleted_at === null,
  );

  if (existingMembership) {
    const duplicateError = new Error(
      "A user with this email already exists in this workspace.",
    );

    Object.assign(duplicateError, {
      code: "23505",
      status: existingMembership.status,
      user_id: existingMembership.user_id,
      workspace_id,
    });

    throw duplicateError;
  }
}

/**
 * Find an existing Supabase Auth user by email.
 *
 * Supabase Admin listUsers() is paginated.
 */
async function findAuthUserByEmail(
  supabaseAdmin: SupabaseClient<Database>,
  email: string,
) {
  const normalizedEmail = email.trim().toLowerCase();

  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const authUser = data.users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (authUser) {
      return authUser;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

/**
 * Find the global WorkPulse identity using Supabase Auth ID.
 *
 * public.users.id = auth.users.id
 */
async function findPublicUserByAuthId(
  supabaseAdmin: SupabaseClient<Database>,
  authUserId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select(USER_SELECT)
    .eq("id", authUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get one workspace membership.
 *
 * workspace_members is authoritative.
 */
async function getWorkspaceMembership(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  user_id: string,
) {
  const { data, error } = await supabaseAdmin
    .from("workspace_members")
    .select(
      `
      id,
      workspace_id,
      user_id,
      role,
      department_id,
      position_id,
      employee_no,
      employment_type,
      employment_status,
      status,
      created_at,
      updated_at,
      deleted_at
    `,
    )
    .eq("workspace_id", workspace_id)
    .eq("user_id", user_id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get all active workspace memberships for a user.
 *
 * workspace_members is the authoritative source for workspace access.
 */
async function getActiveWorkspaceMemberships(
  supabaseAdmin: SupabaseClient<Database>,
  user_id: string,
) {
  const { data, error } = await supabaseAdmin
    .from("workspace_members")
    .select(
      `
      id,
      workspace_id,
      user_id,
      role,
      department_id,
      position_id,
      employee_no,
      employment_type,
      employment_status,
      status,
      created_at,
      updated_at,
      deleted_at
    `,
    )
    .eq("user_id", user_id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Resolve the operational workspace for a normal user.
 */
async function resolveNormalUserWorkspace(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
  workspace_id: string | null,
) {
  if (workspace_id) {
    const membership = await getWorkspaceMembership(
      supabaseAdmin,
      workspace_id,
      userId,
    );

    if (!membership) {
      throw new Error("User does not belong to this workspace.");
    }

    if (membership.deleted_at !== null) {
      throw new Error("User workspace membership has been deleted.");
    }

    if (membership.status !== "active") {
      throw new Error("User workspace membership is not active.");
    }

    return {
      workspace_id,
      membership,
    };
  }

  const memberships = await getActiveWorkspaceMemberships(
    supabaseAdmin,
    userId,
  );

  if (memberships.length === 0) {
    throw new Error("User does not belong to any active workspace.");
  }

  if (memberships.length > 1) {
    throw new Error("Multiple workspaces found. A workspace must be selected.");
  }

  const membership = memberships[0];

  return {
    workspace_id: membership.workspace_id,
    membership,
  };
}

/**
 * Add an existing WorkPulse user to a workspace.
 */
async function addUserToWorkspace(
  supabaseAdmin: SupabaseClient<Database>,
  payload: CreateUserPayload,
  userId: string,
) {
  const existingMembership = await getWorkspaceMembership(
    supabaseAdmin,
    payload.workspace_id,
    userId,
  );

  const now = new Date().toISOString();

  if (existingMembership) {
    if (
      existingMembership.status === "active" &&
      existingMembership.deleted_at === null
    ) {
      return {
        membership: existingMembership,
        status: "ALREADY_IN_WORKSPACE" as const,
        created: false,
      };
    }

    const { data, error } = await supabaseAdmin
      .from("workspace_members")
      .update({
        role: payload.role ?? "EMPLOYEE",
        department_id: payload.department_id ?? null,
        position_id: payload.position_id ?? null,
        employee_no: payload.employee_no ?? null,
        employment_type: payload.employment_type ?? "FULL_TIME",
        employment_status: payload.employment_status ?? "ACTIVE",
        status: "active",
        deleted_at: null,
        updated_at: now,
      })
      .eq("id", existingMembership.id)
      .select(
        `
        id,
        workspace_id,
        user_id,
        role,
        department_id,
        position_id,
        employee_no,
        employment_type,
        employment_status,
        status,
        created_at,
        updated_at,
        deleted_at
      `,
      )
      .single();

    if (error) {
      throw error;
    }

    return {
      membership: data,
      status: "ADDED_TO_WORKSPACE" as const,
      created: false,
    };
  }

  const { data, error } = await supabaseAdmin
    .from("workspace_members")
    .insert({
      workspace_id: payload.workspace_id,
      user_id: userId,
      role: payload.role ?? "EMPLOYEE",
      department_id: payload.department_id ?? null,
      position_id: payload.position_id ?? null,
      employee_no: payload.employee_no ?? null,
      employment_type: payload.employment_type ?? "FULL_TIME",
      employment_status: payload.employment_status ?? "ACTIVE",
      status: "active",
      created_at: now,
      updated_at: now,
    })
    .select(
      `
      id,
      workspace_id,
      user_id,
      role,
      department_id,
      position_id,
      employee_no,
      employment_type,
      employment_status,
      status,
      created_at,
      updated_at,
      deleted_at
    `,
    )
    .single();

  if (error) {
    throw error;
  }

  return {
    membership: data,
    status: "ADDED_TO_WORKSPACE" as const,
    created: true,
  };
}

/**
 * Validate optional authentication password.
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
 * Determine whether password is required.
 */
function requiresPassword(loginProvider?: string | null): boolean {
  const provider = loginProvider?.trim().toUpperCase();

  return provider === "EMAIL" || provider === "BOTH";
}

/**
 * Never log passwords or secrets.
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

/**
 * Get the global public user plus a workspace membership.
 *
 * This is used by workspace-scoped user-management operations.
 */
async function getWorkspaceUser(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  user_id: string,
  options?: {
    includeInactiveMembership?: boolean;
  },
) {
  const membership = await getWorkspaceMembership(
    supabaseAdmin,
    workspace_id,
    user_id,
  );

  if (!membership) {
    return null;
  }

  if (membership.deleted_at !== null) {
    return null;
  }

  if (!options?.includeInactiveMembership && membership.status !== "active") {
    return null;
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select(USER_SELECT)
    .eq("id", user_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!user) {
    return null;
  }

  return {
    user,
    membership,
  };
}

/**
 * Resolve workspace department.
 */
async function resolveDepartment(
  supabaseAdmin: SupabaseClient<Database>,
  department_id: string | null,
): Promise<UserContext["department"]> {
  if (!department_id) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("departments")
    .select("id, name")
    .eq("id", department_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? {
        id: data.id,
        name: data.name,
      }
    : null;
}

/**
 * Resolve workspace position.
 */
async function resolvePosition(
  supabaseAdmin: SupabaseClient<Database>,
  position_id: string | null,
): Promise<UserContext["position"]> {
  if (!position_id) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("positions")
    .select("id, title")
    .eq("id", position_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? {
        id: data.id,
        name: data.title,
      }
    : null;
}

/* -------------------------------------------------------------------------- */
/* Authentication / User Context                                              */
/* -------------------------------------------------------------------------- */

/**
 * Resolve the authenticated WorkPulse user.
 *
 * public.users:
 *   Global identity.
 *
 * workspace_members:
 *   Workspace-specific relationship.
 *
 * Normal users:
 *   - Must have active workspace membership.
 *   - One workspace -> automatically selected.
 *   - Multiple workspaces -> explicit workspace_id required.
 *
 * Platform Owner:
 *   - Identified by PLATFORM_OWNER_EMAIL.
 *   - Does not require workspace_members.
 *   - Can operate in any selected workspace.
 *   - Attendance operations separately enforce actual membership.
 */
export async function getUserContext(
  supabaseAdmin: SupabaseClient<Database>,
  authUserId: string,
  authEmail: string | null,
  authProvider: string | null = null,
  workspace_id: string | null = null,
): Promise<UserContext> {
  const platformOwner = isPlatformOwnerEmail(authEmail);

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
   * ------------------------------------------------------------------------
   * PLATFORM OWNER WITHOUT public.users
   * ------------------------------------------------------------------------
   */
  if (platformOwner && !user) {
    console.log(
      "PLATFORM OWNER AUTH CONTEXT WITHOUT PUBLIC USER:",
      JSON.stringify({
        auth_user_id: authUserId,
        email: authEmail,
        workspace_id,
      }),
    );

    return {
      auth_user_id: authUserId,
      user_id: null,

      email: authEmail ?? "",

      display_name: authEmail ?? "",
      avatar_url: null,

      employee_no: null,

      first_name: null,
      middle_name: null,
      last_name: null,

      hire_date: null,

      role: "OWNER" as UserRole,

      employment_status: "ACTIVE" as EmploymentStatus,

      employment_type: "FULL_TIME" as EmploymentType,

      auth_enabled: true,

      login_provider:
        authProvider?.trim().toUpperCase() === "GOOGLE" ? "GOOGLE" : "EMAIL",

      invited_at: null,

      last_login_at: null,

      workspace_id,

      department: null,

      position: null,

      shift: null,

      meta: {
        platform_owner: true,
      },
    };
  }

  /*
   * ------------------------------------------------------------------------
   * NORMAL USER WITHOUT public.users
   * ------------------------------------------------------------------------
   */
  if (!user) {
    throw new Error("User account is not registered in WorkPulse.");
  }

  /*
   * Auth identity and WorkPulse identity must match.
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
   * ------------------------------------------------------------------------
   * LOGIN PROVIDER / LAST LOGIN
   * ------------------------------------------------------------------------
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
   * Global users employment status.
   *
   * Workspace-specific employment status is handled below for normal users.
   */
  if (platformOwner && user.employment_status !== "ACTIVE") {
    throw new Error(
      `This user account is ${String(user.employment_status)
        .toLowerCase()
        .replace("_", " ")}.`,
    );
  }

  /*
   * ------------------------------------------------------------------------
   * PLATFORM OWNER
   * ------------------------------------------------------------------------
   */
  if (platformOwner) {
    let assignment = null;

    if (workspace_id) {
      console.log(
        "PLATFORM OWNER WORKSPACE CONTEXT:",
        JSON.stringify({
          user_id: user.id,
          email: user.email,
          workspace_id,
          membership_required: false,
        }),
      );

      assignment = await getCurrentUserShift(
        supabaseAdmin,
        workspace_id,
        user.id,
      );
    } else {
      console.log(
        "PLATFORM OWNER GLOBAL CONTEXT:",
        JSON.stringify({
          user_id: user.id,
          email: user.email,
          workspace_id: null,
          membership_required: false,
        }),
      );
    }

    const metadata =
      user.metadata && typeof user.metadata === "object"
        ? {
            ...(user.metadata as Record<string, Json>),
            platform_owner: true,
          }
        : {
            platform_owner: true,
          };

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

      workspace_id,

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

      meta: metadata,
    };
  }

  /*
   * ------------------------------------------------------------------------
   * NORMAL USER WORKSPACE RESOLUTION
   * ------------------------------------------------------------------------
   */
  const resolvedWorkspace = await resolveNormalUserWorkspace(
    supabaseAdmin,
    user.id,
    workspace_id,
  );

  const selectedWorkspaceId = resolvedWorkspace.workspace_id;
  const membership = resolvedWorkspace.membership;

  console.log(
    "NORMAL USER WORKSPACE CONTEXT:",
    JSON.stringify({
      user_id: user.id,
      email: user.email,
      workspace_id: selectedWorkspaceId,
      workspace_selected_explicitly: Boolean(workspace_id),
      membership_id: membership.id,
    }),
  );

  const employeeNo =
    membership.employee_no !== null ? membership.employee_no : user.employee_no;

  const employmentType =
    membership.employment_type !== null
      ? membership.employment_type
      : user.employment_type;

  const employmentStatus =
    membership.employment_status !== null
      ? membership.employment_status
      : user.employment_status;

  const department = await resolveDepartment(
    supabaseAdmin,
    membership.department_id,
  );

  const position = await resolvePosition(supabaseAdmin, membership.position_id);

  const assignment = await getCurrentUserShift(
    supabaseAdmin,
    selectedWorkspaceId,
    user.id,
  );

  return {
    auth_user_id: user.id,
    user_id: user.id,

    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,

    employee_no: employeeNo,

    first_name: user.first_name,
    middle_name: user.middle_name,
    last_name: user.last_name,

    hire_date: user.hire_date,

    role: membership.role as UserRole,

    employment_status: employmentStatus as EmploymentStatus,

    employment_type: employmentType as EmploymentType,

    auth_enabled: user.auth_enabled,

    login_provider: user.login_provider,

    invited_at: user.invited_at,

    last_login_at: user.last_login_at,

    workspace_id: selectedWorkspaceId,

    department,

    position,

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

/**
 * List users belonging to a workspace.
 *
 * IMPORTANT:
 *
 * workspace_members is the authoritative workspace relationship.
 *
 * users.workspace_id is intentionally NOT used here.
 */
export async function listUsers(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  includeDeleted = false,
): Promise<UserListItem[]> {
  /*
   * ------------------------------------------------------------------------
   * STEP 1
   * Load workspace memberships.
   * ------------------------------------------------------------------------
   */
  let membershipQuery = supabaseAdmin
    .from("workspace_members")
    .select(
      `
      id,
      workspace_id,
      user_id,
      role,
      department_id,
      position_id,
      employee_no,
      employment_type,
      employment_status,
      status,
      created_at,
      updated_at,
      deleted_at
    `,
    )
    .eq("workspace_id", workspace_id)
    .order("created_at", {
      ascending: false,
    });

  if (!includeDeleted) {
    membershipQuery = membershipQuery
      .eq("status", "active")
      .is("deleted_at", null);
  }

  const { data: memberships, error: membershipError } = await membershipQuery;

  if (membershipError) {
    throw membershipError;
  }

  if (!memberships || memberships.length === 0) {
    return [];
  }

  /*
   * ------------------------------------------------------------------------
   * STEP 2
   * Load global user identities.
   * ------------------------------------------------------------------------
   */
  const userIds = memberships.map((membership) => membership.user_id);

  const { data: users, error: userError } = await supabaseAdmin
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
      )
    `,
    )
    .in("id", userIds);

  if (userError) {
    throw userError;
  }

  if (!users || users.length === 0) {
    return [];
  }

  /*
   * ------------------------------------------------------------------------
   * STEP 3
   * Load workspace-specific shifts.
   *
   * Do not use users.workspace_id.
   * ------------------------------------------------------------------------
   */
  const { data: assignments, error: assignmentError } = await supabaseAdmin
    .from("user_shifts")
    .select(
      `
      user_id,
      effective_from,
      effective_to,
      deleted_at,

      shifts (
        name
      )
    `,
    )
    .eq("workspace_id", workspace_id);

  if (assignmentError) {
    throw assignmentError;
  }

  /*
   * ------------------------------------------------------------------------
   * STEP 4
   * Build lookup maps.
   * ------------------------------------------------------------------------
   */
  const userMap = new Map(users.map((user) => [user.id, user]));

  const assignmentMap = new Map<
    string,
    {
      effective_from: string;
      effective_to: string | null;
      deleted_at: string | null;
      shifts: {
        name: string;
      } | null;
    }
  >();

  for (const assignment of assignments ?? []) {
    if (!assignmentMap.has(assignment.user_id)) {
      assignmentMap.set(assignment.user_id, assignment);
      continue;
    }

    const existing = assignmentMap.get(assignment.user_id);

    if (existing && assignment.effective_from > existing.effective_from) {
      assignmentMap.set(assignment.user_id, assignment);
    }
  }

  /*
   * ------------------------------------------------------------------------
   * STEP 5
   * Build workspace-scoped user list.
   * ------------------------------------------------------------------------
   */
  return memberships.flatMap((membership): UserListItem[] => {
    const user = userMap.get(membership.user_id);

    if (!user) {
      return [];
    }

    /*
     * Workspace-specific values come from membership.
     */
    const employeeNo =
      membership.employee_no !== null
        ? membership.employee_no
        : user.employee_no;

    const employmentStatus =
      membership.employment_status !== null
        ? membership.employment_status
        : user.employment_status;

    const employmentType =
      membership.employment_type !== null
        ? membership.employment_type
        : user.employment_type;

    const assignment = assignmentMap.get(membership.user_id);

    const activeShift =
      assignment && isActiveShift(assignment) ? assignment : null;

    return [
      {
        id: user.id,

        employee_no: employeeNo,

        display_name: user.display_name,

        email: user.email,

        avatar_url: user.avatar_url,

        role: membership.role as UserRole,

        employment_status: employmentStatus as EmploymentStatus,

        employment_type: employmentType as EmploymentType,

        deleted_at: membership.deleted_at ?? user.deleted_at,

        department: null,

        position: null,

        shift: activeShift?.shifts?.name ?? null,
      },
    ];
  });
}

/* -------------------------------------------------------------------------- */
/* Get User                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Get a user inside a specific workspace.
 *
 * Workspace membership is authoritative.
 */
export async function getUser(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  id: string,
) {
  const result = await getWorkspaceUser(supabaseAdmin, workspace_id, id);

  if (!result) {
    return null;
  }

  const { user, membership } = result;

  return {
    ...user,

    /*
     * Override workspace-specific fields using membership.
     */
    workspace_id: membership.workspace_id,

    employee_no:
      membership.employee_no !== null
        ? membership.employee_no
        : user.employee_no,

    role: membership.role,

    employment_status:
      membership.employment_status !== null
        ? membership.employment_status
        : user.employment_status,

    employment_type:
      membership.employment_type !== null
        ? membership.employment_type
        : user.employment_type,

    department_id: membership.department_id,

    position_id: membership.position_id,

    workspace_membership: membership,
  };
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

  /*
   * Same email is allowed globally as long as the identity is not
   * already a member of this workspace.
   */
  await ensureUniqueEmail(supabaseAdmin, payload.workspace_id, email);

  /*
   * ------------------------------------------------------------------------
   * STEP 1
   * Find existing Supabase Auth identity.
   * ------------------------------------------------------------------------
   */
  const existingAuthUser = await findAuthUserByEmail(supabaseAdmin, email);

  let authUserId: string;
  let authUserWasCreated = false;

  if (existingAuthUser) {
    authUserId = existingAuthUser.id;

    console.log(
      "CREATE USER AUTH EXISTING:",
      JSON.stringify({
        auth_user_id: authUserId,
        email,
      }),
    );
  } else {
    /*
     * ----------------------------------------------------------------------
     * STEP 2
     * Create Auth identity.
     * ----------------------------------------------------------------------
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

    if (!authData.user) {
      throw new Error("Failed to create authentication user.");
    }

    authUserId = authData.user.id;
    authUserWasCreated = true;

    console.log(
      "CREATE USER AUTH CREATED:",
      JSON.stringify({
        auth_user_id: authUserId,
        email,
      }),
    );
  }

  /*
   * ------------------------------------------------------------------------
   * STEP 3
   * Check global WorkPulse identity.
   * ------------------------------------------------------------------------
   */
  const existingPublicUser = await findPublicUserByAuthId(
    supabaseAdmin,
    authUserId,
  );

  /*
   * ------------------------------------------------------------------------
   * EXISTING public.users
   *
   * Add identity to workspace only.
   * ------------------------------------------------------------------------
   */
  if (existingPublicUser) {
    console.log(
      "CREATE USER PUBLIC USER EXISTING:",
      JSON.stringify({
        user_id: existingPublicUser.id,
        email: existingPublicUser.email,
        existing_workspace_id: existingPublicUser.workspace_id,
        target_workspace_id: payload.workspace_id,
      }),
    );

    try {
      const workspaceResult = await addUserToWorkspace(
        supabaseAdmin,
        payload,
        existingPublicUser.id,
      );

      console.log(
        "CREATE USER WORKSPACE RESULT:",
        JSON.stringify({
          user_id: existingPublicUser.id,
          workspace_id: payload.workspace_id,
          status: workspaceResult.status,
        }),
      );

      return {
        ...existingPublicUser,

        create_status: workspaceResult.status,

        workspace_membership: workspaceResult.membership,

        message:
          workspaceResult.status === "ALREADY_IN_WORKSPACE"
            ? "User already exists in this workspace."
            : "Existing user added to this workspace.",
      };
    } catch (error) {
      /*
       * Existing Auth/public.users identities are never deleted.
       */
      throw error;
    }
  }

  /*
   * ------------------------------------------------------------------------
   * NEW public.users
   * ------------------------------------------------------------------------
   */
  const now = new Date().toISOString();

  const insertData: Database["public"]["Tables"]["users"]["Insert"] = {
    id: authUserId,

    /*
     * Legacy compatibility field.
     *
     * It is NOT authoritative for workspace access.
     */
    workspace_id: payload.workspace_id,

    /*
     * Global identity fields.
     */
    employee_no: payload.employee_no,

    first_name: payload.first_name,

    middle_name: payload.middle_name ?? null,

    last_name: payload.last_name,

    display_name: payload.display_name,

    email,

    avatar_url: payload.avatar_url ?? null,

    /*
     * Keep these populated for compatibility.
     *
     * Workspace-specific values are also written to workspace_members.
     */
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

  console.log(
    "CREATE USER INSERT:",
    JSON.stringify({
      ...insertData,
    }),
  );

  try {
    /*
     * ----------------------------------------------------------------------
     * STEP 4
     * Create global identity.
     * ----------------------------------------------------------------------
     */
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

      if (authUserWasCreated) {
        const { error: cleanupError } =
          await supabaseAdmin.auth.admin.deleteUser(authUserId);

        if (cleanupError) {
          console.error(
            "CREATE USER AUTH CLEANUP FAILED:",
            JSON.stringify({
              user_id: authUserId,
              message: cleanupError.message,
            }),
          );
        }
      }

      throw error;
    }

    /*
     * ----------------------------------------------------------------------
     * STEP 5
     * Create workspace relationship.
     * ----------------------------------------------------------------------
     */
    try {
      const workspaceResult = await addUserToWorkspace(
        supabaseAdmin,
        payload,
        authUserId,
      );

      console.log(
        "CREATE USER COMPLETE:",
        JSON.stringify({
          user_id: authUserId,
          workspace_id: payload.workspace_id,
          status: workspaceResult.created ? "CREATED" : workspaceResult.status,
        }),
      );

      return {
        ...data,

        create_status: workspaceResult.created
          ? ("CREATED" as const)
          : workspaceResult.status,

        workspace_membership: workspaceResult.membership,

        message: workspaceResult.created
          ? "User created successfully."
          : "User added to this workspace.",
      };
    } catch (membershipError) {
      console.error(
        "CREATE USER WORKSPACE MEMBERSHIP FAILED:",
        JSON.stringify({
          user_id: authUserId,
          workspace_id: payload.workspace_id,
          message:
            membershipError instanceof Error
              ? membershipError.message
              : String(membershipError),
        }),
      );

      /*
       * Roll back newly created global identity.
       */
      const { error: publicUserCleanupError } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", authUserId);

      if (publicUserCleanupError) {
        console.error(
          "CREATE USER PUBLIC USER CLEANUP FAILED:",
          JSON.stringify({
            user_id: authUserId,
            message: publicUserCleanupError.message,
          }),
        );
      }

      if (authUserWasCreated) {
        const { error: cleanupError } =
          await supabaseAdmin.auth.admin.deleteUser(authUserId);

        if (cleanupError) {
          console.error(
            "CREATE USER AUTH CLEANUP FAILED:",
            JSON.stringify({
              user_id: authUserId,
              message: cleanupError.message,
            }),
          );
        }
      }

      throw membershipError;
    }
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

/**
 * Update a user inside one workspace.
 *
 * Global identity fields:
 *   public.users
 *
 * Workspace-specific fields:
 *   workspace_members
 *
 * This prevents changing Workspace A's membership data from Workspace B.
 */
export async function updateUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UpdateUserPayload & {
    workspace_id: string;
    password?: string;
  },
) {
  /*
   * ------------------------------------------------------------------------
   * STEP 1
   * Validate workspace membership.
   * ------------------------------------------------------------------------
   */
  const existing = await getWorkspaceUser(
    supabaseAdmin,
    payload.workspace_id,
    payload.id,
  );

  if (!existing) {
    throw new Error("User does not belong to this workspace.");
  }

  const { user, membership } = existing;

  /*
   * ------------------------------------------------------------------------
   * STEP 2
   * Validate email uniqueness inside this workspace.
   * ------------------------------------------------------------------------
   */
  if (payload.email !== undefined) {
    await ensureUniqueEmail(
      supabaseAdmin,
      payload.workspace_id,
      payload.email.trim().toLowerCase(),
      payload.id,
    );
  }

  /*
   * ------------------------------------------------------------------------
   * STEP 3
   * Update password in Supabase Auth only.
   * ------------------------------------------------------------------------
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

  /*
   * ------------------------------------------------------------------------
   * STEP 4
   * Update GLOBAL users fields.
   *
   * Do NOT put workspace-specific membership fields here.
   * ------------------------------------------------------------------------
   */
  const updateData: Database["public"]["Tables"]["users"]["Update"] = {
    first_name: payload.first_name,

    middle_name: payload.middle_name ?? null,

    last_name: payload.last_name,

    display_name: payload.display_name,

    email:
      payload.email !== undefined
        ? payload.email.trim().toLowerCase()
        : undefined,

    avatar_url: payload.avatar_url ?? null,

    hire_date: payload.hire_date ?? null,

    auth_enabled: payload.auth_enabled ?? false,

    login_provider: payload.login_provider ?? "EMAIL",

    metadata: payload.metadata ?? {},

    updated_at: new Date().toISOString(),
  };

  console.log(
    "USER_GLOBAL_UPDATE:",
    JSON.stringify({
      id: payload.id,
      workspace_id: payload.workspace_id,
      password_changed: payload.password !== undefined,
    }),
  );

  const { data: updatedUser, error: userUpdateError } = await supabaseAdmin
    .from("users")
    .update(updateData)
    .eq("id", user.id)
    .is("deleted_at", null)
    .select(USER_SELECT)
    .single();

  if (userUpdateError) {
    console.error(
      "USER_GLOBAL_UPDATE DATABASE ERROR:",
      JSON.stringify({
        code: userUpdateError.code,
        message: userUpdateError.message,
        details: userUpdateError.details,
        hint: userUpdateError.hint,
      }),
    );

    throw userUpdateError;
  }

  /*
   * ------------------------------------------------------------------------
   * STEP 5
   * Update WORKSPACE-SPECIFIC membership fields.
   * ------------------------------------------------------------------------
   */
  const membershipUpdateData = {
    employee_no:
      payload.employee_no !== undefined
        ? payload.employee_no
        : membership.employee_no,

    role: payload.role !== undefined ? payload.role : membership.role,

    department_id:
      payload.department_id !== undefined
        ? payload.department_id
        : membership.department_id,

    position_id:
      payload.position_id !== undefined
        ? payload.position_id
        : membership.position_id,

    employment_type:
      payload.employment_type !== undefined
        ? payload.employment_type
        : membership.employment_type,

    employment_status:
      payload.employment_status !== undefined
        ? payload.employment_status
        : membership.employment_status,

    updated_at: new Date().toISOString(),
  };

  console.log(
    "USER_WORKSPACE_MEMBERSHIP_UPDATE:",
    JSON.stringify({
      id: payload.id,
      workspace_id: payload.workspace_id,
      membership_id: membership.id,
      updateData: membershipUpdateData,
    }),
  );

  const { data: updatedMembership, error: membershipUpdateError } =
    await supabaseAdmin
      .from("workspace_members")
      .update(membershipUpdateData)
      .eq("id", membership.id)
      .eq("workspace_id", payload.workspace_id)
      .eq("user_id", payload.id)
      .is("deleted_at", null)
      .select(
        `
        id,
        workspace_id,
        user_id,
        role,
        department_id,
        position_id,
        employee_no,
        employment_type,
        employment_status,
        status,
        created_at,
        updated_at,
        deleted_at
      `,
      )
      .single();

  if (membershipUpdateError) {
    console.error(
      "USER_WORKSPACE_MEMBERSHIP_UPDATE ERROR:",
      JSON.stringify({
        code: membershipUpdateError.code,
        message: membershipUpdateError.message,
        details: membershipUpdateError.details,
        hint: membershipUpdateError.hint,
      }),
    );

    throw membershipUpdateError;
  }

  return {
    ...updatedUser,

    /*
     * Return the selected workspace's values.
     */
    workspace_id: updatedMembership.workspace_id,

    employee_no:
      updatedMembership.employee_no !== null
        ? updatedMembership.employee_no
        : updatedUser.employee_no,

    role: updatedMembership.role,

    employment_status:
      updatedMembership.employment_status !== null
        ? updatedMembership.employment_status
        : updatedUser.employment_status,

    employment_type:
      updatedMembership.employment_type !== null
        ? updatedMembership.employment_type
        : updatedUser.employment_type,

    department_id: updatedMembership.department_id,

    position_id: updatedMembership.position_id,

    workspace_membership: updatedMembership,
  };
}

/* -------------------------------------------------------------------------- */
/* Activate User                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Activate a user's membership in a workspace.
 *
 * This does NOT use users.workspace_id.
 */
export async function activateUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
) {
  const membership = await getWorkspaceMembership(
    supabaseAdmin,
    payload.workspace_id,
    payload.id,
  );

  if (!membership) {
    throw new Error("User does not belong to this workspace.");
  }

  const { data, error } = await supabaseAdmin
    .from("workspace_members")
    .update({
      status: "active",
      employment_status: "ACTIVE",
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.id)
    .eq("workspace_id", payload.workspace_id)
    .eq("user_id", payload.id)
    .select(
      `
      id,
      workspace_id,
      user_id,
      role,
      department_id,
      position_id,
      employee_no,
      employment_type,
      employment_status,
      status,
      created_at,
      updated_at,
      deleted_at
    `,
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/* Deactivate User                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Deactivate only the user's membership in the selected workspace.
 */
export async function deactivateUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
) {
  const membership = await getWorkspaceMembership(
    supabaseAdmin,
    payload.workspace_id,
    payload.id,
  );

  if (!membership) {
    throw new Error("User does not belong to this workspace.");
  }

  const { data, error } = await supabaseAdmin
    .from("workspace_members")
    .update({
      status: "inactive",
      employment_status: "INACTIVE",
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.id)
    .eq("workspace_id", payload.workspace_id)
    .eq("user_id", payload.id)
    .is("deleted_at", null)
    .select(
      `
      id,
      workspace_id,
      user_id,
      role,
      department_id,
      position_id,
      employee_no,
      employment_type,
      employment_status,
      status,
      created_at,
      updated_at,
      deleted_at
    `,
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/* Soft Delete User                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Soft-delete only the user's membership in the selected workspace.
 *
 * The global public.users identity remains intact so the user can still
 * belong to other workspaces.
 */
export async function deleteUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
) {
  const membership = await getWorkspaceMembership(
    supabaseAdmin,
    payload.workspace_id,
    payload.id,
  );

  if (!membership) {
    throw new Error("User does not belong to this workspace.");
  }

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("workspace_members")
    .update({
      status: "inactive",
      deleted_at: now,
      updated_at: now,
    })
    .eq("id", membership.id)
    .eq("workspace_id", payload.workspace_id)
    .eq("user_id", payload.id)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Restore User                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Restore only the user's membership in the selected workspace.
 */
export async function restoreUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
) {
  const membership = await getWorkspaceMembership(
    supabaseAdmin,
    payload.workspace_id,
    payload.id,
  );

  if (!membership) {
    throw new Error("User does not belong to this workspace.");
  }

  const { data, error } = await supabaseAdmin
    .from("workspace_members")
    .update({
      status: "active",
      employment_status: "ACTIVE",
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.id)
    .eq("workspace_id", payload.workspace_id)
    .eq("user_id", payload.id)
    .select(
      `
      id,
      workspace_id,
      user_id,
      role,
      department_id,
      position_id,
      employee_no,
      employment_type,
      employment_status,
      status,
      created_at,
      updated_at,
      deleted_at
    `,
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/* Hard Delete User                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Hard-delete the global Auth identity.
 *
 * Because public.users.id references auth.users.id ON DELETE CASCADE,
 * this also removes public.users and its workspace memberships.
 *
 * This is intentionally global.
 */
export async function hardDeleteUser(
  supabaseAdmin: SupabaseClient<Database>,
  payload: UserActionPayload,
) {
  /*
   * Hard deletion is intentionally different from deleteUser().
   *
   * deleteUser() removes the user from ONE workspace.
   *
   * hardDeleteUser() removes the GLOBAL identity and therefore all
   * workspace memberships.
   */
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", payload.id)
    .maybeSingle();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User account not found.");
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(payload.id);

  if (error) {
    throw error;
  }
}
