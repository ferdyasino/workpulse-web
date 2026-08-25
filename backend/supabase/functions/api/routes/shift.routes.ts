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
    /* ---------------------------------------------------------------------- */
    /* LIST                                                                     */
    /* ---------------------------------------------------------------------- */

    case "SHIFT_LIST": {
      console.log("SHIFT LIST REQUEST:", JSON.stringify(ctx.body));

      return {
        success: true,
        shifts: await listShifts(ctx.supabaseAdmin, ctx.body.workspace_id, {
          include_inactive: ctx.body.include_inactive ?? false,
          include_deleted: ctx.body.include_deleted ?? false,
        }),
      };
    }

    /* ---------------------------------------------------------------------- */
    /* CREATE                                                                   */
    /* ---------------------------------------------------------------------- */

    case "SHIFT_CREATE": {
      console.log("SHIFT CREATE REQUEST:", JSON.stringify(ctx.body));

      try {
        const shift = await createShift(ctx.supabaseAdmin, {
          workspace_id: ctx.body.workspace_id,
          name: ctx.body.name,
          description: ctx.body.description ?? null,
          start_time: ctx.body.start_time,
          end_time: ctx.body.end_time,
          timezone: ctx.body.timezone,
          break_minutes: ctx.body.break_minutes,
          grace_minutes: ctx.body.grace_minutes,
          is_overnight: ctx.body.is_overnight,
          metadata: ctx.body.metadata ?? {},
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

        console.error("SHIFT CREATE ERROR:", error);

        throw error;
      }
    }

    /* ---------------------------------------------------------------------- */
    /* UPDATE                                                                   */
    /* ---------------------------------------------------------------------- */

    case "SHIFT_UPDATE": {
      console.log("SHIFT UPDATE REQUEST:", JSON.stringify(ctx.body));

      try {
        const shift = await updateShift(ctx.supabaseAdmin, {
          id: ctx.body.id,
          workspace_id: ctx.body.workspace_id,

          name: ctx.body.name,
          description: ctx.body.description ?? null,

          start_time: ctx.body.start_time,
          end_time: ctx.body.end_time,

          timezone: ctx.body.timezone,

          break_minutes: ctx.body.break_minutes,
          grace_minutes: ctx.body.grace_minutes,

          is_overnight: ctx.body.is_overnight,

          metadata: ctx.body.metadata ?? {},
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

        console.error("SHIFT UPDATE ERROR:", error);

        throw error;
      }
    }

    /* ---------------------------------------------------------------------- */
    /* ACTIVATE                                                                 */
    /* ---------------------------------------------------------------------- */

    case "SHIFT_ACTIVATE": {
      console.log("SHIFT ACTIVATE REQUEST:", JSON.stringify(ctx.body));

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

    /* ---------------------------------------------------------------------- */
    /* DEACTIVATE                                                               */
    /* ---------------------------------------------------------------------- */

    case "SHIFT_DEACTIVATE": {
      console.log("SHIFT DEACTIVATE REQUEST:", JSON.stringify(ctx.body));

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

    /* ---------------------------------------------------------------------- */
    /* SOFT DELETE                                                              */
    /* ---------------------------------------------------------------------- */

    case "SHIFT_DELETE": {
      console.log("SHIFT DELETE REQUEST:", JSON.stringify(ctx.body));

      await deleteShift(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "Shift deleted successfully",
      };
    }

    /* ---------------------------------------------------------------------- */
    /* RESTORE                                                                  */
    /* ---------------------------------------------------------------------- */

    case "SHIFT_RESTORE": {
      console.log("SHIFT RESTORE REQUEST:", JSON.stringify(ctx.body));

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

    /* ---------------------------------------------------------------------- */
    /* HARD DELETE                                                              */
    /* ---------------------------------------------------------------------- */

    case "SHIFT_HARD_DELETE": {
      console.log("SHIFT HARD DELETE REQUEST:", JSON.stringify(ctx.body));

      await hardDeleteShift(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "Shift permanently deleted",
      };
    }

    /* ---------------------------------------------------------------------- */
    /* UNKNOWN                                                                  */
    /* ---------------------------------------------------------------------- */

    default:
      return null;
  }
}
