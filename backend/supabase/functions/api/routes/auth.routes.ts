import type { RouteContext } from "./types.ts";

import { getApplicationContext } from "../services/context.ts";

export async function handleAuthRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "AUTH_ME": {
      /*
       * The selected workspace comes from the authenticated client's
       * current workspace selection.
       *
       * getApplicationContext() validates:
       *
       * Normal user:
       *   - workspace_id must be an active workspace_members relationship.
       *
       * Platform Owner:
       *   - workspace_id may be any active workspace.
       *
       * When workspace_id is omitted:
       *   - one workspace -> automatically selected
       *   - multiple workspaces -> selection required
       */
      const workspaceId =
        typeof ctx.body.workspace_id === "string" &&
        ctx.body.workspace_id.trim().length > 0
          ? ctx.body.workspace_id.trim()
          : null;

      return await getApplicationContext(
        ctx.supabaseAdmin,
        ctx.authUserId,
        ctx.email,
        ctx.authProvider,
        workspaceId,
      );
    }

    default:
      return null;
  }
}
