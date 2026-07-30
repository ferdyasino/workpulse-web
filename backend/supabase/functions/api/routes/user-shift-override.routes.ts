import {
  listUserShiftOverrides,
  getUserShiftOverride,
  createUserShiftOverride,
  updateUserShiftOverride,
  deleteUserShiftOverride,
  restoreUserShiftOverride,
  hardDeleteUserShiftOverride,
} from "../services/user_shift_overrides.ts";

import type { RouteContext } from "./types.ts";

import type {
  CreateUserShiftOverridePayload,
  UpdateUserShiftOverridePayload,
  UserShiftOverrideActionPayload,
} from "../services/user_shift_overrides.ts";

export async function handleUserShiftOverrideRoutes(ctx: RouteContext) {
  const { body, supabaseAdmin } = ctx;

  switch (body.action) {
    case "USER_SHIFT_OVERRIDE_LIST": {
      console.log("USER SHIFT OVERRIDE LIST REQUEST:", JSON.stringify(body));

      return {
        success: true,
        user_shift_overrides: await listUserShiftOverrides(
          supabaseAdmin,
          body.workspace_id,
          body.user_id,
          {
            include_deleted: body.include_deleted ?? false,
          },
        ),
      };
    }

    case "USER_SHIFT_OVERRIDE_GET": {
      console.log("USER SHIFT OVERRIDE GET REQUEST:", JSON.stringify(body));

      return {
        success: true,
        user_shift_override: await getUserShiftOverride(
          supabaseAdmin,
          body.workspace_id,
          body.id,
        ),
      };
    }

    case "USER_SHIFT_OVERRIDE_CREATE": {
      console.log("USER SHIFT OVERRIDE CREATE REQUEST:", JSON.stringify(body));

      return {
        success: true,
        user_shift_override: await createUserShiftOverride(
          supabaseAdmin,
          body as CreateUserShiftOverridePayload,
        ),
      };
    }

    case "USER_SHIFT_OVERRIDE_UPDATE": {
      console.log("USER SHIFT OVERRIDE UPDATE REQUEST:", JSON.stringify(body));

      return {
        success: true,
        user_shift_override: await updateUserShiftOverride(
          supabaseAdmin,
          body as UpdateUserShiftOverridePayload,
        ),
      };
    }

    case "USER_SHIFT_OVERRIDE_DELETE": {
      console.log("USER SHIFT OVERRIDE DELETE REQUEST:", JSON.stringify(body));

      await deleteUserShiftOverride(
        supabaseAdmin,
        body as UserShiftOverrideActionPayload,
      );

      return {
        success: true,
      };
    }

    case "USER_SHIFT_OVERRIDE_RESTORE": {
      console.log("USER SHIFT OVERRIDE RESTORE REQUEST:", JSON.stringify(body));

      return {
        success: true,
        user_shift_override: await restoreUserShiftOverride(
          supabaseAdmin,
          body as UserShiftOverrideActionPayload,
        ),
      };
    }

    case "USER_SHIFT_OVERRIDE_HARD_DELETE": {
      console.log(
        "USER SHIFT OVERRIDE HARD DELETE REQUEST:",
        JSON.stringify(body),
      );

      await hardDeleteUserShiftOverride(
        supabaseAdmin,
        body as UserShiftOverrideActionPayload,
      );

      return {
        success: true,
      };
    }

    default:
      return null;
  }
}
