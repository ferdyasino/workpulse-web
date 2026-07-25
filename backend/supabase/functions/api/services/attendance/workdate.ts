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
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
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

export function resolveWorkDate(options: ResolveWorkDateOptions): string {
  const { timestamp, shiftEnd, isOvernight, timezone } = options;

  if (!isOvernight) {
    return formatDate(timestamp, timezone);
  }

  const currentMinutes = getMinutes(timestamp, timezone);

  const endMinutes = toMinutes(shiftEnd);

  const workDate = new Date(timestamp);

  if (currentMinutes < endMinutes) {
    workDate.setUTCDate(workDate.getUTCDate() - 1);
  }

  return formatDate(workDate, timezone);
}
