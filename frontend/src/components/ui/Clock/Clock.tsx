import { useEffect, useState } from "react";

import { Paper, Stack, Typography } from "@mui/material";

type ClockProps = {
  timezone?: string;
  locale?: string;
  variant?: "card" | "inline" | "header";
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

export default function Clock({
  timezone = "UTC",
  locale = "en-US",
  variant = "card",
}: ClockProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const content = (
    <Stack
      spacing={0.5}
      sx={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Typography
        sx={{
          fontSize: variant === "header" ? "1.25rem" : variant === "inline" ? "3rem" : "2.25rem",
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: variant === "header" ? 0.5 : 1,
        }}
      >
        {formatTime(now, timezone, locale)}
      </Typography>

      <Typography
        sx={{
          fontSize: variant === "header" ? "0.75rem" : variant === "inline" ? "1rem" : "0.875rem",
          color: "text.secondary",
        }}
      >
        {formatDate(now, timezone, locale)}
      </Typography>
    </Stack>
  );

  if (variant === "inline" || variant === "header") {
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
