import { createContext } from "react";

type Severity = "success" | "error" | "warning" | "info";

export type SnackbarContextValue = {
  show: (message: string, severity?: Severity) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
};

export const SnackbarContext = createContext<SnackbarContextValue | null>(null);
