import { resolveWorkDate } from "./workdate.ts";

export type ResolveWorkWindowOptions = {
  timestamp: Date;
  shiftStart: string;
  shiftEnd: string;
  isOvernight: boolean;
  timezone: string;
};

export type WorkWindow = {
  workDate: string;
  startsAt: Date;
  endsAt: Date;
};

function getTimezoneOffsetMinutes(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  const local = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return (local - date.getTime()) / 60000;
}

function zonedDateTimeToUtc(
  date: string,
  time: string,
  timezone: string,
): Date {
  const [hour, minute, second = 0] = time.split(":").map(Number);

  const assumedUtc = new Date(
    `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}.000Z`,
  );

  const offset = getTimezoneOffsetMinutes(assumedUtc, timezone);

  return new Date(assumedUtc.getTime() - offset * 60_000);
}

function addCalendarDay(date: string): string {
  const value = new Date(`${date}T12:00:00Z`);

  value.setUTCDate(value.getUTCDate() + 1);

  return value.toISOString().slice(0, 10);
}

export function resolveWorkWindow(
  options: ResolveWorkWindowOptions,
): WorkWindow {
  const workDate = resolveWorkDate(options);

  const endDate = options.isOvernight ? addCalendarDay(workDate) : workDate;

  const startsAt = zonedDateTimeToUtc(
    workDate,
    options.shiftStart,
    options.timezone,
  );

  const endsAt = zonedDateTimeToUtc(
    endDate,
    options.shiftEnd,
    options.timezone,
  );

  return {
    workDate,
    startsAt,
    endsAt,
  };
}
