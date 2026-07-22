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

export type AttendanceStatus =
  "OFF" | "WORKING" | "ON_BREAK" | "ON_LUNCH" | "CLOCKED_OUT" | "ABSENT";

export type AttendanceState = {
  status: AttendanceStatus;

  work_date: string;

  sessions: AttendanceSession[];

  current_session: AttendanceSession | null;
};
