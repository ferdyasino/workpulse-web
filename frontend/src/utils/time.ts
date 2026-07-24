export function formatTime(value: string, format: "12h" | "24h" = "24h"): string {
  const [hour, minute] = value.split(":").map(Number);

  if (format === "24h") {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;

  return `${h}:${minute.toString().padStart(2, "0")} ${period}`;
}
