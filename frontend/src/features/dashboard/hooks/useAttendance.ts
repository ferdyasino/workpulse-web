import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";

import { getCurrentAttendanceState, submitTimeLogAction } from "../services/attendance.service";

import type { AttendanceState, TimeLogAction } from "../types/attendance.types";

export function useAttendance() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const submitting = useRef(false);

  const [state, setState] = useState<AttendanceState | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * The selected workspace is the source of truth for attendance.
   *
   * Do NOT use user.workspace_id here.
   * Platform Owners can have multiple workspaces and therefore
   * user.workspace_id may legitimately be null.
   */
  const workspaceId = workspace?.id;

  const refresh = useCallback(async () => {
    if (!user?.email || !workspaceId) {
      setState(null);
      setIsLoading(false);

      return null;
    }

    try {
      setIsLoading(true);

      console.group("ATTENDANCE REFRESH");

      console.log("SELECTED WORKSPACE ID:", workspaceId);
      console.log("USER ID:", user.user_id);
      console.log("EMAIL:", user.email);
      console.log("PLATFORM OWNER:", user.meta?.platform_owner);

      const attendance = await getCurrentAttendanceState(workspaceId, user.email);

      console.log("REFRESH RESULT:", attendance);

      console.log("SHIFT FROM STATE:", attendance.shift);

      setState(attendance);

      console.groupEnd();

      return attendance;
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, user?.email, user?.user_id, user?.meta?.platform_owner]);

  const logTime = useCallback(
    async (action: TimeLogAction) => {
      console.log("ATTENDANCE USER CONTEXT:", user);
      console.log("USER ID:", user?.user_id);
      console.log("USER WORKSPACE ID:", user?.workspace_id);
      console.log("SELECTED WORKSPACE ID:", workspaceId);
      console.log("EMAIL:", user?.email);
      console.log("PLATFORM OWNER:", user?.meta?.platform_owner);

      if (!user?.email || !user.user_id) {
        throw new Error("Incomplete user context.");
      }

      if (!workspaceId) {
        throw new Error("No workspace is currently selected.");
      }

      if (submitting.current) {
        console.warn("Duplicate submit ignored.");

        return;
      }

      submitting.current = true;

      setIsSubmitting(true);

      try {
        console.group(`ATTENDANCE ACTION → ${action}`);

        const response = await submitTimeLogAction(workspaceId, {
          user_id: user.user_id,

          email: user.email,

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

          console.log("SHIFT FROM RESPONSE:", response.state.shift);

          setState(response.state);
        } else {
          await refresh();
        }

        console.groupEnd();

        return response;
      } finally {
        submitting.current = false;

        setIsSubmitting(false);
      }
    },
    [user, workspaceId, refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user?.email || !workspaceId) {
      return;
    }

    const interval = window.setInterval(() => {
      void refresh();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [user?.email, workspaceId, refresh]);

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
