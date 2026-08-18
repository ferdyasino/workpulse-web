import type { RouteContext } from "./types.ts";

import {
  createUser,
  deactivateUser,
  deleteUser,
  getUser,
  getUserContext,
  hardDeleteUser,
  listUsers,
  restoreUser,
  updateUser,
  activateUser,
} from "../services/users.ts";

export async function handleUserRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "USER_CONTEXT_GET": {
      return await getUserContext(ctx.supabaseAdmin, ctx.authUserId, ctx.email);
    }

    case "USER_LIST": {
      console.log("USER LIST REQUEST:", JSON.stringify(ctx.body));

      return {
        success: true,

        users: await listUsers(
          ctx.supabaseAdmin,
          ctx.body.workspace_id,
          ctx.body.include_deleted ?? false,
        ),
      };
    }

    case "USER_GET": {
      console.log("USER GET REQUEST:", JSON.stringify(ctx.body));

      return {
        success: true,
        user: await getUser(
          ctx.supabaseAdmin,
          ctx.body.workspace_id,
          ctx.body.id,
        ),
      };
    }

    case "USER_CREATE": {
      try {
        const { ...payload } = ctx.body;

        const user = await createUser(ctx.supabaseAdmin, payload);

        return {
          success: true,
          message: "User created successfully",
          user,
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
            message: "User email already exists",
          };
        }

        throw error;
      }
    }

    case "USER_UPDATE": {
      try {
        const { ...payload } = ctx.body;

        const user = await updateUser(ctx.supabaseAdmin, payload);

        return {
          success: true,
          message: "User updated successfully",
          user,
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
            message: "User email already exists",
          };
        }

        throw error;
      }
    }

    case "USER_ACTIVATE": {
      const user = await activateUser(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "User activated successfully",
        user,
      };
    }

    case "USER_DEACTIVATE": {
      const user = await deactivateUser(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "User deactivated successfully",
        user,
      };
    }

    case "USER_DELETE": {
      await deleteUser(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "User deleted successfully",
      };
    }

    case "USER_RESTORE": {
      const user = await restoreUser(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "User restored successfully",
        user,
      };
    }

    case "USER_HARD_DELETE": {
      await hardDeleteUser(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "User permanently deleted",
      };
    }

    default:
      return null;
  }
}
