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
 * Email is NOT globally unique anymore.
 *
 * The same Auth/public.users identity can belong to multiple workspaces.
 */
async function ensureUniqueEmail(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
  email: string,
  excludeId?: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  /*
   * Find public.users records matching the email.
   *
   * We intentionally do not use workspace_id here because the canonical
   * workspace relationship is now workspace_members.
   */
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

  /*
   * Check whether any matching identity already belongs to this workspace.
   */
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
 * Supabase Admin listUsers() is paginated, so continue until the email
 * is found or all Auth users have been checked.
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
 * Find an existing WorkPulse user using the Supabase Auth ID.
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
 * Get the existing workspace membership for a user.
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
 * Add an existing WorkPulse user to a workspace.
 *
 * If a soft-deleted membership exists, restore it instead of trying to
 * create a duplicate row because workspace_members has a unique
 * (workspace_id, user_id) constraint.
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

  /*
   * Membership already exists.
   */
  if (existingMembership) {
    /*
     * Active membership.
     */
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

    /*
     * Existing membership is inactive/suspended/deleted.
     *
     * Restore it because the unique constraint prevents inserting
     * another workspace_members row for the same user/workspace pair.
     */
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

  /*
   * No membership exists.
   *
   * Create the workspace-specific relationship.
   */
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

/**
 * Resolve the authenticated WorkPulse user.
 *
 * IMPORTANT:
 *
 * public.users is the global identity.
 * workspace_members is the workspace-specific relationship.
 *
 * Normal users:
 *   - MUST have a selected workspace.
 *   - MUST have an active workspace_members record.
 *
 * Platform Owner:
 *   - Is identified globally by PLATFORM_OWNER_EMAIL.
 *   - Does NOT require a workspace_members record.
 *   - Does NOT require a selected workspace during login/context creation.
 *   - May select any workspace later.
 *   - Uses the real public.users.id when the public.users record exists.
 *   - Uses the selected workspace for attendance/shift operations.
 *
 * This allows the Platform Owner to log in before selecting a workspace.
 */
export async function getUserContext(
  supabaseAdmin: SupabaseClient<Database>,
  authUserId: string,
  authEmail: string | null,
  authProvider: string | null = null,
  workspace_id: string | null = null,
): Promise<UserContext> {
  /*
   * ------------------------------------------------------------------------
   * STEP 1
   * Determine Platform Owner from the authenticated email FIRST.
   *
   * This is intentionally done before requiring public.users.
   *
   * A Platform Owner may exist in Auth without a public.users record.
   * ------------------------------------------------------------------------
   */
  const platformOwner = isPlatformOwnerEmail(authEmail);

  /*
   * ------------------------------------------------------------------------
   * STEP 2
   * Find the WorkPulse public.users identity.
   *
   * Platform Owner is allowed to continue when this does not exist.
   * Normal users are not.
   * ------------------------------------------------------------------------
   */
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
   *
   * This is valid.
   *
   * The authenticated email itself is enough to establish global
   * Platform Owner privilege.
   *
   * There is no real WorkPulse user_id in this situation, so the
   * context cannot be used for attendance/time logging until a
   * public.users record exists.
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

      /*
       * No public.users identity exists yet.
       */
      user_id: null,

      email: authEmail ?? "",

      display_name: authEmail ?? "",
      avatar_url: null,

      employee_no: null,

      first_name: null,
      middle_name: null,
      last_name: null,

      hire_date: null,

      /*
       * PLATFORM_OWNER is a global privilege and is intentionally
       * represented through metadata rather than UserRole.
       *
       * The UserContext role still needs to satisfy UserRole.
       */
      role: "OWNER" as UserRole,

      employment_status: "ACTIVE" as EmploymentStatus,

      employment_type: "FULL_TIME" as EmploymentType,

      /*
       * The Auth account itself is authenticated.
       */
      auth_enabled: true,

      login_provider:
        authProvider?.trim().toUpperCase() === "GOOGLE" ? "GOOGLE" : "EMAIL",

      invited_at: null,

      last_login_at: null,

      /*
       * If no workspace has been selected yet, this remains null.
       *
       * Once the Platform Owner selects a workspace, subsequent
       * workspace-aware requests will provide that workspace_id.
       */
      workspace_id,

      department: null,

      position: null,

      /*
       * There is no public.users identity, therefore there can be
       * no user_shift assignment.
       */
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
   * The email stored in public.users must correspond to the
   * authenticated Supabase Auth account.
   *
   * Platform Owner also goes through this check when a public.users
   * record exists.
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
   * ------------------------------------------------------------------------
   * GLOBAL USER EMPLOYMENT STATUS
   * ------------------------------------------------------------------------
   *
   * Platform Owner is still allowed to continue if their public.users
   * record exists, provided that record is active.
   */
  if (user.employment_status !== "ACTIVE") {
    throw new Error(
      `This user account is ${String(user.employment_status)
        .toLowerCase()
        .replace("_", " ")}.`,
    );
  }

  /*
   * ------------------------------------------------------------------------
   * PLATFORM OWNER WITH public.users
   * ------------------------------------------------------------------------
   *
   * IMPORTANT:
   *
   * Platform Owner does NOT need workspace_members.
   *
   * If workspace_id is null:
   *   → login/auth context is still valid.
   *
   * If workspace_id exists:
   *   → selected workspace becomes the operational workspace.
   *   → shift is resolved using that workspace.
   *   → membership is NOT checked.
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

    /*
     * Preserve the Platform Owner flag even when public.users.metadata
     * does not contain it.
     */
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

      /*
       * Keep the actual users.role.
       *
       * Platform Owner is a global privilege and is represented
       * through meta.platform_owner.
       */
      role: user.role as UserRole,

      employment_status: user.employment_status as EmploymentStatus,

      employment_type: user.employment_type as EmploymentType,

      auth_enabled: user.auth_enabled,

      login_provider: user.login_provider,

      invited_at: user.invited_at,

      last_login_at: user.last_login_at,

      /*
       * IMPORTANT:
       *
       * This is the SELECTED workspace.
       *
       * It is NOT users.workspace_id.
       */
      workspace_id,

      /*
       * Platform Owner does not require workspace membership,
       * so use the global department/position values if available.
       */
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
   * NORMAL USER WORKSPACE SELECTION
   * ------------------------------------------------------------------------
   *
   * Platform Owner has already returned above.
   *
   * Therefore this requirement applies only to normal users.
   */
  if (!workspace_id) {
    throw new Error("A workspace must be selected.");
  }

  /*
   * ------------------------------------------------------------------------
   * NORMAL WORKSPACE USER
   * ------------------------------------------------------------------------
   *
   * Normal users MUST belong to the selected workspace.
   */
  const membership = await getWorkspaceMembership(
    supabaseAdmin,
    workspace_id,
    user.id,
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

  /*
   * ------------------------------------------------------------------------
   * WORKSPACE-SPECIFIC USER DATA
   * ------------------------------------------------------------------------
   *
   * These values belong to the membership and therefore override the
   * legacy/global values from public.users.
   */
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

  /*
   * Resolve department from the workspace membership.
   */
  let department: UserContext["department"] = null;

  if (membership.department_id) {
    const { data: departmentData, error: departmentError } = await supabaseAdmin
      .from("departments")
      .select("id, name")
      .eq("id", membership.department_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (departmentError) {
      throw departmentError;
    }

    department = departmentData
      ? {
          id: departmentData.id,
          name: departmentData.name,
        }
      : null;
  }

  /*
   * Resolve position from the workspace membership.
   */
  let position: UserContext["position"] = null;

  if (membership.position_id) {
    const { data: positionData, error: positionError } = await supabaseAdmin
      .from("positions")
      .select("id, title")
      .eq("id", membership.position_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (positionError) {
      throw positionError;
    }

    position = positionData
      ? {
          id: positionData.id,
          name: positionData.title,
        }
      : null;
  }

  /*
   * Resolve the current shift using the selected workspace.
   *
   * This is critical for multi-workspace users because shift assignment
   * must never come from users.workspace_id.
   */
  const assignment = await getCurrentUserShift(
    supabaseAdmin,
    workspace_id,
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

    workspace_id,

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

  /*
   * First check whether this email already belongs to the requested
   * workspace.
   *
   * Same email is allowed in different workspaces.
   */
  await ensureUniqueEmail(supabaseAdmin, payload.workspace_id, email);

  /*
   * ------------------------------------------------------------------------
   * STEP 1
   * Find existing Supabase Auth identity.
   *
   * One Auth identity can belong to multiple WorkPulse workspaces.
   * ------------------------------------------------------------------------
   */
  const existingAuthUser = await findAuthUserByEmail(supabaseAdmin, email);

  let authUserId: string;
  let authUserWasCreated = false;

  if (existingAuthUser) {
    /*
     * Existing Auth identity.
     *
     * NEVER create another Auth account.
     */
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
     * Auth identity does not exist, so create it.
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
   * Check whether this Auth identity already has a public.users record.
   *
   * public.users.id = auth.users.id
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
   * The identity already exists globally.
   *
   * Do NOT create another public.users row.
   * Add the existing identity to the requested workspace instead.
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
       * Existing Auth/public.users identities are NEVER deleted here.
       */
      throw error;
    }
  }

  /*
   * ------------------------------------------------------------------------
   * NEW public.users RECORD
   *
   * Auth existed but WorkPulse did not yet know about it,
   * OR both Auth and WorkPulse were newly created.
   * ------------------------------------------------------------------------
   */
  const now = new Date().toISOString();

  const insertData: Database["public"]["Tables"]["users"]["Insert"] = {
    id: authUserId,

    /*
     * Keep the existing users.workspace_id temporarily for compatibility
     * with the current application architecture.
     *
     * workspace_members is the actual workspace relationship.
     */
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
    /*
     * ----------------------------------------------------------------------
     * STEP 4
     * Create the global public.users record.
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

      /*
       * Only delete Auth when WE created the Auth account in this request.
       *
       * If the Auth identity already existed, it belongs to the user and
       * must NEVER be deleted because public.users insertion failed.
       */
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
     * Create workspace membership.
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
      /*
       * Workspace membership failed after public.users was created.
       *
       * If Auth was newly created, clean up both records.
       *
       * If Auth already existed, DO NOT delete Auth.
       */
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
       * Roll back public.users because this is a newly-created
       * WorkPulse identity.
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

      /*
       * Only remove Auth when this request created it.
       */
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
