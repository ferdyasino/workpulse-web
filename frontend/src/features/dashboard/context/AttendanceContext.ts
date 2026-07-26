import { createContext, useContext } from "react";

import type { AttendanceState, TimeLogAction } from "@/features/dashboard/types/attendance.types";

type AttendanceContextType = {
  state: AttendanceState | null;
  isLoading: boolean;
  isSubmitting: boolean;
  refresh: () => Promise<AttendanceState | null>;
  logTime: (action: TimeLogAction) => Promise<unknown>;
};

export const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function useAttendanceContext() {
  const context = useContext(AttendanceContext);

  if (context === undefined) {
    throw new Error("useAttendanceContext must be used within an AttendanceProvider");
  }

  return context;
}
