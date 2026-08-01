import { Box, Paper, Typography } from "@mui/material";

import { Clock } from "@/components/ui";

import LoginForm from "@/features/auth/components/LoginForm";

import { getBrowserTimezone } from "@/utils/time";

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 4,
          }}
        >
          <Clock timezone={getBrowserTimezone()} locale="en-US" variant="inline" />
        </Box>

        <Typography
          variant="h4"
          align="center"
          sx={{
            fontWeight: 700,
            mb: 1,
          }}
        >
          WorkPulse
        </Typography>

        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          sx={{
            mb: 4,
          }}
        >
          Attendance & Payroll System
        </Typography>

        <LoginForm />
      </Paper>
    </Box>
  );
}
