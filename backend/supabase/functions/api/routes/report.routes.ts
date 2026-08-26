import type { RouteContext } from "./types.ts";

import { getAttendanceReport } from "../services/reports.ts";

export async function handleReportRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    /* ---------------------------------------------------------------------- */
    /* Attendance Report                                                      */
    /* ---------------------------------------------------------------------- */

    case "REPORT_ATTENDANCE": {
      console.log(
        "ATTENDANCE REPORT REQUEST:",
        JSON.stringify({
          action: ctx.body.action,

          workspace_id: ctx.body.workspace_id,

          date_from: ctx.body.date_from,

          date_to: ctx.body.date_to,

          user_id: ctx.body.user_id ?? null,

          department_id: ctx.body.department_id ?? null,

          timezone: ctx.body.timezone ?? null,

          authenticated_user_id: ctx.authUserId,

          authenticated_email: ctx.email ?? null,
        }),
      );

      const rows = await getAttendanceReport(ctx.supabaseAdmin, {
        workspace_id: ctx.body.workspace_id,

        date_from: ctx.body.date_from,

        date_to: ctx.body.date_to,

        ...(ctx.body.user_id
          ? {
              user_id: ctx.body.user_id,
            }
          : {}),

        ...(ctx.body.department_id
          ? {
              department_id: ctx.body.department_id,
            }
          : {}),

        ...(ctx.body.timezone
          ? {
              timezone: ctx.body.timezone,
            }
          : {}),
      });

      return {
        success: true,

        message: "Attendance report loaded successfully.",

        rows,
      };
    }

    default:
      return null;
  }
}
