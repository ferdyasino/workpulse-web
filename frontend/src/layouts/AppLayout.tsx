import type { ReactNode } from "react";

import { Box } from "@mui/material";
import { useLocation } from "react-router-dom";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

type Props = {
  children: ReactNode;
};

export default function AppLayout({ children }: Props) {
  const { pathname } = useLocation();

  const isDashboard = pathname === "/dashboard";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Header showClock={!isDashboard} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: isDashboard ? "420px minmax(0,1fr)" : "minmax(0,1fr)",
          },
          gap: 3,
          p: 2,
        }}
      >
        {isDashboard && <Sidebar />}

        <Box
          component="main"
          sx={{
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {children}
        </Box>

        <Box
          sx={{
            display: {
              xs: "block",
              md: "none",
            },
          }}
        >
          {/* TodaySummary moves here */}
        </Box>
      </Box>
    </Box>
  );
}
