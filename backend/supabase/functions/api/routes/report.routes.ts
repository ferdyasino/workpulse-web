import type { RouteContext } from "./types.ts";

import { getAttendanceReport } from "../services/reports.ts";

export async function handleReportRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    /* ---------------------------------------------------------------------- */
    /* Attendance Reports                                                     */
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
          report_type: ctx.body.report_type ?? "DAILY",
          authenticated_user_id: ctx.authUserId,
          authenticated_email: ctx.email ?? null,
        }),
      );

      /* -------------------------------------------------------------------- */
      /* Role-based report scope                                              */
      /* -------------------------------------------------------------------- */
      //
      // Employees must only be able to retrieve their own reports.
      //
      // Managers/Admins can continue using the requested user_id /
      // department_id filters.
      //
      // IMPORTANT:
      // This must be enforced here on the backend. The frontend must never
      // be trusted to restrict an employee to their own records.
      //

      const authenticatedUserId = ctx.authUserId;

      if (!authenticatedUserId) {
        throw new Error("Authenticated user is required.");
      }

      /*
       * Resolve the authenticated user's role from the users table.
       *
       * We use the admin Supabase client because this is a server-side
       * authorization decision.
       */
      const { data: authenticatedUser, error: authenticatedUserError } =
        await ctx.supabaseAdmin
          .from("users")
          .select("id, workspace_id, role")
          .eq("id", authenticatedUserId)
          .is("deleted_at", null)
          .maybeSingle();

      if (authenticatedUserError) {
        throw authenticatedUserError;
      }

      if (!authenticatedUser) {
        throw new Error("Authenticated user record was not found.");
      }

      if (authenticatedUser.workspace_id !== ctx.body.workspace_id) {
        throw new Error("You are not authorized to access this workspace.");
      }

      /*
       * Normalize the role so role comparisons are case-insensitive.
       */
      const role = String(authenticatedUser.role ?? "")
        .trim()
        .toUpperCase();

      /*
       * Employee/self-report roles.
       *
       * These users are forced to their own user_id regardless of what
       * the frontend sends.
       */
      const employeeRoles = new Set(["EMPLOYEE", "AGENT", "USER"]);

      const isEmployee = employeeRoles.has(role);

      const reportUserId = isEmployee ? authenticatedUserId : ctx.body.user_id;

      /*
       * Employees cannot use department_id to obtain another employee's
       * report. Their report is always scoped to themselves.
       */
      const report = await getAttendanceReport(ctx.supabaseAdmin, {
        workspace_id: ctx.body.workspace_id,

        date_from: ctx.body.date_from,

        date_to: ctx.body.date_to,

        ...(reportUserId
          ? {
              user_id: reportUserId,
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
