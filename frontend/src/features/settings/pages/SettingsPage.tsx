import { Paper, Typography } from "@mui/material";

export default function SettingsPage() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Settings
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 1,
        }}
      >
        Workspace and account settings will appear here.
      </Typography>
    </Paper>
  );
}
