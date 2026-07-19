import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";

import { getCurrentAttendanceState, submitTimeLogAction } from "../services/attendance.service";

import type { AttendanceState, TimeLogAction } from "../types/attendance.types";

export function useAttendance() {
  const { user } = useAuth();

  const initialized = useRef(false);
  const submitting = useRef(false);

  const [state, setState] = useState<AttendanceState | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setState(null);
      setIsLoading(false);
      return null;
    }

    try {
      setIsLoading(true);

      const attendance = await getCurrentAttendanceState(
        user.workspace_id,
        user.email,
        user.shift_id,
      );

      if ((attendance as any)?.success === false) {
        throw new Error((attendance as any).message);
      }

      setState(attendance);

      return attendance;
    } finally {
      setIsLoading(false);
    }
  }, [user?.workspace_id, user?.email, user?.shift_id]);

  const logTime = useCallback(
    async (action: TimeLogAction) => {
      if (!user) {
        throw new Error("User is not authenticated.");
      }

      if (submitting.current) {
        return;
      }

      submitting.current = true;
      setIsSubmitting(true);

      try {
        const response = await submitTimeLogAction(user.workspace_id, {
          user_id: user.user_id,

          email: user.email,

          shift_id: user.shift_id,

          action,

          device_info: navigator.userAgent,

          location: null,

          location_status: "DISABLED",

          location_message: "Location tracking is temporarily disabled.",

          timestamp: new Date().toISOString(),
        });

        if (!response.success) {
          throw new Error(response.message);
        }

        if (response.state) {
          setState(response.state);
        } else {
          await refresh();
        }

        return response;
      } finally {
        submitting.current = false;
        setIsSubmitting(false);
      }
    },
    [user, refresh],
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    if (initialized.current) {
      return;
    }

    initialized.current = true;

    void refresh();
  }, [user, refresh]);

  return {
    state,
    isLoading,
    isSubmitting,
    refresh,
    logTime,
  };
}
