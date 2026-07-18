import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";

import { getCurrentAttendanceState, submitTimeLogAction } from "../services/attendance.service";

import type { AttendanceState, TimeLogAction } from "../types/attendance.types";

export function useAttendance() {
  const { user } = useAuth();

  const mounted = useRef(false);

  const [state, setState] = useState<AttendanceState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setState(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);

    try {
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
  }, [user]);

  const logTime = useCallback(
    async (action: TimeLogAction) => {
      if (!user) {
        throw new Error("User is not authenticated.");
      }

      if (isSubmitting) {
        return;
      }

      setIsSubmitting(true);

      try {
        let location: GeolocationPosition | null = null;
        let locationStatus = "UNAVAILABLE";
        let locationMessage = "Geolocation unavailable";

        try {
          location = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });

          locationStatus = "OK";
          locationMessage = "";
        } catch (error) {
          if (error instanceof GeolocationPositionError) {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                locationStatus = "DENIED";
                locationMessage = "Location permission denied.";
                break;

              case error.POSITION_UNAVAILABLE:
                locationStatus = "UNAVAILABLE";
                locationMessage = "Location unavailable.";
                break;

              case error.TIMEOUT:
                locationStatus = "TIMEOUT";
                locationMessage = "Location request timed out.";
                break;

              default:
                locationStatus = "ERROR";
                locationMessage = error.message;
            }
          }
        }

        const response = await submitTimeLogAction(user.workspace_id, {
          user_id: user.user_id,
          email: user.email,
          shift_id: user.shift_id,
          action,
          device_info: navigator.userAgent,
          location: location
            ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
              }
            : null,
          location_status: locationStatus,
          location_message: locationMessage,
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
        setIsSubmitting(false);
      }
    },
    [user, refresh, isSubmitting],
  );

  useEffect(() => {
    if (mounted.current) {
      return;
    }

    mounted.current = true;

    void refresh();
  }, [refresh]);

  return {
    state,
    isLoading,
    isSubmitting,
    refresh,
    logTime,
  };
}
