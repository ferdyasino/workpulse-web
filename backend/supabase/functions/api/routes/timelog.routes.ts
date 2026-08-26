import type { RouteContext } from "./types.ts";

import { getUserContext } from "../services/users.ts";
import { getTimelogs } from "../services/timelogs.ts";

export async function handleTimelogRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "TIMELOG_LIST": {
      console.log(
        "TIMELOG LIST REQUEST:",
        JSON.stringify({
          action: ctx.body.action,
          workspace_id: ctx.body.workspace_id,
          work_date: ctx.body.work_date ?? null,
          authenticated_user_id: ctx.authUserId,
        }),
      );

      const user = await getUserContext(
        ctx.supabaseAdmin,
        ctx.authUserId,
        ctx.email,
        ctx.authProvider,
      );

      if (!user.workspace_id) {
        throw new Error("User workspace_id is missing");
      }

      if (!user.user_id) {
        throw new Error("Application user_id is missing");
      }

      /*
       * IMPORTANT:
       *
       * Do not trust ctx.body.user_id here.
       *
       * TIMELOG_LIST is scoped to the authenticated application user.
       * Administrative/reporting endpoints should have their own
       * authorization flow for querying other employees.
       */
      return await getTimelogs(ctx.supabaseAdmin, {
        workspace_id: user.workspace_id,

        user_id: user.user_id,

        ...(ctx.body.work_date
          ? {
              work_date: ctx.body.work_date,
            }
          : {}),
      });
    }

    default:
      return null;
  }
}
