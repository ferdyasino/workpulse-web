import { Button, Divider, Stack, TextField } from "@mui/material";

import GoogleIcon from "@mui/icons-material/Google";

export default function LoginForm() {
  return (
    <Stack spacing={2}>
      <TextField label="Email" type="email" fullWidth />

      <TextField label="Password" type="password" fullWidth />

      <Button variant="contained" size="large" fullWidth>
        Sign In
      </Button>

      <Divider>OR</Divider>

      <Button variant="outlined" size="large" startIcon={<GoogleIcon />} fullWidth>
        Continue with Google
      </Button>
    </Stack>
  );
}
