import type { SupabaseClient } from "@supabase/supabase-js";

import { getAuthenticatedUser } from "../lib/auth.ts";

import { getApplicationContext } from "../services/context.ts";
import { getUserContext } from "../services/users.ts";

import { createTimeLog } from "../services/timelogs.ts";
import { getCurrentAttendanceState } from "../services/attendance.ts";

import type { Database } from "../types/database.ts";

export type TimeLogAction =
  | "TIME_IN"
  | "TIME_OUT"
  | "BREAK_START"
  | "BREAK_END"
  | "LUNCH_START"
  | "LUNCH_END";

export type ApiRequest =
  | {
      action: "AUTH_ME";
    }
  | {
      action: "WORKSPACE_GET";
    }
  | {
      action: "USER_CONTEXT_GET";
    }
  | {
      action: "TIMELOG_CREATE";

      workspace_id: string;

      user_id: string;

      action_type: TimeLogAction;

      device_info: string;

      location: unknown;

      location_status: string;

      location_message: string;

      timestamp: string;
    }
  | {
      action: "ATTENDANCE_STATE_GET";

      workspace_id: string;

      email: string;

      date?: string;
    };

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

      case "TIMELOG_CREATE": {
        console.log("TIMELOG REQUEST:", JSON.stringify(body));

        if (!body.user_id) {
          throw new Error("TIMELOG_CREATE: user_id is missing");
        }

        if (!body.workspace_id) {
          throw new Error("TIMELOG_CREATE: workspace_id is missing");
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

          date: body.date,
        });
      }

      default: {
        throw new Error(`Unknown action: ${(body as any).action}`);
      }
    }
  } catch (error) {
    console.error("API ERROR:", error);

    throw error;
  }
}
