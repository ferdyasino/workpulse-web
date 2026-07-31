import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

import type {
  EmployeeListItem,
  UserContext,
  UserRole,
  EmploymentStatus,
  EmploymentType,
} from "@shared/types/models/user.types.ts";

import { getCurrentUserShift } from "./user_shifts.ts";

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

      department: user.department?.name ?? null,

      position: user.position?.title ?? null,

      shift: activeShift?.shifts?.name ?? null,
    };
  });
}
