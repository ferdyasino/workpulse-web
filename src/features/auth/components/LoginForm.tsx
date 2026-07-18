import { Box, Divider, Stack, TextField, Typography } from "@mui/material";

import { Button, GoogleButton } from "@/components/ui";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

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
            if (credentialResponse.credential) {
              await login(credentialResponse.credential);
              navigate("/dashboard");
            }
          }}
          onError={() => {
            console.log("Google login failed");
          }}
        />
      </Box>
    </Stack>
  );
}
