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

        email: ctx.email,

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

      const log = await createTimeLog(ctx.supabaseAdmin, {
        workspace_id: ctx.body.workspace_id,

        user_id: ctx.body.user_id,

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
      console.log("CURRENT STATE REQUEST:", JSON.stringify(ctx.body));

      return await getCurrentAttendanceState(ctx.supabaseAdmin, {
        workspace_id: ctx.body.workspace_id,

        email: ctx.body.email,

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
