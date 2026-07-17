import { Box, Paper, Typography } from "@mui/material";

import LoginForm from "@/features/auth/components/LoginForm";

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
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            textAlign: "center",
            fontWeight: 700,
          }}
          gutterBottom
        >
          WorkPulse
        </Typography>

        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            mb: 3,
          }}
          color="text.secondary"
        >
          Attendance & Payroll System
        </Typography>

        <LoginForm />
      </Paper>
    </Box>
  );
}
