import type { RouteContext } from "./types.ts";

import { getUserContext } from "../services/users.ts";
import { getTimelogs } from "../services/timelogs.ts";

export async function handleTimelogRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "TIMELOG_LIST": {
      console.log("TIMELOG LIST REQUEST:", JSON.stringify(ctx.body));

      const user = await getUserContext(
        ctx.supabaseAdmin,
        ctx.authUserId,
        ctx.email,
        ctx.authProvider,
      );

      if (!user.workspace_id) {
        throw new Error("User workspace_id is missing");
      }

      return await getTimelogs(ctx.supabaseAdmin, {
        workspace_id: user.workspace_id,

        ...(ctx.body.user_id
          ? {
              user_id: ctx.body.user_id,
            }
          : user.user_id
            ? {
                user_id: user.user_id,
              }
            : {}),

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
