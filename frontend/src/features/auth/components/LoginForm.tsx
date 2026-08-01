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
    setEmailMode(false);
    setEmail("");
    setPassword("");
  }

  async function handleEmailLogin() {
    if (!email || !password) {
      snackbar.error("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      await loginWithEmail(email, password);

      snackbar.success("Welcome back!");

      navigate("/dashboard");
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : "Unable to login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={3}>
      {!emailMode && (
        <>
          <GoogleButton
            onSuccess={async (response) => {
              try {
                if (!response.credential) {
                  snackbar.error("Google authentication failed.");
                  return;
                }

                await login(response.credential);

                snackbar.success("Welcome back!");

                navigate("/dashboard");
              } catch (err) {
                snackbar.error(
                  err instanceof Error ? err.message : "Unable to sign in with Google.",
                );
              }
            }}

            onError={() => {
              snackbar.error("Google sign-in failed.");
            }}
          />

          <Divider>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Button
            variant="contained"
            size="large"
            fullWidth
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
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />

          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            fullWidth
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleEmailLogin();
              }
            }}
          />

          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            onClick={handleEmailLogin}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <Button variant="text" fullWidth onClick={backToOptions}>
            Back to Login Options
          </Button>
        </>
      )}
    </Stack>
  );
}
