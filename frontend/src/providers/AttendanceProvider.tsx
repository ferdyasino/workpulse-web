import type { ReactNode } from "react";

import { useAttendance } from "@/features/dashboard/hooks/useAttendance";

import { AttendanceContext } from "../features/dashboard/context/AttendanceContext";

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const attendance = useAttendance();

  return <AttendanceContext.Provider value={attendance}>{children}</AttendanceContext.Provider>;
}
