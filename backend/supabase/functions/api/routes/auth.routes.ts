import type { RouteContext } from "./types.ts";

import { getApplicationContext } from "../services/context.ts";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Require a valid authenticated Supabase user ID.
 *
 * Supabase Auth is the source of truth for authentication identity.
 *
 * We deliberately do not fall back to email.
 */
function requireAuthUserId(ctx: RouteContext): string {
  const authUserId = ctx.authUserId?.trim();

  if (!authUserId) {
    throw new Error("Invalid credentials.");
  }

  return authUserId;
}

/**
 * Safely resolve the requested workspace.
 *
 * This value is only a request.
 *
 * Authorization is still performed by getApplicationContext().
 */
function getRequestedWorkspaceId(ctx: RouteContext): string | null {
  if ("workspace_id" in ctx.body && typeof ctx.body.workspace_id === "string") {
    const workspaceId = ctx.body.workspace_id.trim();

    return workspaceId.length > 0 ? workspaceId : null;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Auth Routes                                                                */
/* -------------------------------------------------------------------------- */

export async function handleAuthRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "AUTH_ME": {
      /* -------------------------------------------------------------------- */
      /* Authentication Identity                                              */
      /* -------------------------------------------------------------------- */

      /*
       * Supabase must already have authenticated the request.
       *
       * authUserId comes from the verified Supabase Auth session/token.
       *
       * We do NOT authenticate passwords here.
       */
      const authUserId = requireAuthUserId(ctx);

      /* -------------------------------------------------------------------- */
      /* Requested Workspace                                                  */
      /* -------------------------------------------------------------------- */

      const workspaceId = getRequestedWorkspaceId(ctx);

      /* -------------------------------------------------------------------- */
      /* Application Authorization                                            */
      /* -------------------------------------------------------------------- */

      /*
       * getApplicationContext() is the authoritative WorkPulse
       * authorization boundary.
       *
       * Normal user:
       *
       *   auth.users.id
       *        =
       *   public.users.id
       *        ↓
       *   workspace_members
       *        ↓
       *   active workspace
       *
       * Platform Owner:
       *
       *   authenticated Supabase identity
       *        +
       *   PLATFORM_OWNER_EMAIL
       *        ↓
       *   Platform Owner
       *        ↓
       *   any active workspace
       */
      return await getApplicationContext(
        ctx.supabaseAdmin,
        authUserId,
        ctx.email,
        ctx.authProvider,
        workspaceId,
      );
    }

    default:
      return null;
  }
}
