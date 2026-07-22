import { invokeFunction } from "@/utils/api";

import type { AttendanceState, TimeLogAction } from "../types/attendance.types";

export type SubmitTimeLogPayload = {
  user_id: string;

  email: string;

  shift_id?: string;

  action: TimeLogAction;

  device_info: string;

  location: unknown;

  location_status: string;

  location_message: string;

  timestamp: string;
};

export type SubmitTimeLogResponse = {
  success: boolean;

  message: string;

  log_id?: string;

  state?: AttendanceState;
};

export async function submitTimeLogAction(
  workspaceId: string,
  payload: SubmitTimeLogPayload,
): Promise<SubmitTimeLogResponse> {
  if (!workspaceId) {
    throw new Error("workspaceId is required");
  }

  const { action, ...rest } = payload;

  console.group(`TIMELOG_CREATE → ${action}`);
  console.log("REQUEST:", {
    workspace_id: workspaceId,
    action_type: action,
    ...rest,
  });

  const response = await invokeFunction<
    SubmitTimeLogResponse,
    {
      action: "TIMELOG_CREATE";

      workspace_id: string;

      action_type: TimeLogAction;
    } & Omit<SubmitTimeLogPayload, "action">
  >("api", {
    action: "TIMELOG_CREATE",

    workspace_id: workspaceId,

    action_type: action,

    ...rest,
  });

  console.log("RESPONSE:", response);
  console.groupEnd();

  return response;
}

export async function getCurrentAttendanceState(
  workspaceId: string,
  email: string,
  shiftId?: string,
  date?: string,
): Promise<AttendanceState> {
  if (!workspaceId) {
    throw new Error("workspaceId is required");
  }

  if (!email) {
    throw new Error("email is required");
  }

  console.group("ATTENDANCE_STATE_GET");
  console.log("REQUEST:", {
    workspace_id: workspaceId,
    email,
    shift_id: shiftId,
    date,
  });

  const state = await invokeFunction<
    AttendanceState,
    {
      action: "ATTENDANCE_STATE_GET";

      workspace_id: string;

      email: string;

      shift_id?: string;

      date?: string;
    }
  >("api", {
    action: "ATTENDANCE_STATE_GET",

    workspace_id: workspaceId,

    email,

    ...(shiftId
      ? {
          shift_id: shiftId,
        }
      : {}),

    ...(date
      ? {
          date,
        }
      : {}),
  });

  console.log("STATE:", state);
  console.groupEnd();

  return state;
}
