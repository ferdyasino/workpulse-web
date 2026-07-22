import { invokeFunction } from "@/utils/api";

import type { AttendanceState, TimeLogAction } from "../types/attendance.types";

export type SubmitTimeLogPayload = {
  user_id: string;

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

  return invokeFunction<
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

  return invokeFunction<
    AttendanceState,
    {
      action: "ATTENDANCE_STATE_GET";

      workspace_id: string;

      email: string;

      date?: string;
    }
  >("api", {
    action: "ATTENDANCE_STATE_GET",

    workspace_id: workspaceId,

    email,

    ...(date
      ? {
          date,
        }
      : {}),
  });
}
