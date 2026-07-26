import { useEffect, useState } from "react";

import { Paper, Stack, Typography } from "@mui/material";

type ClockProps = {
  timezone?: string;
  locale?: string;
  variant?: "card" | "inline";
};

function formatTime(date: Date, timezone: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(date);
}

function formatDate(date: Date, timezone: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  }).format(date);
}

export default function Clock({ timezone, locale = "en-US", variant = "card" }: ClockProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!timezone) {
    return null;
  }

  const content = (
    <Stack spacing={1} sx={{ alignItems: "center" }}>
      <Typography
        variant={variant === "inline" ? "h5" : "h3"}
        sx={{
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        {formatTime(now, timezone, locale)}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        {formatDate(now, timezone, locale)}
      </Typography>
    </Stack>
  );

  if (variant === "inline") {
    return content;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
      }}
    >
      {content}
    </Paper>
  );
}
