export function formatTime(value: string, format: "12h" | "24h" = "24h"): string {
  const [hour, minute] = value.split(":").map(Number);

  if (format === "24h") {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;

  return `${h}:${minute.toString().padStart(2, "0")} ${period}`;
}

export function formatDateInput(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}
