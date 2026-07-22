import { Paper, Typography } from "@mui/material";

export default function AdminPage() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Admin Dashboard
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 1,
        }}
      >
        Administration features coming soon.
      </Typography>
    </Paper>
  );
}
