import { Button, Divider, Stack, TextField } from "@mui/material";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";

import { GoogleLogin } from "@react-oauth/google";

export default function LoginForm() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  return (
    <Stack spacing={2}>
      <TextField label="Email" type="email" fullWidth />

      <TextField label="Password" type="password" fullWidth />

      <Button variant="contained" size="large" fullWidth>
        Sign In
      </Button>

      <Divider>OR</Divider>

      <GoogleLogin
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
    </Stack>
  );
}
