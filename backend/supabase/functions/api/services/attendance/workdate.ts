export type ResolveWorkDateOptions = {
  timestamp: Date;

  shiftStart: string; // HH:mm:ss

  shiftEnd: string; // HH:mm:ss

  isOvernight: boolean;

  timezone: string;
};

function toMinutes(time: string): number {
  const [hour = 0, minute = 0] = time.split(":").map(Number);

  return hour * 60 + minute;
}

function formatDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getMinutes(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");

  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "0",
  );

  return hour * 60 + minute;
}

function subtractOneDay(date: Date, timezone: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === "year")?.value);

  const month = Number(parts.find((p) => p.type === "month")?.value);

  const day = Number(parts.find((p) => p.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day - 1, 12, 0, 0));
}

export function resolveWorkDate(options: ResolveWorkDateOptions): string {
  const { timestamp, shiftEnd, isOvernight, timezone } = options;

  let workDate = timestamp;

  if (isOvernight) {
    const currentMinutes = getMinutes(timestamp, timezone);

    const endMinutes = toMinutes(shiftEnd);

    if (currentMinutes < endMinutes) {
      workDate = subtractOneDay(timestamp, timezone);
    }
  }

  return formatDate(workDate, timezone);
}
