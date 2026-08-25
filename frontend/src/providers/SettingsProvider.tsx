import type { ReactNode } from "react";

import { SettingsContext } from "@/features/settings/context/SettingsContext";

import { useSettings } from "@/features/settings/hooks/useSettings";

export default function SettingsProvider({ children }: { children: ReactNode }) {
  const value = useSettings();
  const contextValue = {
    ...value,
    refresh: async () => {
      const settings = await value.refresh();

      if (settings === undefined) {
        throw new Error("Unable to refresh settings");
      }

      return settings;
    },
  };

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
}
