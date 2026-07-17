import { Button, Divider, Stack, TextField } from "@mui/material";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";

import GoogleIcon from "@mui/icons-material/Google";

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

      <Button
        variant="outlined"
        size="large"
        startIcon={<GoogleIcon />}
        fullWidth
        disabled={isLoading}
        onClick={async () => {
          await login();
          navigate("/dashboard");
        }}
      >
        Continue with Google
      </Button>
    </Stack>
  );
}
