import type { DepartmentApiRequest } from "./api.department.ts";
import type { PositionApiRequest } from "./api.position.ts";
import type { SettingsApiRequest } from "./api.settings.ts";
import type { ShiftApiRequest } from "./api.shift.ts";
import type {
  AttendanceStateRequest,
  SubmitTimeLogRequest,
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
  | DepartmentApiRequest
  | PositionApiRequest
  | ShiftApiRequest
  | SettingsApiRequest
  | ({
      action: "TIMELOG_CREATE";
    } & SubmitTimeLogRequest)
  | {
      action: "TIMELOG_LIST";
      workspace_id: string;
      user_id?: string;
      work_date?: string;
    }
  | ({
      action: "ATTENDANCE_STATE_GET";
    } & AttendanceStateRequest);
