import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApiRequest } from "@shared/types/api.types.ts";

import type { Database } from "../types/database.ts";

import { getAuthenticatedUser } from "../lib/auth.ts";

import { getApplicationContext } from "../services/context.ts";
import { getUserContext, listUsers } from "../services/users.ts";

import { createTimeLog } from "../services/timelogs.ts";

import { getCurrentAttendanceState } from "../services/attendance/state.ts";
import { validateAttendanceAction } from "../services/attendance/validation.ts";

export async function handleRequest(
  req: Request,
  body: ApiRequest,
  supabaseAdmin: SupabaseClient<Database>,
) {
  try {
    console.log("REQUEST BODY:", JSON.stringify(body));

    const authUser = await getAuthenticatedUser(req);

    if (!authUser.email) {
      throw new Error("Authenticated user email is missing");
    }

    switch (body.action) {
      case "AUTH_ME": {
        return await getApplicationContext(supabaseAdmin, authUser.email);
      }

      case "WORKSPACE_GET": {
        const user = await getUserContext(supabaseAdmin, authUser.email);

        if (!user.workspace_id) {
          throw new Error("User workspace_id is missing");
        }

        const { data, error } = await supabaseAdmin
          .from("workspaces")
          .select("*")
          .eq("id", user.workspace_id)
          .is("deleted_at", null)
          .single();

        if (error) {
          throw error;
        }

        return data;
      }

      case "USER_CONTEXT_GET": {
        return await getUserContext(supabaseAdmin, authUser.email);
      }

      case "EMPLOYEE_LIST": {
        console.log("EMPLOYEE LIST REQUEST:", JSON.stringify(body));

        return await listUsers(supabaseAdmin, body.workspace_id);
      }

      case "TIMELOG_CREATE": {
        console.log("TIMELOG REQUEST:", JSON.stringify(body));

        const currentState = await getCurrentAttendanceState(supabaseAdmin, {
          workspace_id: body.workspace_id,

          email: authUser.email,

          ...(body.shift_id
            ? {
                shift_id: body.shift_id,
              }
            : {}),

          date: new Date().toISOString().slice(0, 10),
        });

        console.log("CURRENT STATE:", JSON.stringify(currentState));

        const validation = validateAttendanceAction(
          currentState,
          body.action_type,
        );

        console.log("VALIDATION RESULT:", JSON.stringify(validation));

        if (!validation.valid) {
          return {
            success: false,
            message: validation.message,
          };
        }

        const log = await createTimeLog(supabaseAdmin, {
          workspace_id: body.workspace_id,

          user_id: body.user_id,

          action_type: body.action_type,

          device_info: body.device_info,

          location: body.location,

          location_status: body.location_status,

          location_message: body.location_message,

          timestamp: body.timestamp,

          ...(body.shift_id
            ? {
                shift_id: body.shift_id,
              }
            : {}),
        });

        return {
          success: true,
          message: "Timelog created successfully",
          log_id: log.id,
        };
      }

      case "ATTENDANCE_STATE_GET": {
        console.log("CURRENT STATE REQUEST:", JSON.stringify(body));

        return await getCurrentAttendanceState(supabaseAdmin, {
          workspace_id: body.workspace_id,

          email: body.email,

          ...(body.shift_id
            ? {
                shift_id: body.shift_id,
              }
            : {}),

          ...(body.date
            ? {
                date: body.date,
              }
            : {}),
        });
      }

      default: {
        const _exhaustiveCheck: never = body;

        throw new Error(`Unknown action: ${_exhaustiveCheck}`);
      }
    }
  } catch (error) {
    console.error("API ERROR:", error);

    throw error;
  }
}
