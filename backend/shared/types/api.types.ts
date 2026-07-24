import type {
  SubmitTimeLogRequest,
  AttendanceStateRequest,
} from "./attendance.types.ts";

export type ApiRequest =
  | {
      action: "AUTH_ME";
    }
  | {
      action: "WORKSPACE_GET";
    }
  | {
      action: "USER_CONTEXT_GET";
    }
  | {
      action: "EMPLOYEE_LIST";
      workspace_id: string;
    }
  | {
      action: "DEPARTMENT_LIST";
      workspace_id: string;
    }
  | {
      action: "DEPARTMENT_CREATE";
      workspace_id: string;
      name: string;
      description?: string;
    }
  | {
      action: "POSITION_LIST";
      workspace_id: string;
    }
  | {
      action: "SHIFT_LIST";
      workspace_id: string;
    }
  | ({
      action: "TIMELOG_CREATE";
    } & SubmitTimeLogRequest)
  | ({
      action: "ATTENDANCE_STATE_GET";
    } & AttendanceStateRequest);
