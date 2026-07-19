import type { ReactNode } from "react";

import { Box } from "@mui/material";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

type Props = {
  children: ReactNode;
};

export default function AppLayout({ children }: Props) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Header />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "420px 1fr",
          },
          gap: 3,
          p: 2,
        }}
      >
        {/* DESKTOP SIDEBAR / MOBILE CLOCK */}
        <Sidebar />

        {/* DASHBOARD */}
        <Box
          component="main"
          sx={{
            order: {
              xs: 2,
              md: 2,
            },
          }}
        >
          {children}
        </Box>

        {/* MOBILE ONLY SUMMARY POSITION */}
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
