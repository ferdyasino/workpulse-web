export type ResolveWorkDateOptions = {
  timestamp: Date;

  shiftStart: string; // HH:mm:ss

  shiftEnd: string; // HH:mm:ss

  isOvernight: boolean;
};

function toMinutes(time: string): number {
  const [hour = 0, minute = 0] = time.split(":").map(Number);

  return hour * 60 + minute;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function resolveWorkDate(options: ResolveWorkDateOptions): string {
  const { timestamp, shiftEnd, isOvernight } = options;

  if (!isOvernight) {
    return formatDate(timestamp);
  }

  const minutes = timestamp.getUTCHours() * 60 + timestamp.getUTCMinutes();

  const endMinutes = toMinutes(shiftEnd);

  if (minutes < endMinutes) {
    const previous = new Date(timestamp);

    previous.setUTCDate(previous.getUTCDate() - 1);

    return formatDate(previous);
  }

  return formatDate(timestamp);
}
