import { Box, Divider, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { Button, GoogleButton, useSnackbar } from "@/components/ui";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const snackbar = useSnackbar();

  return (
    <Stack spacing={3}>
      <TextField label="Email" type="email" fullWidth />

      <TextField label="Password" type="password" fullWidth />

      <Button variant="contained" size="large" fullWidth>
        Sign In
      </Button>

      <Divider>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          "& > div": {
            width: "100%",
            maxWidth: 360,
            display: "flex",
            justifyContent: "center",
          },
        }}
      >
        <GoogleButton
          onSuccess={async (credentialResponse) => {
            try {
              if (!credentialResponse.credential) {
                snackbar.error("Google authentication failed.");
                return;
              }

              await login(credentialResponse.credential);

              snackbar.success("Welcome back!");

              navigate("/dashboard");
            } catch (err) {
              snackbar.error(err instanceof Error ? err.message : "Unable to sign in with Google.");
            }
          }}
          onError={() => {
            snackbar.error("Google sign-in was cancelled or failed.");
          }}
        />
      </Box>
    </Stack>
  );
}
