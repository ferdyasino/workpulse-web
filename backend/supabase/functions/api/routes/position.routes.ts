import type { RouteContext } from "./types.ts";

import { listPositions } from "../services/positions.ts";

export async function handlePositionRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "POSITION_LIST": {
      console.log("POSITION LIST REQUEST:", JSON.stringify(ctx.body));

      return {
        success: true,
        positions: await listPositions(
          ctx.supabaseAdmin,
          ctx.body.workspace_id,
        ),
      };
    }

    default:
      return null;
  }
}
