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

  if (!("payload" in body)) {
    return null;
  }

  switch (body.action) {
    case "USER_SHIFT_OVERRIDE_LIST":
      return await listUserShiftOverrides(
        supabaseAdmin,
        body.workspace_id,
        body.user_id,
      );

    case "USER_SHIFT_OVERRIDE_GET":
      return await getUserShiftOverride(
        supabaseAdmin,
        body.workspace_id,
        body.id,
      );

    case "USER_SHIFT_OVERRIDE_CREATE":
      return await createUserShiftOverride(
        supabaseAdmin,
        body as CreateUserShiftOverridePayload,
      );

    case "USER_SHIFT_OVERRIDE_UPDATE":
      return await updateUserShiftOverride(
        supabaseAdmin,
        body as UpdateUserShiftOverridePayload,
      );

    case "USER_SHIFT_OVERRIDE_DELETE":
      return await deleteUserShiftOverride(
        supabaseAdmin,
        body as UserShiftOverrideActionPayload,
      );

    case "USER_SHIFT_OVERRIDE_RESTORE":
      return await restoreUserShiftOverride(
        supabaseAdmin,
        body as UserShiftOverrideActionPayload,
      );

    case "USER_SHIFT_OVERRIDE_HARD_DELETE":
      return await hardDeleteUserShiftOverride(
        supabaseAdmin,
        body as UserShiftOverrideActionPayload,
      );

    default:
      return null;
  }
}
