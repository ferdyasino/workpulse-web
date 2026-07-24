import type { RouteContext } from "./types.ts";

import { getUserContext, listUsers } from "../services/users.ts";

export async function handleUserRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "USER_CONTEXT_GET": {
      return await getUserContext(ctx.supabaseAdmin, ctx.email);
    }

    case "EMPLOYEE_LIST": {
      console.log("EMPLOYEE LIST REQUEST:", JSON.stringify(ctx.body));

      return await listUsers(ctx.supabaseAdmin, ctx.body.workspace_id);
    }

    default:
      return null;
  }
}
