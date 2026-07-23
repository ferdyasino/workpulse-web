import { createContext, useContext, type ReactNode } from "react";

import { useAttendance } from "@/features/dashboard/hooks/useAttendance";

import type { AttendanceState, TimeLogAction } from "@/features/dashboard/types/attendance.types";

type AttendanceContextType = {
  state: AttendanceState | null;
  isLoading: boolean;
  isSubmitting: boolean;
  refresh: () => Promise<AttendanceState | null>;
  logTime: (action: TimeLogAction) => Promise<unknown>;
};

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const attendance = useAttendance();

  return <AttendanceContext.Provider value={attendance}>{children}</AttendanceContext.Provider>;
}

export function useAttendanceContext() {
  const context = useContext(AttendanceContext);

  if (context === undefined) {
    throw new Error("useAttendanceContext must be used within an AttendanceProvider");
  }

  return context;
}
