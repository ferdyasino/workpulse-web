import type { RouteContext } from "./types.ts";

import { getUserContext } from "../services/users.ts";
import { getSettings, updateSettings } from "../services/settings.ts";

export async function handleContextRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "USER_CONTEXT_GET": {
      return await getUserContext(ctx.supabaseAdmin, ctx.email);
    }

    case "WORKSPACE_GET": {
      const user = await getUserContext(ctx.supabaseAdmin, ctx.email);

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

      return data;
    }

    case "SETTINGS_GET": {
      const user = await getUserContext(ctx.supabaseAdmin, ctx.email);

      if (!user.workspace_id) {
        throw new Error("User workspace_id is missing");
      }

      return await getSettings(ctx.supabaseAdmin, user.workspace_id);
    }

    case "SETTINGS_UPDATE": {
      const user = await getUserContext(ctx.supabaseAdmin, ctx.email);

      if (!user.workspace_id) {
        throw new Error("User workspace_id is missing");
      }

      return await updateSettings(ctx.supabaseAdmin, user.workspace_id, {
        timezone: ctx.body.timezone,
        locale: ctx.body.locale,
        currency: ctx.body.currency,
        metadata: ctx.body.metadata,
      });
    }

    default:
      return null;
  }
}
