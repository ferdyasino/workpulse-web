import type { RouteContext } from "./types.ts";

import {
  activatePosition,
  createPosition,
  deactivatePosition,
  deletePosition,
  hardDeletePosition,
  listPositions,
  restorePosition,
  updatePosition,
} from "../services/positions.ts";

export async function handlePositionRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "POSITION_LIST": {
      console.log("POSITION LIST REQUEST:", JSON.stringify(ctx.body));

      return {
        success: true,
        positions: await listPositions(
          ctx.supabaseAdmin,
          ctx.body.workspace_id,
          ctx.body.include_inactive,
          ctx.body.include_deleted,
        ),
      };
    }

    case "POSITION_CREATE": {
      console.log("POSITION CREATE REQUEST:", JSON.stringify(ctx.body));

      return {
        success: true,
        position: await createPosition(
          ctx.supabaseAdmin,
          ctx.body.workspace_id,
          ctx.body.title,
          ctx.body.description,
        ),
      };
    }

    case "POSITION_UPDATE": {
      console.log("POSITION UPDATE REQUEST:", JSON.stringify(ctx.body));

      return {
        success: true,
        position: await updatePosition(ctx.supabaseAdmin, ctx.body.id, {
          title: ctx.body.title,
          description: ctx.body.description,
        }),
      };
    }

    case "POSITION_ACTIVATE": {
      console.log("POSITION ACTIVATE REQUEST:", JSON.stringify(ctx.body));

      return {
        success: true,
        position: await activatePosition(ctx.supabaseAdmin, ctx.body.id),
      };
    }

    case "POSITION_DEACTIVATE": {
      console.log("POSITION DEACTIVATE REQUEST:", JSON.stringify(ctx.body));

      return {
        success: true,
        position: await deactivatePosition(ctx.supabaseAdmin, ctx.body.id),
      };
    }

    case "POSITION_DELETE": {
      console.log("POSITION DELETE REQUEST:", JSON.stringify(ctx.body));

      await deletePosition(ctx.supabaseAdmin, ctx.body.id);

      return {
        success: true,
      };
    }

    case "POSITION_RESTORE": {
      console.log("POSITION RESTORE REQUEST:", JSON.stringify(ctx.body));

      return {
        success: true,
        position: await restorePosition(ctx.supabaseAdmin, ctx.body.id),
      };
    }

    case "POSITION_HARD_DELETE": {
      console.log("POSITION HARD DELETE REQUEST:", JSON.stringify(ctx.body));

      await hardDeletePosition(ctx.supabaseAdmin, ctx.body.id);

      return {
        success: true,
      };
    }

    default:
      return null;
  }
}
