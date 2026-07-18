import { Paper } from "@mui/material";
import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  sx?: object;
};

export default function GlassCard({ children, sx }: GlassCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.15)",
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}
