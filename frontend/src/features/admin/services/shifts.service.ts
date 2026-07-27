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
  is_overnight: boolean;
  status: string;
  deleted_at: string | null;
  created_at: string;
};

export type GetShiftsRequest = {
  workspace_id: string;
  include_inactive?: boolean;
  include_deleted?: boolean;
};

export type CreateShiftRequest = {
  workspace_id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  timezone: string;
  break_minutes?: number;
  grace_minutes?: number;
  is_overnight?: boolean;
};

export type UpdateShiftRequest = {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  timezone: string;
  break_minutes?: number;
  grace_minutes?: number;
  is_overnight?: boolean;
};

export type ShiftActionRequest = {
  id: string;
  workspace_id: string;
};

type ShiftResponse = {
  success: boolean;
  message?: string;
  shift?: Shift;
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

export async function createShift(payload: CreateShiftRequest): Promise<Shift> {
  const response = await apiRequest<
    ShiftResponse,
    CreateShiftRequest & {
      action: "SHIFT_CREATE";
    }
  >({
    action: "SHIFT_CREATE",
    ...payload,
  });

  if (!response.success || !response.shift) {
    throw new Error(response.message ?? "Failed to create shift");
  }

  return response.shift;
}

export async function updateShift(payload: UpdateShiftRequest): Promise<Shift> {
  const response = await apiRequest<
    ShiftResponse,
    UpdateShiftRequest & {
      action: "SHIFT_UPDATE";
    }
  >({
    action: "SHIFT_UPDATE",
    ...payload,
  });

  if (!response.success || !response.shift) {
    throw new Error(response.message ?? "Failed to update shift");
  }

  return response.shift;
}

export async function activateShift(payload: ShiftActionRequest): Promise<Shift> {
  const response = await apiRequest<
    ShiftResponse,
    ShiftActionRequest & {
      action: "SHIFT_ACTIVATE";
    }
  >({
    action: "SHIFT_ACTIVATE",
    ...payload,
  });

  if (!response.success || !response.shift) {
    throw new Error(response.message ?? "Failed to activate shift");
  }

  return response.shift;
}

export async function deactivateShift(payload: ShiftActionRequest): Promise<Shift> {
  const response = await apiRequest<
    ShiftResponse,
    ShiftActionRequest & {
      action: "SHIFT_DEACTIVATE";
    }
  >({
    action: "SHIFT_DEACTIVATE",
    ...payload,
  });

  if (!response.success || !response.shift) {
    throw new Error(response.message ?? "Failed to deactivate shift");
  }

  return response.shift;
}

export async function deleteShift(payload: ShiftActionRequest): Promise<void> {
  const response = await apiRequest<
    {
      success: boolean;
      message?: string;
    },
    ShiftActionRequest & {
      action: "SHIFT_DELETE";
    }
  >({
    action: "SHIFT_DELETE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to delete shift");
  }
}

export async function restoreShift(payload: ShiftActionRequest): Promise<Shift> {
  const response = await apiRequest<
    ShiftResponse,
    ShiftActionRequest & {
      action: "SHIFT_RESTORE";
    }
  >({
    action: "SHIFT_RESTORE",
    ...payload,
  });

  if (!response.success || !response.shift) {
    throw new Error(response.message ?? "Failed to restore shift");
  }

  return response.shift;
}

export async function hardDeleteShift(payload: ShiftActionRequest): Promise<void> {
  const response = await apiRequest<
    {
      success: boolean;
      message?: string;
    },
    ShiftActionRequest & {
      action: "SHIFT_HARD_DELETE";
    }
  >({
    action: "SHIFT_HARD_DELETE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to permanently delete shift");
  }
}
