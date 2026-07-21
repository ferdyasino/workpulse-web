import type { SupabaseClient } from "@supabase/supabase-js";

import { getAuthenticatedUser } from "../lib/auth.ts";

import { getApplicationContext } from "../services/context.ts";
import { getUserContext } from "../services/users.ts";

import { createTimeLog } from "../services/timelogs.ts";
import { getCurrentAttendanceState } from "../services/attendance.ts";

import type { Database } from "../types/database.ts";

export type ApiRequest =
  | {
      action: "ME";
    }
  | {
      action: "GET_WORKSPACE";
    }
  | {
      action: "GET_USER_CONTEXT";
    }
  | {
      action: "timelogs";

      workspace_id: string;
      action_type: string;

      user_id: string;
      email: string;

      shift_id?: string;

      device_info: string;

      location: unknown;

      location_status: string;

      location_message: string;

      timestamp: string;
    }
  | {
      action: "getcurrentstate";

      workspace_id: string;

      email: string;

      shift_id?: string;

      date?: string;
    };

export async function handleRequest(
  req: Request,
  body: ApiRequest,
  supabaseAdmin: SupabaseClient<Database>,
) {
  try {
    console.log("REQUEST BODY:", JSON.stringify(body));

    switch (body.action) {
      case "ME": {
        const authUser = await getAuthenticatedUser(req);

        if (!authUser.email) {
          throw new Error("Authenticated user email is missing");
        }

        console.log("AUTH EMAIL:", authUser.email);

        return await getApplicationContext(supabaseAdmin, authUser.email);
      }

      case "GET_WORKSPACE": {
        const authUser = await getAuthenticatedUser(req);

        if (!authUser.email) {
          throw new Error("Authenticated user email is missing");
        }

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

      case "GET_USER_CONTEXT": {
        const authUser = await getAuthenticatedUser(req);

        if (!authUser.email) {
          throw new Error("Authenticated user email is missing");
        }

        return await getUserContext(supabaseAdmin, authUser.email);
      }

      case "timelogs": {
        await getAuthenticatedUser(req);

        console.log("TIMELOG REQUEST:", JSON.stringify(body));

        if (!body.user_id) {
          throw new Error("timelogs: user_id is missing");
        }

        if (!body.workspace_id) {
          throw new Error("timelogs: workspace_id is missing");
        }

        const log = await createTimeLog(supabaseAdmin, {
          workspace_id: body.workspace_id,

          user_id: body.user_id,

          email: body.email,

          shift_id: body.shift_id,

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

      case "getcurrentstate": {
        await getAuthenticatedUser(req);

        console.log("CURRENT STATE REQUEST:", JSON.stringify(body));

        return await getCurrentAttendanceState(supabaseAdmin, {
          workspace_id: body.workspace_id,

          email: body.email,

          shift_id: body.shift_id,

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
