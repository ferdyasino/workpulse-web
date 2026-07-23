import type { Tables } from "../../types/database.ts";

import type {
  AttendanceSession,
  TimeLogEvent,
} from "@shared/types/attendance.types.ts";

export function createEmptyAttendanceSession(): AttendanceSession {
  return {
    time_in: null,
    time_out: null,

    breaks: [],

    lunch: {
      in: null,
      out: null,
    },
  };
}

export function buildAttendanceSessions(
  logs: Tables<"time_logs">[],
): AttendanceSession[] {
  const sessions: AttendanceSession[] = [];

  let current: AttendanceSession | null = null;

  for (const log of logs) {
    const event = log.event_type as TimeLogEvent;

    switch (event) {
      case "TIME_IN": {
        if (current && !current.time_out) {
          console.warn(
            "TIME_IN encountered before TIME_OUT. Closing previous session.",
            log.id,
          );

          current.time_out = log.event_time_utc;
        }

        current = createEmptyAttendanceSession();

        current.time_in = log.event_time_utc;

        sessions.push(current);

        break;
      }

      case "BREAK_START": {
        if (!current) {
          console.warn("BREAK_START without active session.", log.id);
          break;
        }

        const activeBreak = current.breaks.at(-1);

        if (activeBreak && !activeBreak.out) {
          console.warn("BREAK_START while already on break.", log.id);
          break;
        }

        current.breaks.push({
          in: log.event_time_utc,
          out: null,
        });

        break;
      }

      case "BREAK_END": {
        if (!current) {
          console.warn("BREAK_END without active session.", log.id);
          break;
        }

        const activeBreak = current.breaks.at(-1);

        if (!activeBreak || activeBreak.out) {
          console.warn("BREAK_END without BREAK_START.", log.id);
          break;
        }

        activeBreak.out = log.event_time_utc;

        break;
      }

      case "LUNCH_START": {
        if (!current) {
          console.warn("LUNCH_START without active session.", log.id);
          break;
        }

        if (current.lunch.in && !current.lunch.out) {
          console.warn("LUNCH_START while already at lunch.", log.id);
          break;
        }

        current.lunch = {
          in: log.event_time_utc,
          out: null,
        };

        break;
      }

      case "LUNCH_END": {
        if (!current) {
          console.warn("LUNCH_END without active session.", log.id);
          break;
        }

        if (!current.lunch.in || current.lunch.out) {
          console.warn("LUNCH_END without LUNCH_START.", log.id);
          break;
        }

        current.lunch.out = log.event_time_utc;

        break;
      }

      case "TIME_OUT": {
        if (!current) {
          console.warn("TIME_OUT without TIME_IN.", log.id);
          break;
        }

        current.time_out = log.event_time_utc;

        current = null;

        break;
      }

      default: {
        console.warn("Unknown attendance event.", event, log.id);
      }
    }
  }

  return sessions;
}

export function getCurrentAttendanceSession(
  sessions: AttendanceSession[],
): AttendanceSession | null {
  const session = sessions.at(-1);

  if (!session) {
    return null;
  }

  if (session.time_out) {
    return null;
  }

  return session;
}
