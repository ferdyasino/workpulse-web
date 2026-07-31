import type { RouteContext } from "./types.ts";

import {
  listUserShifts,
  getUserShift,
  createUserShift,
  updateUserShift,
  deleteUserShift,
  restoreUserShift,
  hardDeleteUserShift,
} from "../services/user_shifts.ts";

import { resolveUserShift } from "../services/user_shift_resolver.ts";

export async function handleUserShiftRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "USER_SHIFT_LIST": {
      return {
        success: true,
        user_shifts: await listUserShifts(
          ctx.supabaseAdmin,
          ctx.body.workspace_id,
          ctx.body.user_id,
          ctx.body.include_deleted ?? false,
        ),
      };
    }

    case "USER_SHIFT_GET": {
      const user_shift = await getUserShift(
        ctx.supabaseAdmin,
        ctx.body.workspace_id,
        ctx.body.id,
      );

      return {
        success: true,
        user_shift,
      };
    }

    case "USER_SHIFT_CREATE": {
      try {
        const user_shift = await createUserShift(ctx.supabaseAdmin, {
          workspace_id: ctx.body.workspace_id,
          user_id: ctx.body.user_id,
          shift_id: ctx.body.shift_id,
          attendance_policy_id: ctx.body.attendance_policy_id ?? null,
          effective_from: ctx.body.effective_from,
          effective_to: ctx.body.effective_to ?? null,
          metadata: ctx.body.metadata,
        });

        return {
          success: true,
          message: "User shift created successfully.",
          user_shift,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create user shift.",
        };
      }
    }

    case "USER_SHIFT_UPDATE": {
      try {
        const user_shift = await updateUserShift(ctx.supabaseAdmin, {
          id: ctx.body.id,
          workspace_id: ctx.body.workspace_id,
          user_id: ctx.body.user_id,
          shift_id: ctx.body.shift_id,
          attendance_policy_id: ctx.body.attendance_policy_id ?? null,
          effective_from: ctx.body.effective_from,
          effective_to: ctx.body.effective_to ?? null,
          metadata: ctx.body.metadata,
        });

        return {
          success: true,
          message: "User shift updated successfully.",
          user_shift,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update user shift.",
        };
      }
    }

    case "USER_SHIFT_DELETE": {
      try {
        await deleteUserShift(ctx.supabaseAdmin, {
          id: ctx.body.id,
          workspace_id: ctx.body.workspace_id,
        });

        return {
          success: true,
          message: "User shift deleted successfully.",
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete user shift.",
        };
      }
    }

    case "USER_SHIFT_RESTORE": {
      try {
        const user_shift = await restoreUserShift(ctx.supabaseAdmin, {
          id: ctx.body.id,
          workspace_id: ctx.body.workspace_id,
        });

        return {
          success: true,
          message: "User shift restored successfully.",
          user_shift,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to restore user shift.",
        };
      }
    }

    case "USER_SHIFT_HARD_DELETE": {
      try {
        await hardDeleteUserShift(ctx.supabaseAdmin, {
          id: ctx.body.id,
          workspace_id: ctx.body.workspace_id,
        });

        return {
          success: true,
          message: "User shift permanently deleted.",
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Cannot permanently delete user shift.",
        };
      }
    }

    /*
     * Resolve effective shift for a user on a specific date.
     *
     * Priority:
     * 1. user_shift_overrides
     * 2. user_shifts
     * 3. null
     */
    case "USER_SHIFT_RESOLVE": {
      try {
        const resolved = await resolveUserShift(ctx.supabaseAdmin, {
          workspace_id: ctx.body.workspace_id,
          user_id: ctx.body.user_id,
          date: ctx.body.date,
        });

        return {
          success: true,
          resolved,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to resolve user shift.",
        };
      }
    }

    default:
      return null;
  }
}
