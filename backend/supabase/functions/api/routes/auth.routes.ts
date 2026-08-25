import type { RouteContext } from "./types.ts";

import { getApplicationContext } from "../services/context.ts";

export async function handleAuthRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "AUTH_ME": {
      return await getApplicationContext(
        ctx.supabaseAdmin,
        ctx.authUserId,
        ctx.email,
        ctx.authProvider,
      );
    }

    default:
      return null;
  }
}
