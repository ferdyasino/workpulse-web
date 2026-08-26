import type { DepartmentApiRequest } from "./api.department.ts";
import type { PositionApiRequest } from "./api.position.ts";
import type { SettingsApiRequest } from "./api.settings.ts";
import type { ShiftApiRequest } from "./api.shift.ts";
import type { UserApiRequest } from "./api.user.ts";
import type { UserShiftOverrideApiRequest } from "./api.user-shift-override.ts";
import type { UserShiftApiRequest } from "./api.user-shift.ts";
import type { WorkspaceApiRequest } from "./api.workspace.ts";

import type {
  AttendanceStateRequest,
  SubmitTimeLogRequest,
} from "../models/attendance.types.ts";

export type ApiRequest =
  | {
      action: "AUTH_ME";
    }
  | WorkspaceApiRequest
  | {
      action: "USER_CONTEXT_GET";
    }
  | DepartmentApiRequest
  | PositionApiRequest
  | ShiftApiRequest
  | SettingsApiRequest
  | UserApiRequest
  | UserShiftApiRequest
  | UserShiftOverrideApiRequest
  | ({
      action: "TIMELOG_CREATE";
    } & SubmitTimeLogRequest)
  | {
      action: "TIMELOG_LIST";
      workspace_id: string;
      work_date?: string;
    }
  | ({
      action: "ATTENDANCE_STATE_GET";
    } & AttendanceStateRequest);
