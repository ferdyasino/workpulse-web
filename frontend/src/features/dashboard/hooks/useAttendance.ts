import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";

import { getCurrentAttendanceState, submitTimeLogAction } from "../services/attendance.service";

import type { AttendanceState, TimeLogAction } from "../types/attendance.types";

export function useAttendance() {
  const { user } = useAuth();

  const submitting = useRef(false);

  const [state, setState] = useState<AttendanceState | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.workspace_id || !user.email) {
      setState(null);
      setIsLoading(false);

      return null;
    }

    try {
      setIsLoading(true);

      console.group("ATTENDANCE REFRESH");

      const attendance = await getCurrentAttendanceState(
        user.workspace_id,
        user.email,
        user.shift_id ?? undefined,
      );

      console.log("REFRESH RESULT:", attendance);

      setState(attendance);

      console.groupEnd();

      return attendance;
    } finally {
      setIsLoading(false);
    }
  }, [user?.workspace_id, user?.email, user?.shift_id]);

  const logTime = useCallback(
    async (action: TimeLogAction) => {
      if (!user?.workspace_id || !user.email || !user.user_id) {
        throw new Error("Incomplete user context.");
      }

      if (submitting.current) {
        console.warn("Duplicate submit ignored.");
        return;
      }

      submitting.current = true;
      setIsSubmitting(true);

      try {
        console.group(`ATTENDANCE ACTION → ${action}`);

        const response = await submitTimeLogAction(user.workspace_id, {
          user_id: user.user_id,
          email: user.email,
          shift_id: user.shift_id ?? undefined,

          action,

          device_info: navigator.userAgent,

          location: "",

          location_status: "DISABLED",

          location_message: "Location tracking is temporarily disabled.",

          timestamp: new Date().toISOString(),
        });

        console.log("ACTION RESPONSE:", response);

        if (!response.success) {
          throw new Error(response.message ?? "Attendance action failed.");
        }

        if (response.state) {
          console.log("STATE FROM RESPONSE:", response.state);

          setState(response.state);
        } else {
          await refresh();
        }

        console.groupEnd();

        return response;
      } catch (error) {
        console.error("Attendance action failed:", error);

        throw error;
      } finally {
        submitting.current = false;
        setIsSubmitting(false);
      }
    },
    [user, refresh],
  );

  // Initial load and refresh whenever user context changes.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Auto sync every 30 seconds.
  useEffect(() => {
    if (!user?.workspace_id || !user.email) {
      return;
    }

    const interval = window.setInterval(() => {
      void refresh();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [user?.workspace_id, user?.email, refresh]);

  // Refresh when returning to the tab.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refresh]);

  return {
    state,
    isLoading,
    isSubmitting,
    refresh,
    logTime,
  };
}
