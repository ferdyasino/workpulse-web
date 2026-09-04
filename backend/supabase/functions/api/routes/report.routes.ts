import type { RouteContext } from "./types.ts";

import { getApplicationContext } from "../services/context.ts";
import { getAttendanceReport } from "../services/reports.ts";

export async function handleReportRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    /* ---------------------------------------------------------------------- */
    /* Attendance Reports                                                     */
    /* ---------------------------------------------------------------------- */

    case "REPORT_ATTENDANCE": {
      const applicationContext = await getApplicationContext(
        ctx.supabaseAdmin,
        ctx.authUserId,
        ctx.email,
        ctx.authProvider,
      );

      const isEmployee = applicationContext.user.role === "EMPLOYEE";

      const effectiveWorkspaceId = isEmployee
        ? applicationContext.user.workspace_id
        : ctx.body.workspace_id;

      if (!effectiveWorkspaceId) {
        throw new Error("Workspace ID is required.");
      }

      const effectiveUserId = isEmployee
        ? applicationContext.user.user_id
        : ctx.body.user_id;

      if (isEmployee && !effectiveUserId) {
        throw new Error("Authenticated user ID is missing.");
      }

      const report = await getAttendanceReport(ctx.supabaseAdmin, {
        workspace_id: effectiveWorkspaceId,

        date_from: ctx.body.date_from,

        date_to: ctx.body.date_to,

        ...(effectiveUserId
          ? {
              user_id: effectiveUserId,
            }
          : {}),

        ...(isEmployee
          ? {}
          : ctx.body.department_id
            ? {
                department_id: ctx.body.department_id,
              }
            : {}),

        ...(ctx.body.timezone
          ? {
              timezone: ctx.body.timezone,
            }
          : {}),

        report_type: ctx.body.report_type ?? "DAILY",
      });

      return {
        success: true,

        message: "Attendance report loaded successfully.",

        rows: report.rows,

        break_rows: report.break_rows,

        weekly_rows: report.weekly_rows,
      };
    }

    default:
      return null;
  }
}
