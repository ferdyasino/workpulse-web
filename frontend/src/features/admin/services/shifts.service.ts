import { apiRequest } from "@/utils/api";

export type Shift = {
  id: string;
  name: string;
  description: string | null;
  start_time: string;
  end_time: string;
  timezone: string;
  grace_minutes: number;
  break_minutes: number;
  status: string;
  created_at: string;
};

export type GetShiftsRequest = {
  workspace_id: string;
};

type GetShiftsResponse = {
  success: boolean;
  message?: string;
  shifts?: Shift[];
};

export async function getShifts(payload: GetShiftsRequest): Promise<Shift[]> {
  const response = await apiRequest<
    GetShiftsResponse,
    GetShiftsRequest & {
      action: "SHIFT_LIST";
    }
  >({
    action: "SHIFT_LIST",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to load shifts");
  }

  return response.shifts ?? [];
}
