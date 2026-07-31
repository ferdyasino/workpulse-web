import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApiRequest } from "@shared/types/api/api.request.ts";

import type { Database } from "../types/database.ts";

import { getAuthenticatedUser } from "../lib/auth.ts";

import { handleAuthRoutes } from "./auth.routes.ts";
import { handleContextRoutes } from "./context.routes.ts";
import { handleUserRoutes } from "./user.routes.ts";
import { handleDepartmentRoutes } from "./department.routes.ts";
import { handlePositionRoutes } from "./position.routes.ts";
import { handleShiftRoutes } from "./shift.routes.ts";
import { handleUserShiftRoutes } from "./user-shift.routes.ts";
import { handleAttendanceRoutes } from "./attendance.routes.ts";
import { handleTimelogRoutes } from "./timelog.routes.ts";
import { handleUserShiftOverrideRoutes } from "./user-shift-override.routes.ts";

export async function handleRequest(
  req: Request,
  body: ApiRequest,
  supabaseAdmin: SupabaseClient<Database>,
) {
  console.log("REQUEST BODY:", JSON.stringify(body));

  const authUser = await getAuthenticatedUser(req);

  if (!authUser.email) {
    throw new Error("Authenticated user email is missing");
  }

  const ctx = {
    req,
    body,
    supabaseAdmin,
    email: authUser.email,
  };

  const authResult = await handleAuthRoutes(ctx);

  if (authResult !== null) {
    return authResult;
  }

  const contextResult = await handleContextRoutes(ctx);

  if (contextResult !== null) {
    return contextResult;
  }

  const userResult = await handleUserRoutes(ctx);

  if (userResult !== null) {
    return userResult;
  }

  const departmentResult = await handleDepartmentRoutes(ctx);

  if (departmentResult !== null) {
    return departmentResult;
  }

  const positionResult = await handlePositionRoutes(ctx);

  if (positionResult !== null) {
    return positionResult;
  }

  const shiftResult = await handleShiftRoutes(ctx);

  if (shiftResult !== null) {
    return shiftResult;
  }

  // NEW
  const userShiftResult = await handleUserShiftRoutes(ctx);

  if (userShiftResult !== null) {
    return userShiftResult;
  }

  const userShiftOverrideResult = await handleUserShiftOverrideRoutes(ctx);

  if (userShiftOverrideResult !== null) {
    return userShiftOverrideResult;
  }

  const attendanceResult = await handleAttendanceRoutes(ctx);

  if (attendanceResult !== null) {
    return attendanceResult;
  }

  const timelogResult = await handleTimelogRoutes(ctx);

  if (timelogResult !== null) {
    return timelogResult;
  }

  throw new Error(`Unknown action: ${(body as { action: string }).action}`);
}
