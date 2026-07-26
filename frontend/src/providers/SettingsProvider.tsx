import type { ReactNode } from "react";

import { SettingsContext } from "@/features/settings/context/SettingsContext";

import { useSettings } from "@/features/settings/hooks/useSettings";

export default function SettingsProvider({ children }: { children: ReactNode }) {
  const value = useSettings();

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
