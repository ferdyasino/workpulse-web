import type { RouteContext } from "./types.ts";

import { createTimeLog } from "../services/timelogs.ts";

import { getCurrentAttendanceState } from "../services/attendance/state.ts";

import { validateAttendanceAction } from "../services/attendance/validation.ts";

const platformOwnerEmail = Deno.env
  .get("PLATFORM_OWNER_EMAIL")
  ?.trim()
  .toLowerCase();

function isPlatformOwner(authEmail: string | null | undefined): boolean {
  if (!platformOwnerEmail || !authEmail) {
    return false;
  }

  return authEmail.trim().toLowerCase() === platformOwnerEmail;
}

function getPlatformOwnerWorkDate(timestamp?: string): string {
  const date = timestamp ? new Date(timestamp) : new Date();

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function handleAttendanceRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    /* ---------------------------------------------------------------------- */
    /* Create Time Log                                                        */
    /* ---------------------------------------------------------------------- */

    case "TIMELOG_CREATE": {
      const platformOwner = isPlatformOwner(ctx.email);

      console.log(
        "TIMELOG REQUEST:",
        JSON.stringify({
          action: ctx.body.action,
          workspace_id: ctx.body.workspace_id ?? null,
          action_type: ctx.body.action_type,
          shift_id: ctx.body.shift_id ?? null,
          timestamp: ctx.body.timestamp ?? null,
          authenticated_user_id: ctx.authUserId,
          authenticated_email: ctx.email ?? null,
          platform_owner: platformOwner,
        }),
      );

      /*
       * Platform Owner:
       *
       * - Workspace is optional
       * - Shift is optional
       * - No attendance state resolution
       * - No normal attendance action validation
       *
       * Platform Owner identity is determined exclusively
       * by PLATFORM_OWNER_EMAIL.
       */
      if (platformOwner) {
        console.log(
          "PLATFORM OWNER TIMELOG: skipping attendance state and validation",
        );

        const log = await createTimeLog(
          ctx.supabaseAdmin,
          ctx.authUserId,
          {
            /*
             * Keep the workspace supplied by the authenticated
             * frontend context.
             *
             * Platform Owner may have a workspace or no workspace.
             */
            workspace_id: ctx.body.workspace_id ?? null,

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

      /*
       * Normal employee flow.
       *
       * Normal users require a workspace and go through
       * attendance state resolution and action validation.
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
      const platformOwner = isPlatformOwner(ctx.email);

      console.log(
        "ATTENDANCE STATE REQUEST:",
        JSON.stringify({
          action: ctx.body.action,

          workspace_id: ctx.body.workspace_id ?? null,

          shift_id: ctx.body.shift_id ?? null,

          date: ctx.body.date ?? null,

          timestamp: ctx.body.timestamp ?? null,

          authenticated_user_id: ctx.authUserId,

          authenticated_email: ctx.email ?? null,

          authenticated_provider: ctx.authProvider ?? null,

          platform_owner: platformOwner,
        }),
      );

      /*
       * Platform Owner:
       *
       * - Workspace is optional
       * - Shift is optional
       * - Do not resolve normal employee attendance context
       *
       * The workspace_id received from the frontend does NOT
       * determine whether the user is the Platform Owner.
       */
      if (platformOwner) {
        const workDate =
          ctx.body.date ?? getPlatformOwnerWorkDate(ctx.body.timestamp);

        console.log(
          "PLATFORM OWNER ATTENDANCE STATE:",
          JSON.stringify({
            work_date: workDate,
            workspace_id: ctx.body.workspace_id ?? null,
            shift: null,
          }),
        );

        return {
          status: "OFF",

          work_date: workDate,

          shift: null,

          sessions: [],

          current_session: null,
        };
      }

      /*
       * Normal employee flow remains unchanged.
       */
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
