import { createContext, useContext } from "react";

import type { Settings, UpdateSettingsRequest } from "@/features/settings/types/settings.types";

type SettingsContextValue = {
  settings: Settings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  refresh: () => Promise<Settings>;
  save: (values: UpdateSettingsRequest) => Promise<Settings>;
};

export const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function useSettingsContext() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettingsContext must be used inside SettingsProvider");
  }

  return context;
}
