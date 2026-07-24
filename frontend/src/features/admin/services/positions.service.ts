import { apiRequest } from "@/utils/api";

export type Position = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
};

export type GetPositionsRequest = {
  workspace_id: string;
};

type GetPositionsResponse = {
  success: boolean;
  message?: string;
  positions?: Position[];
};

export async function getPositions(payload: GetPositionsRequest): Promise<Position[]> {
  const response = await apiRequest<
    GetPositionsResponse,
    GetPositionsRequest & {
      action: "POSITION_LIST";
    }
  >({
    action: "POSITION_LIST",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to load positions");
  }

  return response.positions ?? [];
}
