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

export type AttendanceShift = {
  id: string;

  name: string;

  description: string | null;

  status: "ACTIVE" | "INACTIVE";

  start_time: string;

  end_time: string;

  timezone: string;

  grace_minutes: number;

  break_minutes: number;

  is_overnight: boolean;
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

  shift: AttendanceShift | null;

  sessions: AttendanceSession[];

  current_session: AttendanceSession | null;
};

export type AttendanceStateRequest = {
  workspace_id: string;

  email: string;

  /**
   * Optional resolved work date.
   */
  date?: string;

  /**
   * Optional UTC timestamp used by the backend
   * to resolve the work date using the shift timezone.
   */
  timestamp?: string;
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
};
