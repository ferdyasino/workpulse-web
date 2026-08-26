import type { RouteContext } from "./types.ts";

import { createTimeLog } from "../services/timelogs.ts";

import { getCurrentAttendanceState } from "../services/attendance/state.ts";

import { validateAttendanceAction } from "../services/attendance/validation.ts";

export async function handleAttendanceRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    /* ---------------------------------------------------------------------- */
    /* Create Time Log                                                        */
    /* ---------------------------------------------------------------------- */

    case "TIMELOG_CREATE": {
      console.log(
        "TIMELOG REQUEST:",
        JSON.stringify({
          action: ctx.body.action,

          workspace_id: ctx.body.workspace_id,

          action_type: ctx.body.action_type,

          shift_id: ctx.body.shift_id ?? null,

          timestamp: ctx.body.timestamp ?? null,

          authenticated_user_id: ctx.authUserId,
        }),
      );

      /*
       * Resolve the current attendance state using the exact same
       * attendance resolution pipeline that TIMELOG_CREATE itself uses.
       */
      const currentState = await getCurrentAttendanceState(ctx.supabaseAdmin, {
        workspace_id: ctx.body.workspace_id,

        authUserId: ctx.authUserId,

        email: ctx.email ?? "",

        authProvider: ctx.authProvider,

        ...(ctx.body.shift_id
          ? {
              shift_id: ctx.body.shift_id,
            }
          : {}),

        ...(ctx.body.timestamp
          ? {
              timestamp: ctx.body.timestamp,
            }
          : {}),
      });

      console.log("CURRENT STATE:", JSON.stringify(currentState));

      const validation = validateAttendanceAction(
        currentState,
        ctx.body.action_type,
      );

      console.log("VALIDATION RESULT:", JSON.stringify(validation));

      if (!validation.valid) {
        return {
          success: false,
          message: validation.message,
        };
      }

      /*
       * The authenticated user is the person creating the event.
       */
      const log = await createTimeLog(
        ctx.supabaseAdmin,

        ctx.authUserId,

        {
          workspace_id: ctx.body.workspace_id,

          action_type: ctx.body.action_type,

          device_info: ctx.body.device_info,

          location: ctx.body.location,

          location_status: ctx.body.location_status,

          location_message: ctx.body.location_message,

          timestamp: ctx.body.timestamp,

          ...(ctx.body.shift_id
            ? {
                shift_id: ctx.body.shift_id,
              }
            : {}),
        },

        ctx.email,

        ctx.authProvider,
      );

      return {
        success: true,

        message: "Timelog created successfully",

        log_id: log.id,
      };
    }

    /* ---------------------------------------------------------------------- */
    /* Attendance State                                                       */
    /* ---------------------------------------------------------------------- */

    case "ATTENDANCE_STATE_GET": {
      console.log(
        "ATTENDANCE STATE REQUEST:",
        JSON.stringify({
          action: ctx.body.action,

          workspace_id: ctx.body.workspace_id,

          shift_id: ctx.body.shift_id ?? null,

          date: ctx.body.date ?? null,

          timestamp: ctx.body.timestamp ?? null,

          authenticated_user_id: ctx.authUserId,

          authenticated_email: ctx.email ?? null,

          authenticated_provider: ctx.authProvider ?? null,
        }),
      );

      return await getCurrentAttendanceState(ctx.supabaseAdmin, {
        workspace_id: ctx.body.workspace_id,

        authUserId: ctx.authUserId,

        email: ctx.email ?? "",

        authProvider: ctx.authProvider,

        ...(ctx.body.shift_id
          ? {
              shift_id: ctx.body.shift_id,
            }
          : {}),

        ...(ctx.body.date
          ? {
              date: ctx.body.date,
            }
          : {}),

        ...(ctx.body.timestamp
          ? {
              timestamp: ctx.body.timestamp,
            }
          : {}),
      });
    }

    default:
      return null;
  }
}
