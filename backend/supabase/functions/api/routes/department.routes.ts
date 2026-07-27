import type { RouteContext } from "./types.ts";

import {
  listDepartments,
  createDepartment,
  updateDepartment,
  activateDepartment,
  deactivateDepartment,
  restoreDepartment,
  deleteDepartment,
  hardDeleteDepartment,
} from "../services/departments.ts";

export async function handleDepartmentRoutes(ctx: RouteContext) {
  switch (ctx.body.action) {
    case "DEPARTMENT_LIST": {
      console.log("DEPARTMENT LIST REQUEST:", JSON.stringify(ctx.body));

      return await listDepartments(ctx.supabaseAdmin, ctx.body.workspace_id);
    }

    case "DEPARTMENT_CREATE": {
      try {
        const department = await createDepartment(ctx.supabaseAdmin, {
          workspace_id: ctx.body.workspace_id,
          name: ctx.body.name,
          ...(ctx.body.description
            ? {
                description: ctx.body.description,
              }
            : {}),
        });

        return {
          success: true,
          message: "Department created successfully",
          department,
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
            message: "Department name already exists",
          };
        }

        throw error;
      }
    }

    case "DEPARTMENT_UPDATE": {
      try {
        const department = await updateDepartment(ctx.supabaseAdmin, {
          id: ctx.body.id,
          workspace_id: ctx.body.workspace_id,
          name: ctx.body.name,
          ...(ctx.body.description
            ? {
                description: ctx.body.description,
              }
            : {}),
        });

        return {
          success: true,
          message: "Department updated successfully",
          department,
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
            message: "Department already exists",
          };
        }

        throw error;
      }
    }

    case "DEPARTMENT_ACTIVATE": {
      const department = await activateDepartment(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "Department activated successfully",
        department,
      };
    }

    case "DEPARTMENT_DEACTIVATE": {
      const department = await deactivateDepartment(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "Department deactivated successfully",
        department,
      };
    }

    case "DEPARTMENT_DELETE": {
      console.log("DEPARTMENT DELETE REQUEST:", JSON.stringify(ctx.body));

      await deleteDepartment(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "Department deleted successfully",
      };
    }

    case "DEPARTMENT_RESTORE": {
      const department = await restoreDepartment(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "Department restored successfully",
        department,
      };
    }

    case "DEPARTMENT_HARD_DELETE": {
      await hardDeleteDepartment(ctx.supabaseAdmin, {
        id: ctx.body.id,
        workspace_id: ctx.body.workspace_id,
      });

      return {
        success: true,
        message: "Department permanently deleted",
      };
    }

    default:
      return null;
  }
}
