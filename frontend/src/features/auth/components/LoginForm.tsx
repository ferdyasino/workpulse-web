import { useState } from "react";

import { Divider, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { Button, GoogleButton, useSnackbar } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function LoginForm() {
  const navigate = useNavigate();

  const { login, loginWithEmail } = useAuth();
  const snackbar = useSnackbar();

  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  function backToOptions() {
    if (loading) {
      return;
    }

    setEmailMode(false);
    setEmail("");
    setPassword("");
  }

  async function handleEmailLogin() {
    if (loading) {
      return;
    }

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      snackbar.error("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      await loginWithEmail(normalizedEmail, password);

      snackbar.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : "Unable to login.");
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword() {
    if (loading) {
      return;
    }

    navigate("/forgot-password", {
      state: {
        email: email.trim(),
      },
    });
  }

  return (
    <Stack
      spacing={3}
      sx={{
        width: "100%",
        alignItems: "center",
      }}
    >
      {!emailMode && (
        <>
          <GoogleButton
            onSuccess={async (response) => {
              if (loading) {
                return;
              }

              try {
                if (!response.credential) {
                  snackbar.error("Google authentication failed.");
                  return;
                }

                setLoading(true);

                await login(response.credential);

                snackbar.success("Welcome back!");
                navigate("/dashboard");
              } catch (err) {
                snackbar.error(
                  err instanceof Error ? err.message : "Unable to sign in with Google.",
                );
              } finally {
                setLoading(false);
              }
            }}
            onError={() => {
              snackbar.error("Google sign-in failed.");
            }}
          />

          <Divider sx={{ width: "100%" }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Button
            variant="contained"
            size="large"
            disabled={loading}
            onClick={() => {
              setEmailMode(true);
            }}
          >
            Login with Email
          </Button>
        </>
      )}

      {emailMode && (
        <>
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            fullWidth
            value={email}
            disabled={loading}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleEmailLogin();
              }
            }}
          />

          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            fullWidth
            value={password}
            disabled={loading}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleEmailLogin();
              }
            }}
          />

          <Button
            variant="contained"
            size="large"
            disabled={loading}
            onClick={() => {
              void handleEmailLogin();
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <Button variant="text" disabled={loading} onClick={handleForgotPassword}>
            Forgot Password?
          </Button>

          <Button variant="text" disabled={loading} onClick={backToOptions}>
            Back to Login Options
          </Button>
        </>
      )}
    </Stack>
  );
}
