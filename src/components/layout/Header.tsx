import { AppBar, Toolbar, Typography } from "@mui/material";
import { Button } from "@mui/material";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function Header() {
  const { signOut } = useAuth();

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography variant="h6">WorkPulse</Typography>

        <Button sx={{ ml: "auto" }} onClick={signOut}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}
