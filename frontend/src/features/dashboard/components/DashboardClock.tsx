import { Typography } from "@mui/material";

import { Clock, GlassCard } from "@/components/ui";
import { useSettingsContext } from "@/features/settings/context/SettingsContext";

export default function DashboardClock() {
  const { settings, loading } = useSettingsContext();

  if (loading || !settings) {
    return null;
  }

  return (
    <GlassCard>
      <Clock timezone={settings.timezone} locale={settings.locale} />

      <Typography
        variant="body2"
        sx={{
          textAlign: "center",
          color: "text.secondary",
          mt: 2,
        }}
      >
        Attendance Clock
      </Typography>
    </GlassCard>
  );
}
