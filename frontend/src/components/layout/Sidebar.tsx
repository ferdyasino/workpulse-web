import { Box } from "@mui/material";

import { Clock } from "@/components/ui";
import TodaySummary from "@/features/dashboard/components/TodaySummary";

export default function Sidebar() {
  return (
    <Box
      sx={{
        width: {
          xs: "100%",
          md: 420,
        },
        p: 2,
      }}
    >
      <Clock timezone="America/New_York" />

      {/* Desktop only */}
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
