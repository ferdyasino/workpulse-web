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

/* -------------------------------------------------------------------------- */
/* Timezone Helpers                                                           */
/* -------------------------------------------------------------------------- */

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

  /*
   * Some runtimes can represent midnight as 24:xx.
   *
   * Normalize hour 24 to 00 because we are constructing a UTC
   * representation of the local wall-clock components.
   */
  const hour = Number(values.hour) === 24 ? 0 : Number(values.hour);

  const local = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    hour,
    Number(values.minute),
    Number(values.second),
  );

  return (local - date.getTime()) / 60000;
}

/* -------------------------------------------------------------------------- */
/* Local Date/Time -> UTC                                                     */
/* -------------------------------------------------------------------------- */

function zonedDateTimeToUtc(
  date: string,
  time: string,
  timezone: string,
): Date {
  const [hour, minute, second = 0] = time.split(":").map(Number);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    !Number.isInteger(second) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    throw new Error(`Invalid shift time: ${time}`);
  }

  /*
   * First interpret the local wall-clock components as if they were UTC.
   *
   * We then subtract the actual timezone offset to obtain the real UTC
   * instant corresponding to that local date/time.
   */
  const assumedUtc = new Date(
    `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}.000Z`,
  );

  if (Number.isNaN(assumedUtc.getTime())) {
    throw new Error(`Invalid zoned date/time: ${date} ${time} ${timezone}`);
  }

  const offset = getTimezoneOffsetMinutes(assumedUtc, timezone);

  return new Date(assumedUtc.getTime() - offset * 60_000);
}

/* -------------------------------------------------------------------------- */
/* Calendar Helpers                                                           */
/* -------------------------------------------------------------------------- */

function addCalendarDay(date: string): string {
  const value = new Date(`${date}T12:00:00.000Z`);

  if (Number.isNaN(value.getTime())) {
    throw new Error(`Invalid calendar date: ${date}`);
  }

  value.setUTCDate(value.getUTCDate() + 1);

  return value.toISOString().slice(0, 10);
}

/* -------------------------------------------------------------------------- */
/* Work Window                                                                */
/* -------------------------------------------------------------------------- */

export function resolveWorkWindow(
  options: ResolveWorkWindowOptions,
): WorkWindow {
  if (Number.isNaN(options.timestamp.getTime())) {
    throw new Error("Invalid attendance timestamp.");
  }

  if (!options.timezone) {
    throw new Error("Shift timezone is required.");
  }

  /*
   * work_date is the shift-aware attendance date.
   *
   * This is especially important for overnight shifts.
   */
  const workDate = resolveWorkDate(options);

  /*
   * Overnight shifts finish on the following calendar day.
   */
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

  /*
   * A valid work window must have a positive duration.
   */
  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new Error(
      `Invalid work window: ${options.shiftStart} -> ${options.shiftEnd} (${options.timezone})`,
    );
  }

  return {
    workDate,
    startsAt,
    endsAt,
  };
}
