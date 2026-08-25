import type { RouteContext } from "./types.ts";

import { getUserContext } from "../services/users.ts";
import { getSettings, updateSettings } from "../services/settings.ts";

export async function handleContextRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    /* ---------------------------------------------------------------------- */
    /* USER CONTEXT                                                            */
    /* ---------------------------------------------------------------------- */

    case "USER_CONTEXT_GET": {
      return await getUserContext(
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
        .single();

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
      console.log(
        "SETTINGS GET REQUEST:",
        JSON.stringify({
          workspace_id: ctx.body.workspace_id,
          auth_user_id: ctx.authUserId,
          email: ctx.email,
        }),
      );

      try {
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
         * Always use the authenticated user's workspace.
         *
         * Do not trust workspace_id supplied by the frontend.
         */
        const settings = await getSettings(
          ctx.supabaseAdmin,
          user.workspace_id,
        );

        console.log(
          "SETTINGS GET SUCCESS:",
          JSON.stringify({
            workspace_id: user.workspace_id,
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
      console.log(
        "SETTINGS UPDATE REQUEST:",
        JSON.stringify({
          workspace_id: ctx.body.workspace_id,
          timezone: ctx.body.timezone,
          locale: ctx.body.locale,
          currency: ctx.body.currency,
          metadata: ctx.body.metadata,
          auth_user_id: ctx.authUserId,
          email: ctx.email,
        }),
      );

      try {
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
         * Always update the authenticated user's workspace.
         *
         * The frontend workspace_id is intentionally ignored as the
         * authorization source.
         */
        const settings = await updateSettings(
          ctx.supabaseAdmin,
          user.workspace_id,
          {
            timezone: ctx.body.timezone,
            locale: ctx.body.locale,
            currency: ctx.body.currency,
            metadata: ctx.body.metadata,
          },
        );

        console.log(
          "SETTINGS UPDATE SUCCESS:",
          JSON.stringify({
            workspace_id: user.workspace_id,
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
