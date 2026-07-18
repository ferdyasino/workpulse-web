import { Avatar, Box, Paper, Typography } from "@mui/material";

export default function ProfileCard() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Avatar
          sx={{
            width: 80,
            height: 80,
            fontSize: 28,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          GU
        </Avatar>

        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
            }}
          >
            Guest User
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
            }}
          >
            Agent
          </Typography>

          <Typography variant="body2" color="text.secondary">
            1st Shift
          </Typography>

          <Typography
            sx={{
              mt: 1,
              fontWeight: 700,
            }}
          >
            NOT STARTED
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
