import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

type GetCurrentAttendanceStatePayload = {
  workspace_id: string;
  email: string;
  shift_id?: string;
  date?: string;
};

export type AttendanceState = {
  status: "OFF" | "WORKING" | "BREAK" | "LUNCH";

  time_in: string | null;

  time_out: string | null;

  breaks: {
    in: string | null;
    out: string | null;
  }[];

  lunch: {
    in: string | null;
    out: string | null;
  };
};

type TimeLogEvent =
  | "TIME_IN"
  | "TIME_OUT"
  | "BREAK_START"
  | "BREAK_END"
  | "LUNCH_START"
  | "LUNCH_END";

export async function getCurrentAttendanceState(
  supabaseAdmin: SupabaseClient<Database>,
  payload: GetCurrentAttendanceStatePayload,
): Promise<AttendanceState> {
  const { workspace_id, email, shift_id } = payload;

  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("workspace_id", workspace_id)
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User not found.");
  }

  let shiftQuery = supabaseAdmin
    .from("user_shifts")
    .select("id")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .is("deleted_at", null);

  if (shift_id) {
    shiftQuery = shiftQuery.eq("shift_id", shift_id);
  }

  const { data: userShift, error: shiftError } = await shiftQuery.maybeSingle();

  if (shiftError) {
    throw shiftError;
  }

  if (!userShift) {
    return {
      status: "OFF",
      time_in: null,
      time_out: null,
      breaks: [],
      lunch: {
        in: null,
        out: null,
      },
    };
  }

  const workDate = payload.date ?? new Date().toISOString().slice(0, 10);

  const { data: logs, error: logsError } = await supabaseAdmin
    .from("time_logs")
    .select("*")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user.id)
    .eq("user_shift_id", userShift.id)
    .eq("work_date", workDate)
    .order("event_time_utc", {
      ascending: true,
    });

  if (logsError) {
    throw logsError;
  }

  const state: AttendanceState = {
    status: "OFF",

    time_in: null,

    time_out: null,

    breaks: [],

    lunch: {
      in: null,
      out: null,
    },
  };

  for (const log of logs ?? []) {
    const eventType = log.event_type as TimeLogEvent;

    switch (eventType) {
      case "TIME_IN": {
        state.status = "WORKING";
        state.time_in = log.event_time_utc;
        state.time_out = null;
        break;
      }

      case "TIME_OUT": {
        state.status = "OFF";
        state.time_out = log.event_time_utc;
        break;
      }

      case "BREAK_START": {
        state.status = "BREAK";

        state.breaks.push({
          in: log.event_time_utc,
          out: null,
        });

        break;
      }

      case "BREAK_END": {
        state.status = "WORKING";

        const currentBreak = state.breaks[state.breaks.length - 1];

        if (currentBreak) {
          currentBreak.out = log.event_time_utc;
        }

        break;
      }

      case "LUNCH_START": {
        state.status = "LUNCH";
        state.lunch.in = log.event_time_utc;
        break;
      }

      case "LUNCH_END": {
        state.status = "WORKING";
        state.lunch.out = log.event_time_utc;
        break;
      }
    }
  }

  return state;
}
