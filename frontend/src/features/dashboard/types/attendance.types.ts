export type TimeLogAction =
  "TIME_IN" | "TIME_OUT" | "BREAK_START" | "BREAK_END" | "LUNCH_START" | "LUNCH_END";

export type BreakSession = {
  in: string | null;

  out: string | null;
};

export type LunchSession = {
  in: string | null;

  out: string | null;
};

export type AttendanceSession = {
  time_in: string | null;

  time_out: string | null;

  breaks: BreakSession[];

  lunch: LunchSession;
};

export type TimeLog = {
  log_id?: string;

  action: TimeLogAction;

  timestamp: string;

  date: string;
};

export type AttendanceStatus = "OFF" | "WORKING" | "BREAK" | "LUNCH" | "CLOCKED_OUT" | "ABSENT";

export type AttendanceState = {
  status: AttendanceStatus;

  work_date: string;

  sessions: AttendanceSession[];

  current_session: AttendanceSession | null;
};

export type AttendanceStateRequest = {
  workspace_id: string;

  email: string;

  shift_id?: string;

  date?: string;
};

export type SubmitTimeLogRequest = {
  workspace_id: string;

  user_id: string;

  action_type: TimeLogAction;

  device_info: string;

  location: unknown;

  location_status: string;

  location_message: string;

  timestamp: string;

  shift_id?: string;
};
