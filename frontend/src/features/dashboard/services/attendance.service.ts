import { invokeFunction } from "@/utils/api";

import type { AttendanceState, TimeLogAction } from "../types/attendance.types";

export type SubmitTimeLogPayload = {
  user_id: string;

  email: string;

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

type SubmitTimeLogRequest = {
  action: "TIMELOG_CREATE";

  workspace_id: string;

  action_type: TimeLogAction;

  user_id: string;

  email: string;

  device_info: string;

  location: unknown;

  location_status: string;

  location_message: string;

  timestamp: string;
};

type AttendanceStateRequest = {
  action: "ATTENDANCE_STATE_GET";

  workspace_id: string;

  email: string;

  date?: string;
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

  const response = await invokeFunction<SubmitTimeLogResponse, SubmitTimeLogRequest>("api", {
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
    date,
  });

  const state = await invokeFunction<AttendanceState, AttendanceStateRequest>("api", {
    action: "ATTENDANCE_STATE_GET",

    workspace_id: workspaceId,

    email,

    ...(date ? { date } : {}),
  });

  console.log("STATE:", state);
  console.groupEnd();

  return state;
}
