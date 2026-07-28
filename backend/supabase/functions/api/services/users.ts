import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

import type { ShiftStatus } from "@shared/types/api.shift.ts";

import type {
  EmployeeListItem,
  UserContext,
  UserRole,
  EmploymentStatus,
  EmploymentType,
} from "@shared/types/user.types.ts";

const today = new Date().toISOString().slice(0, 10);

function isActivePrimaryShift(item: {
  is_primary: boolean;
  effective_from: string;
  effective_to: string | null;
  deleted_at: string | null;
}) {
  return (
    item.is_primary &&
    !item.deleted_at &&
    item.effective_from <= today &&
    (!item.effective_to || item.effective_to >= today)
  );
}

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
        avatar_url,
        role,
        employment_status,
        workspace_id,

        department:departments (
          id,
          name
        ),

        position:positions (
          id,
          title
        ),

        user_shifts (
          shift_id,
          is_primary,
          effective_from,
          effective_to,
          deleted_at,

          shifts (
            id,
            name,
            description,
            status,
            start_time,
            end_time,
            timezone,
            grace_minutes,
            break_minutes,
            is_overnight
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

  const activeShift = user.user_shifts?.find(isActivePrimaryShift);

  return {
    auth_user_id: user.id,

    user_id: user.id,

    email: user.email,

    display_name: user.display_name,

    avatar_url: user.avatar_url,

    role: user.role as UserRole,

    employment_status: user.employment_status as EmploymentStatus,

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

    shift: activeShift?.shifts
      ? {
          id: activeShift.shifts.id,

          name: activeShift.shifts.name,

          description: activeShift.shifts.description,

          status: activeShift.shifts.status as ShiftStatus,

          start_time: activeShift.shifts.start_time,

          end_time: activeShift.shifts.end_time,

          timezone: activeShift.shifts.timezone,

          grace_minutes: activeShift.shifts.grace_minutes,

          break_minutes: activeShift.shifts.break_minutes,

          is_overnight: activeShift.shifts.is_overnight,

          effective_from: activeShift.effective_from,
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
    .is("deleted_at", null)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data.map((user) => {
    const activeShift = user.user_shifts?.find(isActivePrimaryShift);

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

      shift: activeShift?.shifts?.name ?? null,
    };
  });
}
