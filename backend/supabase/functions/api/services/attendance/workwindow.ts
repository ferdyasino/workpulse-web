import { resolveWorkDate } from "./work-date.ts";

export type ResolveWorkWindowOptions = {
  timestamp: Date;

  shiftStart: string;

  shiftEnd: string;

  isOvernight: boolean;
};

export type WorkWindow = {
  workDate: string;

  startsAt: Date;

  endsAt: Date;
};

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);

  copy.setUTCDate(copy.getUTCDate() + days);

  return copy;
}

function setTime(date: Date, time: string): Date {
  const [hour, minute, second = "0"] = time.split(":");

  const copy = new Date(date);

  copy.setUTCHours(Number(hour), Number(minute), Number(second), 0);

  return copy;
}

export function resolveWorkWindow(
  options: ResolveWorkWindowOptions,
): WorkWindow {
  const workDate = resolveWorkDate(options);

  const base = parseDate(workDate);

  const startsAt = setTime(base, options.shiftStart);

  let endsAt = setTime(base, options.shiftEnd);

  if (options.isOvernight) {
    endsAt = addDays(endsAt, 1);
  }

  return {
    workDate,
    startsAt,
    endsAt,
  };
}
