export type TimeFormat = "12h" | "24h";

export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila";
}

export function formatTime(value: string | null | undefined, format: TimeFormat = "24h"): string {
  if (!value) {
    return "--";
  }

  const [hour, minute] = value.split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return "--";
  }

  if (format === "24h") {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;

  return `${h}:${minute.toString().padStart(2, "0")} ${period}`;
}

export function formatShiftTime(
  value: string | null | undefined,
  format: TimeFormat = "24h",
): string {
  return formatTime(value, format);
}

export function formatTimestamp(
  value: string | null | undefined,
  timezone?: string,
  locale = "en-US",
  format: TimeFormat = "24h",
): string {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone || getBrowserTimezone(),
    hour: "2-digit",
    minute: "2-digit",
    hour12: format === "12h",
  }).format(new Date(value));
}

export function formatDateInput(date: Date, timezone?: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone || getBrowserTimezone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function formatDate(value: string | Date, timezone?: string, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone || getBrowserTimezone(),
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
