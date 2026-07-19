import { gasRequest } from "@/utils/api";

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

export async function submitTimeLogAction(workspaceId: string, payload: SubmitTimeLogPayload) {
  const { action, ...rest } = payload;

  return gasRequest<SubmitTimeLogResponse>("timelogs", {
    workspace_id: workspaceId,
    action_type: action,
    ...rest,
  });
}

export async function getCurrentAttendanceState(
  workspaceId: string,
  email: string,
  shiftId?: string,
  date?: string,
) {
  return gasRequest<AttendanceState>("getcurrentstate", {
    workspace_id: workspaceId,
    email,
    shift_id: shiftId,
    date,
  });
}
