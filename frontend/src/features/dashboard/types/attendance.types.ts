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

export type TimeLog = {
  log_id?: string;

  action: TimeLogAction;

  timestamp: string;

  date: string;
};

export type AttendanceState = {
  status: "OFF" | "WORKING" | "BREAK" | "LUNCH" | "CLOCKED_OUT";

  time_in: string | null;

  time_out: string | null;

  breaks: BreakSession[];

  lunch: LunchSession;
};
