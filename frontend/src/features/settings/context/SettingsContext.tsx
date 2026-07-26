import { createContext, useContext, type ReactNode } from "react";

import { useSettings } from "@/features/settings/hooks/useSettings";

import type { Settings, UpdateSettingsRequest } from "@/features/settings/types/settings.types";

type SettingsContextValue = {
  settings: Settings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  refresh: () => Promise<Settings | null>;
  save: (values: UpdateSettingsRequest) => Promise<Settings>;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSettings();

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettingsContext must be used inside SettingsProvider");
  }

  return context;
}
