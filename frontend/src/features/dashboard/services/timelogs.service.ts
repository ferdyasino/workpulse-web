import { apiRequest } from "@/utils/api";

export type Timelog = {
  id: string;
  event_type: string;
  event_time_utc: string;
  client_timestamp: string | null;
  timezone: string;
  work_date: string;
  metadata: Record<string, unknown>;
  user_shift_id: string;
  user_id: string;
};

export async function getTimelogs(params: {
  workspace_id: string;
  user_id: string;
  work_date?: string;
}) {
  return apiRequest<Timelog[]>({
    action: "TIMELOG_LIST",

    workspace_id: params.workspace_id,

    user_id: params.user_id,

    ...(params.work_date
      ? {
          work_date: params.work_date,
        }
      : {}),
  });
}
