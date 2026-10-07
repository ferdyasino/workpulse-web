import type { RouteContext } from "./types.ts";

import { getApplicationContext } from "../services/context.ts";

import { getSettings, updateSettings } from "../services/settings.ts";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Determine whether the authenticated Supabase user is the configured
 * Platform Owner.
 *
 * IMPORTANT:
 *
 * This only identifies the Platform Owner.
 *
 * Actual authentication has already been performed by Supabase Auth.
 *
 * The password is NEVER handled here.
 */
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
 * Require an authenticated Supabase UUID.
 *
 * This prevents downstream routes from attempting to authorize a request
 * using email alone.
 */
function requireAuthUserId(ctx: RouteContext): string {
  const authUserId = ctx.authUserId?.trim();

  if (!authUserId) {
    throw new Error("Invalid credentials.");
  }

  return authUserId;
}

/**
 * Verify that a workspace exists and is not deleted.
 *
 * Used by Platform Owner operations because Platform Owner access does not
 * depend on workspace_members.
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
 * Resolve the application context for a specific workspace.
 *
 * This is the authorization boundary for normal users.
 *
 * getApplicationContext() guarantees:
 *
 *   auth.users.id
 *        =
 *   public.users.id
 *
 * and then validates workspace_members.
 *
 * Platform Owner is handled by the same function and does not require
 * workspace_members.
 */
async function resolveAuthorizedApplicationContext(
  ctx: RouteContext,
  workspaceId: string | null = null,
) {
  const authUserId = requireAuthUserId(ctx);

  return await getApplicationContext(
    ctx.supabaseAdmin,
    authUserId,
    ctx.email,
    ctx.authProvider,
    workspaceId,
  );
}

/**
 * Resolve the workspace authorized for settings operations.
 *
 * Platform Owner:
 *   Explicit workspace_id is required and is validated directly.
 *
 * Normal user:
 *   getApplicationContext() validates:
 *
 *     auth.users.id
 *          ↓
 *     public.users.id
 *          ↓
 *     workspace_members
 *
 * This prevents users.workspace_id from becoming the authorization source.
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

  const applicationContext = await resolveAuthorizedApplicationContext(
    ctx,
    workspaceId,
  );

  if (!applicationContext.user.user_id) {
    throw new Error("Invalid credentials.");
  }

  if (!applicationContext.workspace) {
    throw new Error("User workspace could not be resolved.");
  }

  if (applicationContext.user.workspace_id !== workspaceId) {
    throw new Error("User does not belong to this workspace.");
  }

  return workspaceId;
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

      /* -------------------------------------------------------------------- */
      /* Platform Owner                                                       */
      /* -------------------------------------------------------------------- */

      if (isPlatformOwner(ctx)) {
        /*
         * Platform Owner can authenticate without a workspace.
         *
         * If no workspace has been selected yet, getApplicationContext()
         * returns the global Platform Owner context.
         *
         * If a workspace was selected, it validates that the workspace
         * exists and returns the appropriate workspace context.
         */
        const applicationContext = await resolveAuthorizedApplicationContext(
          ctx,
          requestedWorkspaceId,
        );

        return applicationContext.user;
      }

      /* -------------------------------------------------------------------- */
      /* Normal User                                                          */
      /* -------------------------------------------------------------------- */

      if (!requestedWorkspaceId) {
        throw new Error("A workspace must be selected.");
      }

      /*
       * getApplicationContext() is intentionally used instead of calling
       * getUserContext() directly.
       *
       * This guarantees that the authenticated Supabase UUID is validated
       * against public.users.id before user context is returned.
       */
      const applicationContext = await resolveAuthorizedApplicationContext(
        ctx,
        requestedWorkspaceId,
      );

      if (!applicationContext.user.user_id) {
        throw new Error("Invalid credentials.");
      }

      if (applicationContext.user.workspace_id !== requestedWorkspaceId) {
        throw new Error("User does not belong to this workspace.");
      }

      return applicationContext.user;
    }

    /* ---------------------------------------------------------------------- */
    /* APPLICATION CONTEXT                                                     */
    /* ---------------------------------------------------------------------- */

    case "AUTH_ME": {
      /*
       * AUTH_ME is deliberately workspace-independent.
       *
       * This is required immediately after login.
       *
       * Email/password authentication:
       *
       *   signInWithPassword()
       *          ↓
       *   Supabase validates password
       *          ↓
       *   Supabase session
       *          ↓
       *   AUTH_ME
       *
       * Google authentication:
       *
       *   signInWithIdToken()
       *          ↓
       *   Supabase validates Google token
       *          ↓
       *   Supabase session
       *          ↓
       *   AUTH_ME
       *
       * AUTH_ME NEVER receives or validates a password.
       *
       * getApplicationContext() then verifies:
       *
       *   auth.users.id
       *        ↓
       *   public.users.id
       *
       * except for the configured Platform Owner.
       */
      return await resolveAuthorizedApplicationContext(ctx, null);
    }

    /* ---------------------------------------------------------------------- */
    /* WORKSPACE                                                               */
    /* ---------------------------------------------------------------------- */

    case "WORKSPACE_GET": {
      /*
       * WORKSPACE_GET defines `id`, not `workspace_id`.
       */
      const workspaceId = ctx.body.id?.trim();

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
      /* Normal User                                                          */
      /* -------------------------------------------------------------------- */

      /*
       * getApplicationContext() validates both:
       *
       *   1. public.users.id === authUserId
       *   2. active workspace_members membership
       */
      const applicationContext = await resolveAuthorizedApplicationContext(
        ctx,
        workspaceId,
      );

      if (!applicationContext.user.user_id) {
        throw new Error("Invalid credentials.");
      }

      if (applicationContext.user.workspace_id !== workspaceId) {
        throw new Error("User does not belong to this workspace.");
      }

      if (!applicationContext.workspace) {
        throw new Error("Workspace not found.");
      }

      return {
        success: true,
        workspace: applicationContext.workspace,
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
