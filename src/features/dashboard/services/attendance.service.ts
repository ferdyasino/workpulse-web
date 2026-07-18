import { apiRequest } from "@/utils/api";

import type { TimeLogAction } from "../types/attendance.types";

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

export async function submitTimeLog(workspaceId: string, payload: SubmitTimeLogPayload) {
  return apiRequest("/submitTimeLogAction", {
    body: JSON.stringify({
      workspace_id: workspaceId,
      ...payload,
    }),
  });
}
