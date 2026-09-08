import type { RouteContext } from "./types.ts";

import { getApplicationContext } from "../services/context.ts";

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
 * Verify that a workspace exists and is not deleted.
 *
 * This is used for Platform Owner operations because Platform Owner access
 * does not depend on workspace_members.
 */
async function verifyWorkspaceExists(
  ctx: RouteContext,
  workspaceId: string,
): Promise<string> {
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

/**
 * Resolve the workspace authorized for settings operations.
 *
 * Platform Owner:
 *   Explicitly supplied workspace_id is authoritative.
 *   No workspace membership is required.
 *
 * Normal user:
 *   Explicitly supplied workspace_id is passed through getUserContext().
 *   getUserContext() validates the user's active workspace_members row.
 *
 * This avoids using users.workspace_id as the authorization source.
 */
async function resolveSettingsWorkspaceId(ctx: RouteContext): Promise<string> {
  const workspaceId = getRequestedWorkspaceId(ctx);

  if (!workspaceId) {
    throw new Error("A workspace must be selected.");
  }

  /* ------------------------------------------------------------------------ */
  /* Platform Owner                                                           */
  /* ------------------------------------------------------------------------ */

  if (isPlatformOwner(ctx)) {
    return await verifyWorkspaceExists(ctx, workspaceId);
  }

  /* ------------------------------------------------------------------------ */
  /* Normal Workspace User                                                    */
  /* ------------------------------------------------------------------------ */

  const user = await getUserContext(
    ctx.supabaseAdmin,
    ctx.authUserId,
    ctx.email,
    ctx.authProvider,
    workspaceId,
  );

  if (!user.workspace_id) {
    throw new Error("User workspace_id is missing.");
  }

  if (user.workspace_id !== workspaceId) {
    throw new Error("User does not belong to this workspace.");
  }

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
      const requestedWorkspaceId = getRequestedWorkspaceId(ctx);

      console.log(
        "USER CONTEXT REQUEST:",
        JSON.stringify({
          workspace_id: requestedWorkspaceId,
          auth_user_id: ctx.authUserId,
          email: ctx.email,
          platform_owner: isPlatformOwner(ctx),
        }),
      );

      /*
       * Platform Owner:
       *
       * No workspace is required during initial authentication.
       *
       * If a workspace has already been selected, pass it into
       * getUserContext() so the real public.users ID and workspace-specific
       * shift can be resolved.
       */
      if (isPlatformOwner(ctx)) {
        return await getUserContext(
          ctx.supabaseAdmin,
          ctx.authUserId,
          ctx.email,
          ctx.authProvider,
          requestedWorkspaceId,
        );
      }

      /*
       * Normal users must resolve against a specific workspace.
       */
      if (!requestedWorkspaceId) {
        throw new Error("A workspace must be selected.");
      }

      return await getUserContext(
        ctx.supabaseAdmin,
        ctx.authUserId,
        ctx.email,
        ctx.authProvider,
        requestedWorkspaceId,
      );
    }

    /* ---------------------------------------------------------------------- */
    /* APPLICATION CONTEXT                                                     */
    /* ---------------------------------------------------------------------- */

    case "AUTH_ME": {
      /*
       * AUTH_ME must remain workspace-independent.
       *
       * This is important during login because a Platform Owner may not
       * have selected a workspace yet.
       *
       * getApplicationContext() is responsible for recognizing the
       * authenticated Platform Owner and returning a valid application
       * context without requiring workspace membership.
       */
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
       */
      const workspaceId = ctx.body.id;

      if (!workspaceId) {
        throw new Error("Workspace ID is required.");
      }

      console.log(
        "WORKSPACE GET REQUEST:",
        JSON.stringify({
          workspace_id: workspaceId,
          auth_user_id: ctx.authUserId,
          email: ctx.email,
          platform_owner: isPlatformOwner(ctx),
        }),
      );

      /* -------------------------------------------------------------------- */
      /* Platform Owner                                                       */
      /* -------------------------------------------------------------------- */

      if (isPlatformOwner(ctx)) {
        const verifiedWorkspaceId = await verifyWorkspaceExists(
          ctx,
          workspaceId,
        );

        const { data, error } = await ctx.supabaseAdmin
          .from("workspaces")
          .select("*")
          .eq("id", verifiedWorkspaceId)
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

      /*
       * Do NOT use users.workspace_id here.
       *
       * getUserContext() validates the selected workspace against the
       * user's active workspace_members record.
       */
      const user = await getUserContext(
        ctx.supabaseAdmin,
        ctx.authUserId,
        ctx.email,
        ctx.authProvider,
        workspaceId,
      );

      if (!user.workspace_id) {
        throw new Error("User workspace_id is missing.");
      }

      if (user.workspace_id !== workspaceId) {
        throw new Error("User does not belong to this workspace.");
      }

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
