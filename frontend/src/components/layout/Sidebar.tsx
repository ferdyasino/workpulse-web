import { Box } from "@mui/material";

import { Clock } from "@/components/ui";
import { useSettingsContext } from "@/features/settings/context/SettingsContext";
import TodaySummary from "@/features/dashboard/components/TodaySummary";

export default function Sidebar() {
  const { settings, loading } = useSettingsContext();

  return (
    <Box
      sx={{
        width: "100%",
        p: 2,
      }}
    >
      {!loading && settings && <Clock timezone={settings.timezone} locale={settings.locale} />}

      <Box
        sx={{
          display: {
            xs: "none",
            md: "block",
          },
          mt: 3,
        }}
      >
        <TodaySummary />
      </Box>
    </Box>
  );
}
