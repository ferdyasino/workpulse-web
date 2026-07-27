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

export type CreatePositionRequest = {
  workspace_id: string;
  title: string;
  description?: string;
};

export type UpdatePositionRequest = {
  id: string;
  workspace_id: string;
  title: string;
  description?: string;
};

export type PositionActionRequest = {
  id: string;
  workspace_id: string;
};

type PositionResponse = {
  success: boolean;
  message?: string;
  position?: Position;
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

export async function createPosition(payload: CreatePositionRequest): Promise<Position> {
  const response = await apiRequest<
    PositionResponse,
    CreatePositionRequest & {
      action: "POSITION_CREATE";
    }
  >({
    action: "POSITION_CREATE",
    ...payload,
  });

  if (!response.success || !response.position) {
    throw new Error(response.message ?? "Failed to create position");
  }

  return response.position;
}

export async function updatePosition(payload: UpdatePositionRequest): Promise<Position> {
  const response = await apiRequest<
    PositionResponse,
    UpdatePositionRequest & {
      action: "POSITION_UPDATE";
    }
  >({
    action: "POSITION_UPDATE",
    ...payload,
  });

  if (!response.success || !response.position) {
    throw new Error(response.message ?? "Failed to update position");
  }

  return response.position;
}

export async function activatePosition(payload: PositionActionRequest): Promise<Position> {
  const response = await apiRequest<
    PositionResponse,
    PositionActionRequest & {
      action: "POSITION_ACTIVATE";
    }
  >({
    action: "POSITION_ACTIVATE",
    ...payload,
  });

  if (!response.success || !response.position) {
    throw new Error(response.message ?? "Failed to activate position");
  }

  return response.position;
}

export async function deactivatePosition(payload: PositionActionRequest): Promise<Position> {
  const response = await apiRequest<
    PositionResponse,
    PositionActionRequest & {
      action: "POSITION_DEACTIVATE";
    }
  >({
    action: "POSITION_DEACTIVATE",
    ...payload,
  });

  if (!response.success || !response.position) {
    throw new Error(response.message ?? "Failed to deactivate position");
  }

  return response.position;
}

export async function deletePosition(payload: PositionActionRequest): Promise<void> {
  const response = await apiRequest<
    { success: boolean; message?: string },
    PositionActionRequest & {
      action: "POSITION_DELETE";
    }
  >({
    action: "POSITION_DELETE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to delete position");
  }
}

export async function restorePosition(payload: PositionActionRequest): Promise<Position> {
  const response = await apiRequest<
    PositionResponse,
    PositionActionRequest & {
      action: "POSITION_RESTORE";
    }
  >({
    action: "POSITION_RESTORE",
    ...payload,
  });

  if (!response.success || !response.position) {
    throw new Error(response.message ?? "Failed to restore position");
  }

  return response.position;
}

export async function hardDeletePosition(payload: PositionActionRequest): Promise<void> {
  const response = await apiRequest<
    { success: boolean; message?: string },
    PositionActionRequest & {
      action: "POSITION_HARD_DELETE";
    }
  >({
    action: "POSITION_HARD_DELETE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to permanently delete position");
  }
}
