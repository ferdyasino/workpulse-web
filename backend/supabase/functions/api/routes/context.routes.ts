import type { RouteContext } from "./types.ts";

import {
  getApplicationContext,
  getPlatformOwnerContext,
} from "../services/context.ts";
import { getUserContext } from "../services/users.ts";
import { getSettings, updateSettings } from "../services/settings.ts";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isPlatformOwner(ctx: RouteContext): boolean {
  const platformOwnerEmail = Deno.env
    .get("PLATFORM_OWNER_EMAIL")
    ?.trim()
    .toLowerCase();

  if (!platformOwnerEmail || !ctx.email) {
    return false;
  }

  return ctx.email.trim().toLowerCase() === platformOwnerEmail;
}

/**
 * Safely read workspace_id from requests that may contain it.
 *
 * ApiRequest is a discriminated union, so workspace_id does not exist on
 * every request variant.
 */
function getRequestedWorkspaceId(ctx: RouteContext): string | null {
  if (
    "workspace_id" in ctx.body &&
    typeof ctx.body.workspace_id === "string" &&
    ctx.body.workspace_id.trim().length > 0
  ) {
    return ctx.body.workspace_id.trim();
  }

  return null;
}

/**
 * Resolve the workspace authorized for settings operations.
 *
 * Platform Owner:
 *   Uses explicitly supplied workspace_id when available.
 *
 * Normal user:
 *   Uses public.users.workspace_id.
 *   The frontend-supplied workspace_id is ignored.
 */
async function resolveSettingsWorkspaceId(ctx: RouteContext): Promise<string> {
  /* ------------------------------------------------------------------------ */
  /* Platform Owner                                                           */
  /* ------------------------------------------------------------------------ */

  if (isPlatformOwner(ctx)) {
    const workspaceId = getRequestedWorkspaceId(ctx);

    if (!workspaceId) {
      throw new Error("Platform Owner must specify a workspace_id.");
    }

    const { data: workspace, error } = await ctx.supabaseAdmin
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!workspace) {
      throw new Error("Workspace not found.");
    }

    return workspace.id;
  }

  /* ------------------------------------------------------------------------ */
  /* Normal Workspace User                                                    */
  /* ------------------------------------------------------------------------ */

  const user = await getUserContext(
    ctx.supabaseAdmin,
    ctx.authUserId,
    ctx.email,
    ctx.authProvider,
  );

  if (!user.workspace_id) {
    throw new Error("User workspace_id is missing");
  }

  /*
   * Normal users always use the workspace assigned to their account.
   *
   * Do not trust a workspace_id supplied by the frontend as the
   * authorization source.
   */
  return user.workspace_id;
}

/* -------------------------------------------------------------------------- */
/* Routes                                                                     */
/* -------------------------------------------------------------------------- */

export async function handleContextRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    /* ---------------------------------------------------------------------- */
    /* USER CONTEXT                                                            */
    /* ---------------------------------------------------------------------- */

    case "USER_CONTEXT_GET": {
      if (isPlatformOwner(ctx)) {
        return getPlatformOwnerContext(ctx.authUserId, ctx.email);
      }

      return await getUserContext(
        ctx.supabaseAdmin,
        ctx.authUserId,
        ctx.email,
        ctx.authProvider,
      );
    }

    /* ---------------------------------------------------------------------- */
    /* APPLICATION CONTEXT                                                     */
    /* ---------------------------------------------------------------------- */

    case "AUTH_ME": {
      return await getApplicationContext(
        ctx.supabaseAdmin,
        ctx.authUserId,
        ctx.email,
        ctx.authProvider,
      );
    }

    /* ---------------------------------------------------------------------- */
    /* WORKSPACE                                                               */
    /* ---------------------------------------------------------------------- */

    case "WORKSPACE_GET": {
      /*
       * WORKSPACE_GET defines `id`, not `workspace_id`.
       *
       * Platform Owner:
       *   Uses the requested workspace ID.
       *
       * Normal user:
       *   Uses the authenticated user's workspace.
       */

      if (isPlatformOwner(ctx)) {
        const workspaceId = ctx.body.id;

        const { data, error } = await ctx.supabaseAdmin
          .from("workspaces")
          .select("*")
          .eq("id", workspaceId)
          .is("deleted_at", null)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error("Workspace not found.");
        }

        return {
          success: true,
          workspace: data,
        };
      }

      /* -------------------------------------------------------------------- */
      /* Normal user                                                           */
      /* -------------------------------------------------------------------- */

      const user = await getUserContext(
        ctx.supabaseAdmin,
        ctx.authUserId,
        ctx.email,
        ctx.authProvider,
      );

      if (!user.workspace_id) {
        throw new Error("User workspace_id is missing");
      }

      const { data, error } = await ctx.supabaseAdmin
        .from("workspaces")
        .select("*")
        .eq("id", user.workspace_id)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("Workspace not found.");
      }

      return {
        success: true,
        workspace: data,
      };
    }

    /* ---------------------------------------------------------------------- */
    /* SETTINGS GET                                                            */
    /* ---------------------------------------------------------------------- */

    case "SETTINGS_GET": {
      const requestedWorkspaceId = getRequestedWorkspaceId(ctx);

      console.log(
        "SETTINGS GET REQUEST:",
        JSON.stringify({
          workspace_id: requestedWorkspaceId,
          auth_user_id: ctx.authUserId,
          email: ctx.email,
          platform_owner: isPlatformOwner(ctx),
        }),
      );

      try {
        const workspaceId = await resolveSettingsWorkspaceId(ctx);

        const settings = await getSettings(ctx.supabaseAdmin, workspaceId);

        console.log(
          "SETTINGS GET SUCCESS:",
          JSON.stringify({
            workspace_id: workspaceId,
            platform_owner: isPlatformOwner(ctx),
          }),
        );

        return {
          success: true,
          settings,
        };
      } catch (error) {
        console.error("SETTINGS GET ERROR:", error);

        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Unable to load settings.",
        };
      }
    }

    /* ---------------------------------------------------------------------- */
    /* SETTINGS UPDATE                                                         */
    /* ---------------------------------------------------------------------- */

    case "SETTINGS_UPDATE": {
      const requestedWorkspaceId = getRequestedWorkspaceId(ctx);

      console.log(
        "SETTINGS UPDATE REQUEST:",
        JSON.stringify({
          workspace_id: requestedWorkspaceId,
          timezone: ctx.body.timezone,
          locale: ctx.body.locale,
          currency: ctx.body.currency,
          metadata: ctx.body.metadata,
          auth_user_id: ctx.authUserId,
          email: ctx.email,
          platform_owner: isPlatformOwner(ctx),
        }),
      );

      try {
        const workspaceId = await resolveSettingsWorkspaceId(ctx);

        const settings = await updateSettings(ctx.supabaseAdmin, workspaceId, {
          timezone: ctx.body.timezone,
          locale: ctx.body.locale,
          currency: ctx.body.currency,
          metadata: ctx.body.metadata,
        });

        console.log(
          "SETTINGS UPDATE SUCCESS:",
          JSON.stringify({
            workspace_id: workspaceId,
            platform_owner: isPlatformOwner(ctx),
          }),
        );

        return {
          success: true,
          message: "Settings updated successfully",
          settings,
        };
      } catch (error) {
        console.error("SETTINGS UPDATE ERROR:", error);

        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Unable to update settings.",
        };
      }
    }

    /* ---------------------------------------------------------------------- */
    /* UNKNOWN                                                                 */
    /* ---------------------------------------------------------------------- */

    default:
      return null;
  }
}
