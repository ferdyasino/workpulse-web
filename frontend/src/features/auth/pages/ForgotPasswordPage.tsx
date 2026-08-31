import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import { ArrowBack } from "@mui/icons-material";
import { Box, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";

import { Button, useSnackbar } from "@/components/ui";

import { requestPasswordReset } from "../services/auth.service";

type LocationState = {
  email?: string;
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const snackbar = useSnackbar();

  const locationState = location.state as LocationState | null;

  const [email, setEmail] = useState(locationState?.email ?? "");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      snackbar.error("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      await requestPasswordReset(normalizedEmail);

      /*
       * Always show the same result regardless of whether the email exists.
       *
       * This prevents account enumeration.
       */
      setSubmitted(true);
    } catch (err) {
      /*
       * We still avoid exposing account existence information.
       *
       * A technical Supabase error can be shown because it does not
       * intentionally reveal whether an account exists.
       */
      snackbar.error(
        err instanceof Error ? err.message : "Unable to process your password reset request.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleBackToLogin() {
    if (loading) {
      return;
    }

    navigate("/login");
  }

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
        <Stack spacing={3}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconButton aria-label="Back to login" disabled={loading} onClick={handleBackToLogin}>
              <ArrowBack />
            </IconButton>

            <Typography sx={{ fontWeight: 700 }}>Forgot Password</Typography>
          </Box>

          {!submitted ? (
            <>
              <Typography variant="body2" color="text.secondary">
                Enter your WorkPulse email address and we&apos;ll send you instructions to reset
                your password.
              </Typography>

              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                fullWidth
                autoFocus
                value={email}
                disabled={loading}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSubmit();
                  }
                }}
              />

              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                onClick={() => {
                  void handleSubmit();
                }}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <Button variant="text" disabled={loading} onClick={handleBackToLogin}>
                Back to Login
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body1">
                If an account exists for this email address, we&apos;ve sent password reset
                instructions.
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Please check your inbox and follow the link in the email. If you don&apos;t see it,
                check your spam or junk folder.
              </Typography>

              <Button variant="contained" size="large" fullWidth onClick={handleBackToLogin}>
                Back to Login
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
