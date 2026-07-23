import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

import type {
  EmployeeListItem,
  UserContext,
  UserRole,
  EmploymentStatus,
  EmploymentType,
} from "@shared/types/user.types.ts";

export async function getUserContext(
  supabaseAdmin: SupabaseClient<Database>,
  email: string,
): Promise<UserContext> {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select(
      `
        id,
        email,
        display_name,
        role,
        employment_status,
        workspace_id,
        user_shifts (
          shift_id,
          is_primary,
          deleted_at,
          shifts (
            name,
            start_time,
            end_time,
            grace_minutes
          )
        )
      `,
    )
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("User not found.");
  }

  const primaryShift = user.user_shifts?.find(
    (item) => item.is_primary && !item.deleted_at,
  );

  return {
    auth_user_id: user.id,
    user_id: user.id,
    email: user.email,
    display_name: user.display_name,

    role: user.role as UserRole,

    employment_status: user.employment_status as EmploymentStatus,

    workspace_id: user.workspace_id,

    shift_id: primaryShift?.shift_id ?? null,

    schedule: primaryShift?.shifts
      ? {
          shift_name: primaryShift.shifts.name,
          start_time: primaryShift.shifts.start_time,
          end_time: primaryShift.shifts.end_time,
          grace_minutes: primaryShift.shifts.grace_minutes,
        }
      : null,
  };
}

export async function listUsers(
  supabaseAdmin: SupabaseClient<Database>,
  workspace_id: string,
): Promise<EmployeeListItem[]> {
  const { data, error } = await supabaseAdmin
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
        created_at,
        department:departments (
          name
        ),
        position:positions (
          title
        ),
        user_shifts (
          is_primary,
          deleted_at,
          shifts (
            name
          )
        )
      `,
    )
    .eq("workspace_id", workspace_id)
    .is("deleted_at", null)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data.map((user) => {
    const primaryShift = user.user_shifts?.find(
      (item) => item.is_primary && !item.deleted_at,
    );

    return {
      id: user.id,

      employee_no: user.employee_no,

      display_name: user.display_name,

      email: user.email,

      avatar_url: user.avatar_url,

      role: user.role as UserRole,

      employment_status: user.employment_status as EmploymentStatus,

      employment_type: user.employment_type as EmploymentType,

      department: user.department?.name ?? null,

      position: user.position?.title ?? null,

      shift: primaryShift?.shifts?.name ?? null,
    };
  });
}
