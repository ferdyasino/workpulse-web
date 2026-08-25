import type { RouteContext } from "./types.ts";

import { createTimeLog } from "../services/timelogs.ts";

import { getCurrentAttendanceState } from "../services/attendance/state.ts";
import { validateAttendanceAction } from "../services/attendance/validation.ts";

export async function handleAttendanceRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "TIMELOG_CREATE": {
      console.log("TIMELOG REQUEST:", JSON.stringify(ctx.body));

      const currentState = await getCurrentAttendanceState(ctx.supabaseAdmin, {
        workspace_id: ctx.body.workspace_id,

        /*
         * IMPORTANT:
         * These values come from the authenticated Supabase session,
         * not from the request body.
         */
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
       * IMPORTANT:
       * The authenticated user should be the user creating the timelog.
       *
       * Do not trust ctx.body.user_id for authentication identity.
       */
      const log = await createTimeLog(ctx.supabaseAdmin, {
        workspace_id: ctx.body.workspace_id,

        user_id: ctx.authUserId,

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
      });

      return {
        success: true,
        message: "Timelog created successfully",
        log_id: log.id,
      };
    }

    case "ATTENDANCE_STATE_GET": {
      console.log(
        "CURRENT STATE REQUEST:",
        JSON.stringify({
          ...ctx.body,

          /*
           * Do not log or trust a client-supplied authUserId.
           * The real identity is ctx.authUserId.
           */
          authenticated_user_id: ctx.authUserId,
          authenticated_email: ctx.email,
          authenticated_provider: ctx.authProvider,
        }),
      );

      return await getCurrentAttendanceState(ctx.supabaseAdmin, {
        workspace_id: ctx.body.workspace_id,

        /*
         * IMPORTANT:
         * Use the authenticated identity from RouteContext.
         */
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
