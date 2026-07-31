import type { RouteContext } from "./types.ts";

import {
  listWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  activateWorkspace,
  deactivateWorkspace,
  deleteWorkspace,
  restoreWorkspace,
  hardDeleteWorkspace,
} from "../services/workspaces.ts";

export async function handleWorkspaceRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "WORKSPACE_LIST": {
      return {
        success: true,
        workspaces: await listWorkspaces(
          ctx.supabaseAdmin,
          ctx.body.include_deleted,
        ),
      };
    }

    case "WORKSPACE_GET": {
      const workspace = await getWorkspace(ctx.supabaseAdmin, ctx.body.id);

      if (!workspace) {
        return {
          success: false,
          message: "Workspace not found",
        };
      }

      return {
        success: true,
        workspace,
      };
    }

    case "WORKSPACE_CREATE": {
      try {
        const workspace = await createWorkspace(ctx.supabaseAdmin, {
          name: ctx.body.name,
          code: ctx.body.code,
          owner_email: ctx.body.owner_email ?? null,
          status: ctx.body.status,
        });

        return {
          success: true,
          message: "Workspace created successfully",
          workspace,
        };
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "23505"
        ) {
          return {
            success: false,
            message: "Workspace code already exists",
          };
        }

        throw error;
      }
    }

    case "WORKSPACE_UPDATE": {
      try {
        const workspace = await updateWorkspace(ctx.supabaseAdmin, {
          id: ctx.body.id,
          name: ctx.body.name,
          code: ctx.body.code,
          owner_email: ctx.body.owner_email,
          status: ctx.body.status,
        });

        return {
          success: true,
          message: "Workspace updated successfully",
          workspace,
        };
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "23505"
        ) {
          return {
            success: false,
            message: "Workspace code already exists",
          };
        }

        throw error;
      }
    }

    case "WORKSPACE_ACTIVATE": {
      const workspace = await activateWorkspace(ctx.supabaseAdmin, {
        id: ctx.body.id,
      });

      return {
        success: true,
        message: "Workspace activated successfully",
        workspace,
      };
    }

    case "WORKSPACE_DEACTIVATE": {
      const workspace = await deactivateWorkspace(ctx.supabaseAdmin, {
        id: ctx.body.id,
      });

      return {
        success: true,
        message: "Workspace deactivated successfully",
        workspace,
      };
    }

    case "WORKSPACE_DELETE": {
      await deleteWorkspace(ctx.supabaseAdmin, {
        id: ctx.body.id,
      });

      return {
        success: true,
        message: "Workspace deleted successfully",
      };
    }

    case "WORKSPACE_RESTORE": {
      const workspace = await restoreWorkspace(ctx.supabaseAdmin, {
        id: ctx.body.id,
      });

      return {
        success: true,
        message: "Workspace restored successfully",
        workspace,
      };
    }

    case "WORKSPACE_HARD_DELETE": {
      await hardDeleteWorkspace(ctx.supabaseAdmin, {
        id: ctx.body.id,
      });

      return {
        success: true,
        message: "Workspace permanently deleted",
      };
    }

    default:
      return null;
  }
}
