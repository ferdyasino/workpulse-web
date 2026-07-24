import type { RouteContext } from "./types.ts";

import { listShifts } from "../services/shifts.ts";

export async function handleShiftRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "SHIFT_LIST": {
      console.log("SHIFT LIST REQUEST:", JSON.stringify(ctx.body));

      return {
        success: true,
        shifts: await listShifts(ctx.supabaseAdmin, ctx.body.workspace_id),
      };
    }

    default:
      return null;
  }
}
