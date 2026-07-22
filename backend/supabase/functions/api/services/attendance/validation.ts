import type { AttendanceState, TimeLogEvent } from "./types.ts";

export type AttendanceValidationResult =
  | {
      valid: true;
    }
  | {
      valid: false;
      message: string;
    };

export function validateAttendanceAction(
  state: AttendanceState,
  action: TimeLogEvent,
): AttendanceValidationResult {
  const session = state.current_session;

  switch (action) {
    case "TIME_IN": {
      if (session && !session.time_out) {
        return {
          valid: false,
          message: "Already clocked in.",
        };
      }

      return {
        valid: true,
      };
    }

    case "TIME_OUT": {
      if (!session) {
        return {
          valid: false,
          message: "No active session.",
        };
      }

      if (session.time_out) {
        return {
          valid: false,
          message: "Already clocked out.",
        };
      }

      const activeBreak = session.breaks.at(-1);

      if (activeBreak && !activeBreak.out) {
        return {
          valid: false,
          message: "End break before clocking out.",
        };
      }

      if (session.lunch.in && !session.lunch.out) {
        return {
          valid: false,
          message: "End lunch before clocking out.",
        };
      }

      return {
        valid: true,
      };
    }

    case "BREAK_START": {
      if (!session || session.time_out) {
        return {
          valid: false,
          message: "You are not clocked in.",
        };
      }

      const activeBreak = session.breaks.at(-1);

      if (activeBreak && !activeBreak.out) {
        return {
          valid: false,
          message: "Break already active.",
        };
      }

      if (session.lunch.in && !session.lunch.out) {
        return {
          valid: false,
          message: "Cannot start break during lunch.",
        };
      }

      return {
        valid: true,
      };
    }

    case "BREAK_END": {
      if (!session) {
        return {
          valid: false,
          message: "No active session.",
        };
      }

      const activeBreak = session.breaks.at(-1);

      if (!activeBreak || activeBreak.out) {
        return {
          valid: false,
          message: "No active break.",
        };
      }

      return {
        valid: true,
      };
    }

    case "LUNCH_START": {
      if (!session || session.time_out) {
        return {
          valid: false,
          message: "You are not clocked in.",
        };
      }

      if (session.lunch.in && !session.lunch.out) {
        return {
          valid: false,
          message: "Lunch already active.",
        };
      }

      const activeBreak = session.breaks.at(-1);

      if (activeBreak && !activeBreak.out) {
        return {
          valid: false,
          message: "Cannot start lunch during break.",
        };
      }

      return {
        valid: true,
      };
    }

    case "LUNCH_END": {
      if (!session) {
        return {
          valid: false,
          message: "No active session.",
        };
      }

      if (!session.lunch.in || session.lunch.out) {
        return {
          valid: false,
          message: "No active lunch.",
        };
      }

      return {
        valid: true,
      };
    }

    default: {
      return {
        valid: false,
        message: "Unsupported attendance action.",
      };
    }
  }
}
