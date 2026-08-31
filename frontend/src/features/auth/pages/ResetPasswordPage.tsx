import { useEffect, useState } from "react";

import { Alert, Box, Paper, Stack, TextField, Typography } from "@mui/material";

import { useNavigate } from "react-router-dom";

import { Button, useSnackbar } from "@/components/ui";

import { updatePassword } from "@/features/auth/services/auth.service";

import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkRecoverySession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        setValidSession(Boolean(session));
      } catch {
        if (mounted) {
          setValidSession(false);
        }
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    void checkRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleResetPassword() {
    setError(null);

    if (!password || !confirmPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await updatePassword(password);

      await supabase.auth.signOut();

      snackbar.success("Your password has been updated.");

      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
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
        <Typography variant="body1" color="text.secondary">
          Verifying password reset link...
        </Typography>
      </Box>
    );
  }

  if (!validSession) {
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
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                }}
              >
                Reset Password
              </Typography>

              <Typography variant="body2" color="text.secondary">
                This password reset link is invalid or has expired.
              </Typography>
            </Box>

            <Alert severity="warning">Please request a new password reset link.</Alert>

            <Button variant="contained" size="large" onClick={() => navigate("/forgot-password")}>
              Request New Link
            </Button>

            <Button variant="text" onClick={() => navigate("/login")}>
              Back to Login
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
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
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              Set New Password
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Enter a new password for your WorkPulse account.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="New Password"
            type="password"
            autoComplete="new-password"
            fullWidth
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />

          <TextField
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            fullWidth
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleResetPassword();
              }
            }}
          />

          <Typography variant="caption" color="text.secondary">
            Password must contain at least 8 characters.
          </Typography>

          <Button
            variant="contained"
            size="large"
            disabled={loading}
            onClick={() => {
              void handleResetPassword();
            }}
          >
            {loading ? "Updating Password..." : "Update Password"}
          </Button>

          <Button variant="text" disabled={loading} onClick={() => navigate("/login")}>
            Back to Login
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
