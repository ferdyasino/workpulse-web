import type { RouteContext } from "./types.ts";
import { getUserContext } from "../services/users.ts";

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

    default:
      return null;
  }
}
