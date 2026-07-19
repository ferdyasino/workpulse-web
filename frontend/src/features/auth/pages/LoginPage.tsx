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
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 5,
        }}
      >
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{
            fontWeight: 700,
          }}
        >
          WorkPulse
        </Typography>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Attendance & Payroll System
        </Typography>

        <LoginForm />
      </Paper>
    </Box>
  );
}
