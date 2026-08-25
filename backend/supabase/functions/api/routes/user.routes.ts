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

function getErrorDetails(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return {
      code: undefined,
      message: error instanceof Error ? error.message : String(error),
      details: undefined,
      hint: undefined,
    };
  }

  const value = error as Record<string, unknown>;

  return {
    code: typeof value.code === "string" ? value.code : undefined,
    message:
      typeof value.message === "string"
        ? value.message
        : "Unknown database error",
    details: typeof value.details === "string" ? value.details : undefined,
    hint: typeof value.hint === "string" ? value.hint : undefined,
  };
}

function getDatabaseErrorMessage(error: unknown, fallback: string) {
  const details = getErrorDetails(error);

  switch (details.code) {
    case "23505": {
      const combined = [details.message, details.details, details.hint]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (combined.includes("email")) {
        return "A user with this email already exists.";
      }

      if (combined.includes("employee_no")) {
        return "A user with this employee number already exists.";
      }

      if (combined.includes("users_email")) {
        return "A user with this email already exists.";
      }

      if (combined.includes("users_employee_no")) {
        return "A user with this employee number already exists.";
      }

      return "A user with the same unique information already exists.";
    }

    case "23503":
      return "The selected workspace, department, position, or another related record does not exist.";

    case "23502":
      return "A required user field is missing.";

    case "23514":
      return "The user contains a value that is not allowed by the database.";

    case "22P02":
      return "One of the supplied user values has an invalid format.";

    default:
      return fallback;
  }
}

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
      console.log(
        "USER CREATE REQUEST:",
        JSON.stringify({
          workspace_id: ctx.body.workspace_id,
          employee_no: ctx.body.employee_no,
          first_name: ctx.body.first_name,
          last_name: ctx.body.last_name,
          display_name: ctx.body.display_name,
          email: ctx.body.email,
          department_id: ctx.body.department_id,
          position_id: ctx.body.position_id,
          role: ctx.body.role,
          employment_status: ctx.body.employment_status,
          employment_type: ctx.body.employment_type,
          auth_enabled: ctx.body.auth_enabled,
          login_provider: ctx.body.login_provider,
        }),
      );

      try {
        const { action: _action, ...payload } = ctx.body;

        const user = await createUser(ctx.supabaseAdmin, payload);

        console.log(
          "USER CREATE SUCCESS:",
          JSON.stringify({
            id: user.id,
            workspace_id: user.workspace_id,
            email: user.email,
          }),
        );

        return {
          success: true,
          message: "User created successfully",
          user,
        };
      } catch (error) {
        const details = getErrorDetails(error);

        console.error("USER CREATE DATABASE ERROR:", JSON.stringify(details));

        return {
          success: false,
          message: getDatabaseErrorMessage(
            error,
            details.message || "Unable to create user.",
          ),
        };
      }
    }

    case "USER_UPDATE": {
      try {
        const { action: _action, ...payload } = ctx.body;

        const user = await updateUser(ctx.supabaseAdmin, payload);

        return {
          success: true,
          message: "User updated successfully",
          user,
        };
      } catch (error) {
        const details = getErrorDetails(error);

        console.error("USER UPDATE DATABASE ERROR:", JSON.stringify(details));

        return {
          success: false,
          message: getDatabaseErrorMessage(
            error,
            details.message || "Unable to update user.",
          ),
        };
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
