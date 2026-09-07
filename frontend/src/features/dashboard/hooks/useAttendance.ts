import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";

import { getCurrentAttendanceState, submitTimeLogAction } from "../services/attendance.service";

import type { AttendanceState, TimeLogAction } from "../types/attendance.types";

const platformOwnerEmail = import.meta.env.VITE_PLATFORM_OWNER_EMAIL?.trim().toLowerCase();

export function useAttendance() {
  const { user } = useAuth();

  const submitting = useRef(false);

  const [state, setState] = useState<AttendanceState | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * Platform Owner is identified exclusively by
   * PLATFORM_OWNER_EMAIL.
   *
   * Workspace assignment does NOT determine ownership.
   */
  const isPlatformOwner =
    Boolean(user?.email) &&
    Boolean(platformOwnerEmail) &&
    user!.email.trim().toLowerCase() === platformOwnerEmail;

  const refresh = useCallback(async () => {
    if (!user?.email) {
      setState(null);
      setIsLoading(false);

      return null;
    }

    /*
     * Send the user's actual workspace_id when available.
     *
     * Platform Owner may have:
     *
     * - a workspace_id
     * - no workspace_id
     *
     * The backend identifies Platform Owner by email,
     * not by workspace_id.
     */
    const workspaceId = user.workspace_id ?? null;

    try {
      setIsLoading(true);

      console.group(isPlatformOwner ? "PLATFORM OWNER ATTENDANCE REFRESH" : "ATTENDANCE REFRESH");

      const attendance = await getCurrentAttendanceState(workspaceId, user.email);

      console.log("REQUEST:", {
        workspace_id: workspaceId,
        email: user.email,
        is_platform_owner: isPlatformOwner,
      });

      console.log("ATTENDANCE RESULT:", attendance);

      console.log("SHIFT FROM STATE:", attendance.shift);

      setState(attendance);

      console.groupEnd();

      return attendance;
    } finally {
      setIsLoading(false);
    }
  }, [isPlatformOwner, user?.workspace_id, user?.email]);

  const logTime = useCallback(
    async (action: TimeLogAction) => {
      if (!user?.email || !user.user_id) {
        throw new Error("Incomplete user context.");
      }

      /*
       * Only non-Platform-Owner users require a workspace.
       *
       * Platform Owner can have a workspace or no workspace.
       */
      if (!isPlatformOwner && !user.workspace_id) {
        throw new Error("User workspace_id is missing.");
      }

      if (submitting.current) {
        console.warn("Duplicate submit ignored.");

        return;
      }

      submitting.current = true;

      setIsSubmitting(true);

      try {
        console.group(`ATTENDANCE ACTION → ${action}`);

        const workspaceId = user.workspace_id ?? null;

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

        console.log("REQUEST:", {
          workspace_id: workspaceId,
          action_type: action,
          user_id: user.user_id,
          email: user.email,
          is_platform_owner: isPlatformOwner,
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
    [user, isPlatformOwner, refresh],
  );

  /*
   * Initial attendance-state load.
   */
  useEffect(() => {
    void refresh();
  }, [refresh]);

  /*
   * Refresh attendance state every 30 seconds.
   *
   * Platform Owner and normal employees are both supported.
   *
   * workspace_id is always the user's actual workspace_id,
   * or null when the user has no workspace.
   */
  useEffect(() => {
    if (!user?.email) {
      return;
    }

    if (!isPlatformOwner && !user.workspace_id) {
      return;
    }

    const interval = window.setInterval(() => {
      void refresh();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isPlatformOwner, user?.workspace_id, user?.email, refresh]);

  /*
   * Refresh attendance state when the browser becomes
   * visible again.
   */
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

    isPlatformOwner,
  };
}
