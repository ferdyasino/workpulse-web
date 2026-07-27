import type { RouteContext } from "./types.ts";

import {
  listShifts,
  createShift,
  updateShift,
  activateShift,
  deactivateShift,
  restoreShift,
  deleteShift,
  hardDeleteShift,
} from "../services/shifts.ts";

export async function handleShiftRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "SHIFT_LIST": {
      console.log("SHIFT LIST REQUEST:", JSON.stringify(ctx.body));

      return {
        success: true,
        shifts: await listShifts(ctx.supabaseAdmin, ctx.body.workspace_id, {
          include_inactive: ctx.body.include_inactive,
          include_deleted: ctx.body.include_deleted,
        }),
      };
    }

    case "SHIFT_CREATE": {
      try {
        const shift = await createShift(ctx.supabaseAdmin, {
          workspace_id: ctx.body.workspace_id,
          name: ctx.body.name,
          description: ctx.body.description,
          start_time: ctx.body.start_time,
          end_time: ctx.body.end_time,
          timezone: ctx.body.timezone,
          break_minutes: ctx.body.break_minutes,
          grace_minutes: ctx.body.grace_minutes,
          is_overnight: ctx.body.is_overnight,
          metadata: ctx.body.metadata,
        });

        return {
          success: true,
          message: "Shift created successfully",
          shift,
        };
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "23505"
        ) {
          return {
            success: false,
            message: "Shift name already exists",
          };
        }

        throw error;
      }
    }

    case "SHIFT_UPDATE": {
      try {
        const shift = await updateShift(ctx.supabaseAdmin, {
          id: ctx.body.id,
          workspace_id: ctx.body.workspace_id,
          name: ctx.body.name,
          description: ctx.body.description,
          start_time: ctx.body.start_time,
          end_time: ctx.body.end_time,
          timezone: ctx.body.timezone,
          break_minutes: ctx.body.break_minutes,
          grace_minutes: ctx.body.grace_minutes,
          is_overnight: ctx.body.is_overnight,
          metadata: ctx.body.metadata,
        });

        return {
          success: true,
          message: "Shift updated successfully",
          shift,
        };
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "23505"
        ) {
          return {
            success: false,
            message: "Shift name already exists",
          };
        }

        throw error;
      }
    }

    case "SHIFT_ACTIVATE": {
      const shift = await activateShift(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "Shift activated successfully",
        shift,
      };
    }

    case "SHIFT_DEACTIVATE": {
      const shift = await deactivateShift(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "Shift deactivated successfully",
        shift,
      };
    }

    case "SHIFT_DELETE": {
      await deleteShift(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "Shift deleted successfully",
      };
    }

    case "SHIFT_RESTORE": {
      const shift = await restoreShift(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "Shift restored successfully",
        shift,
      };
    }

    case "SHIFT_HARD_DELETE": {
      await hardDeleteShift(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "Shift permanently deleted",
      };
    }

    default:
      return null;
  }
}
