export type TimeLogAction =
  "time_in" | "time_out" | "break_start" | "break_end" | "lunch_start" | "lunch_end";

export type BreakSession = {
  in?: string;
  out?: string;
};

export type LunchSession = {
  in?: string;
  out?: string;
};

export type TimeLog = {
  log_id?: string;
  action: TimeLogAction;
  timestamp: string;
  date: string;
};

export type AttendanceState = {
  work_date: string;

  status: string;

  is_clocked_in: boolean;
  is_on_break: boolean;
  is_at_lunch: boolean;
  is_clocked_out: boolean;

  breaks: BreakSession[];

  lunch: LunchSession;

  raw_logs: TimeLog[];
};
