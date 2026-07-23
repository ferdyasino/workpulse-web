export type AttendanceStatus =
  "OFF" | "WORKING" | "BREAK" | "LUNCH" | "CLOCKED_OUT";

export type TimeLogEvent =
  | "TIME_IN"
  | "TIME_OUT"
  | "BREAK_START"
  | "BREAK_END"
  | "LUNCH_START"
  | "LUNCH_END";

export type AttendanceBreak = {
  in: string | null;
  out: string | null;
};

export type AttendanceLunch = {
  in: string | null;
  out: string | null;
};

export type AttendanceSession = {
  time_in: string | null;
  time_out: string | null;

  breaks: AttendanceBreak[];

  lunch: AttendanceLunch;
};

export type AttendanceState = {
  status: AttendanceStatus;

  work_date: string;

  sessions: AttendanceSession[];

  current_session: AttendanceSession | null;
};

export type AttendanceStateRequest = {
  workspace_id: string;

  email: string;

  shift_id?: string | undefined;

  date?: string;
};

export type SubmitTimeLogRequest = {
  workspace_id: string;

  user_id: string;

  action_type: TimeLogEvent;

  device_info: string;

  location: unknown;

  location_status: string;

  location_message: string;

  timestamp: string;

  shift_id?: string;
};
