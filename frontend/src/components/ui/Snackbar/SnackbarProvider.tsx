import { createContext, useCallback, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

type Severity = "success" | "error" | "warning" | "info";

type SnackbarContextValue = {
  show: (message: string, severity?: Severity) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
};

export const SnackbarContext = createContext<SnackbarContextValue | null>(null);

type Props = {
  children: React.ReactNode;
};

export default function SnackbarProvider({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<Severity>("info");

  const show = useCallback((message: string, severity: Severity = "info") => {
    setMessage(message);
    setSeverity(severity);
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      show,
      success: (message: string) => show(message, "success"),
      error: (message: string) => show(message, "error"),
      warning: (message: string) => show(message, "warning"),
      info: (message: string) => show(message, "info"),
    }),
    [show],
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}

      <Snackbar
        open={open}
        autoHideDuration={4000}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        onClose={() => setOpen(false)}
      >
        <Alert
          severity={severity}
          variant="filled"
          onClose={() => setOpen(false)}
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}
